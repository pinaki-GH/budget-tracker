'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'budgetTracker:leaveData'

const REQUIRED_COLUMNS = [
  'Member Name',
  'Leave Type',
  'Status',
  'PTO Days',
  'Start Date',
  'End Date'
]

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const CURRENT_YEAR = new Date().getFullYear()

function parseDate(dateString) {
  if (!dateString) {
    return null
  }

  const parts = dateString.split('-')

  if (parts.length !== 3) {
    return null
  }

  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])

  if (
    !year ||
    !month ||
    !day
  ) {
    return null
  }

  return new Date(
    year,
    month - 1,
    day
  )
}

function formatDate(dateString) {
  if (!dateString) {
    return ''
  }

  const date = parseDate(dateString)

  if (!date) {
    return dateString
  }

  return date.toLocaleDateString('en-GB')
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isWeekday(date) {
  const day = date.getDay()

  return day !== 0 && day !== 6
}

function getWorkDaysInMonth(
  year,
  monthIndex
) {
  const firstDay = new Date(
    Number(year),
    Number(monthIndex),
    1
  )

  const lastDay = new Date(
    Number(year),
    Number(monthIndex) + 1,
    0
  )

  let count = 0

  const current = new Date(firstDay)

  while (current <= lastDay) {

    if (isWeekday(current)) {
      count++
    }

    current.setDate(
      current.getDate() + 1
    )
  }

  return count
}

function getDatesInRange(
  startDate,
  endDate
) {
  const dates = []

  const current = new Date(startDate)

  while (current <= endDate) {

    dates.push(
      new Date(current)
    )

    current.setDate(
      current.getDate() + 1
    )
  }

  return dates
}

function getRecordDatesInMonth(
  record,
  year,
  monthIndex
) {
  const startDate =
    parseDate(record['Start Date'])

  const endDate =
    parseDate(record['End Date'])

  if (!startDate || !endDate) {
    return []
  }

  const monthStart =
    new Date(
      Number(year),
      Number(monthIndex),
      1
    )

  const monthEnd =
    new Date(
      Number(year),
      Number(monthIndex) + 1,
      0
    )

  const effectiveStart =
    startDate > monthStart
      ? startDate
      : monthStart

  const effectiveEnd =
    endDate < monthEnd
      ? endDate
      : monthEnd

  if (
    effectiveStart >
    effectiveEnd
  ) {
    return []
  }

  return getDatesInRange(
    effectiveStart,
    effectiveEnd
  )
}

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function calculateAvailabilityForPeriod(
  records,
  member,
  year,
  startMonthIndex,
  endMonthIndex
) {
  const periodStart = new Date(
    Number(year),
    Number(startMonthIndex),
    1
  )

  const periodEnd = new Date(
    Number(year),
    Number(endMonthIndex) + 1,
    0
  )

  let workDays = 0

  const current = new Date(periodStart)

  while (current <= periodEnd) {

    if (isWeekday(current)) {
      workDays++
    }

    current.setDate(
      current.getDate() + 1
    )
  }

  const companyHolidayDates = new Set()
  const personalLeaveDates = new Set()

  records
    .filter(
      (record) =>
        record['Member Name'] === member &&
        record['Status']
          ?.trim()
          .toLowerCase() ===
          'confirmed'
    )
    .forEach((record) => {

      const leaveType =
        record['Leave Type']
          ?.trim()
          .toLowerCase()

      if (
        leaveType !==
          'company holiday' &&
        leaveType !==
          'personal leave'
      ) {
        return
      }

      for (
        let monthIndex =
          startMonthIndex;
        monthIndex <=
          endMonthIndex;
        monthIndex++
      ) {

        getRecordDatesInMonth(
          record,
          year,
          monthIndex
        )
          .filter(
            (date) =>
              isWeekday(date)
          )
          .forEach((date) => {

            const key =
              getDateKey(date)

            if (
              leaveType ===
              'company holiday'
            ) {
              companyHolidayDates.add(
                key
              )
            } else {
              personalLeaveDates.add(
                key
              )
            }
          })
      }
    })

  personalLeaveDates.forEach(
    (key) => {

      if (
        companyHolidayDates.has(
          key
        )
      ) {
        personalLeaveDates.delete(
          key
        )
      }
    }
  )

  const companyHolidayDays =
    companyHolidayDates.size

  const personalLeaveDays =
    personalLeaveDates.size

  const availableDays =
    Math.max(
      0,
      workDays -
        companyHolidayDays -
        personalLeaveDays
    )

  return {
    workDays,
    companyHolidayDays,
    personalLeaveDays,
    availableDays
  }
}

function getQuarterMonths(
  quarterIndex
) {
  const startMonth =
    Number(quarterIndex) * 3

  return [
    startMonth,
    startMonth + 1,
    startMonth + 2
  ]
}

export default function LeaveDataPage() {

  const [leaveData, setLeaveData] =
    useState([])

  const [importInfo, setImportInfo] =
    useState(null)

  const [error, setError] =
    useState('')

  const [selectedMember, setSelectedMember] =
    useState('')

  const [selectedYear, setSelectedYear] =
    useState(String(CURRENT_YEAR))

  const [selectedMonth, setSelectedMonth] =
    useState(String(
      new Date().getMonth()
    ))

  const [selectedQuarter, setSelectedQuarter] =
    useState(
      String(
        Math.floor(
          new Date().getMonth() / 3
        )
      )
    )

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {

    try {

      const storedData =
        localStorage.getItem(
          STORAGE_KEY
        )

      const storedInfo =
        localStorage.getItem(
          `${STORAGE_KEY}:info`
        )

      if (storedData) {

        const parsedData =
          JSON.parse(storedData)

        setLeaveData(
          Array.isArray(parsedData)
            ? parsedData
            : []
        )

        const members = [
          ...new Set(
            parsedData
              .map(
                (record) =>
                  record['Member Name']
              )
              .filter(Boolean)
          )
        ]

        if (members.length > 0) {
          setSelectedMember(
            members[0]
          )
        }
      }

      if (storedInfo) {

        setImportInfo(
          JSON.parse(storedInfo)
        )
      }

    } catch (err) {

      console.error(
        'Error loading Leave Data:',
        err
      )

      setError(
        'Unable to load imported Leave Data.'
      )
    }
  }

  function parseCSV(text) {

    const rows = []
    let row = []
    let value = ''
    let insideQuotes = false

    for (
      let i = 0;
      i < text.length;
      i++
    ) {

      const char = text[i]
      const nextChar =
        text[i + 1]

      if (char === '"') {

        if (
          insideQuotes &&
          nextChar === '"'
        ) {
          value += '"'
          i++
        } else {
          insideQuotes =
            !insideQuotes
        }

      } else if (
        char === ',' &&
        !insideQuotes
      ) {

        row.push(value)
        value = ''

      } else if (
        (
          char === '\n' ||
          char === '\r'
        ) &&
        !insideQuotes
      ) {

        if (
          char === '\r' &&
          nextChar === '\n'
        ) {
          i++
        }

        row.push(value)
        value = ''

        if (
          row.some(
            (cell) =>
              cell.trim() !== ''
          )
        ) {
          rows.push(row)
        }

        row = []

      } else {

        value += char
      }
    }

    if (
      value !== '' ||
      row.length > 0
    ) {

      row.push(value)

      if (
        row.some(
          (cell) =>
            cell.trim() !== ''
        )
      ) {
        rows.push(row)
      }
    }

    if (rows.length === 0) {
      return []
    }

    const headers =
      rows[0].map(
        (header) =>
          header.trim()
      )

    const missingColumns =
      REQUIRED_COLUMNS.filter(
        (column) =>
          !headers.includes(column)
      )

    if (
      missingColumns.length > 0
    ) {

      throw new Error(
        `Missing required columns: ${missingColumns.join(', ')}`
      )
    }

    return rows
      .slice(1)
      .map((row) => {

        const record = {}

        headers.forEach(
          (header, index) => {

            record[header] =
              (
                row[index] || ''
              ).trim()
          }
        )

        return record
      })
      .filter(
        (record) =>
          record['Member Name']
      )
  }
    function handleImport(event) {

    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    setError('')

    const reader =
      new FileReader()

    reader.onload = (e) => {

      try {

        const text =
          e.target.result

        const records =
          parseCSV(text)

        if (
          records.length === 0
        ) {

          throw new Error(
            'The selected file does not contain any leave records.'
          )
        }

        const members = [
          ...new Set(
            records
              .map(
                (record) =>
                  record['Member Name']
              )
              .filter(Boolean)
          )
        ]

        const dates =
          records
            .flatMap(
              (record) => [
                record['Start Date'],
                record['End Date']
              ]
            )
            .filter(Boolean)
            .sort()

        const importDetails = {

          importedAt:
            new Date().toISOString(),

          fileName:
            file.name,

          recordCount:
            records.length,

          memberCount:
            members.length,

          startDate:
            dates.length
              ? dates[0]
              : '',

          endDate:
            dates.length
              ? dates[dates.length - 1]
              : ''
        }

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(records)
        )

        localStorage.setItem(
          `${STORAGE_KEY}:info`,
          JSON.stringify(
            importDetails
          )
        )

        setLeaveData(records)

        setImportInfo(
          importDetails
        )

        setSelectedMember(
          members[0] || ''
        )

        alert(
          `Leave Data imported successfully. ${records.length} records imported.`
        )

      } catch (err) {

        console.error(
          'Leave Data import error:',
          err
        )

        setError(
          err.message ||
          'Unable to import the selected file.'
        )
      }
    }

    reader.readAsText(file)

    event.target.value = ''
  }

  function clearImportedData() {

    if (
      !confirm(
        'Delete the imported Leave Data?'
      )
    ) {
      return
    }

    localStorage.removeItem(
      STORAGE_KEY
    )

    localStorage.removeItem(
      `${STORAGE_KEY}:info`
    )

    setLeaveData([])
    setImportInfo(null)
    setSelectedMember('')
    setError('')
  }

  const members = useMemo(
    () => {

      return [
        ...new Set(
          leaveData
            .map(
              (record) =>
                record['Member Name']
            )
            .filter(Boolean)
        )
      ].sort()

    },
    [leaveData]
  )

  const availableYears =
    useMemo(
      () => {

        const years = [
          ...new Set(
            leaveData
              .flatMap(
                (record) => [
                  record['Start Date'],
                  record['End Date']
                ]
              )
              .filter(Boolean)
              .map(
                (date) =>
                  date.substring(0, 4)
              )
          )
        ]

        if (
          years.length === 0
        ) {
          return [
            String(CURRENT_YEAR)
          ]
        }

        return years.sort()

      },
      [leaveData]
    )

  const monthlyAvailability =
    useMemo(
      () => {

        if (!selectedMember) {
          return null
        }

        return calculateAvailabilityForPeriod(
          leaveData,
          selectedMember,
          selectedYear,
          Number(selectedMonth),
          Number(selectedMonth)
        )

      },
      [
        leaveData,
        selectedMember,
        selectedYear,
        selectedMonth
      ]
    )

  const quarterlyAvailability =
    useMemo(
      () => {

        if (!selectedMember) {
          return null
        }

        const quarterMonths =
          getQuarterMonths(
            selectedQuarter
          )

        const monthly =
          quarterMonths.map(
            (monthIndex) => ({

              monthIndex,

              ...calculateAvailabilityForPeriod(
                leaveData,
                selectedMember,
                selectedYear,
                monthIndex,
                monthIndex
              )

            })
          )

        const quarterCalculation =
          calculateAvailabilityForPeriod(
            leaveData,
            selectedMember,
            selectedYear,
            quarterMonths[0],
            quarterMonths[2]
          )

        const monthlyAvailableDays =
          monthly.reduce(
            (total, month) =>
              total +
              month.availableDays,
            0
          )

        return {

          monthly,

          quarterCalculation,

          monthlyAvailableDays,

          reconciliationMatches:
            monthlyAvailableDays ===
            quarterCalculation.availableDays

        }

      },
      [
        leaveData,
        selectedMember,
        selectedYear,
        selectedQuarter
      ]
    )

  const monthlyRecords =
    useMemo(
      () => {

        if (!selectedMember) {
          return []
        }

        const year =
          Number(selectedYear)

        const monthIndex =
          Number(selectedMonth)

        return leaveData.filter(
          (record) => {

            if (
              record['Member Name'] !==
                selectedMember
            ) {
              return false
            }

            const startDate =
              parseDate(
                record['Start Date']
              )

            const endDate =
              parseDate(
                record['End Date']
              )

            if (
              !startDate ||
              !endDate
            ) {
              return false
            }

            const monthStart =
              new Date(
                year,
                monthIndex,
                1
              )

            const monthEnd =
              new Date(
                year,
                monthIndex + 1,
                0
              )

            return (
              startDate <= monthEnd &&
              endDate >= monthStart
            )
          }
        )

      },
      [
        leaveData,
        selectedMember,
        selectedYear,
        selectedMonth
      ]
    )

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'Arial'
      }}
    >

      <h1>
        Leave Data
      </h1>

      {/* Navigation */}

      <div
        style={{
          marginBottom: 20
        }}
      >

        <Link href="/">
          <button>
            Dashboard
          </button>
        </Link>

        <Link
          href="/project-budgets"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Project Budgets
          </button>
        </Link>

        <Link
          href="/add-budget"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Projected Spend
          </button>
        </Link>

        <Link
          href="/add-expense"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Expense Tracking
          </button>
        </Link>

        <Link 
          href="/executive-summary" 
          style={{ 
            marginLeft: 10
          }}
        >
          <button>
            Executive Summary
          </button>
        </Link>
          
        <Link
          href="/forex-rates"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Forex Rates
          </button>
        </Link>

        <Link
          href="/resource-master"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Resource Master
          </button>
        </Link>

        <Link
          href="/projections"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Projection Planning
          </button>
        </Link>

      </div>

      <hr />

      <h2>
        Import Leave Data
      </h2>

      <p>
        Import the CSV exported from
        the Leave Tracker application.
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={handleImport}
      />

      {error && (

        <div
          style={{
            marginTop: 15,
            padding: 10,
            border:
              '1px solid #cc0000',
            background:
              '#fff0f0',
            color:
              '#cc0000'
          }}
        >
          <strong>
            Import Error:
          </strong>{' '}
          {error}
        </div>

      )}

      <h3>
        Expected Columns
      </h3>

      <p>
        {REQUIRED_COLUMNS.join(
          ' | '
        )}
      </p>

      {importInfo && (

        <>

          <hr />

          <h2>
            Import Summary
          </h2>

          <table
            border="1"
            cellPadding="8"
            style={{
              borderCollapse:
                'collapse'
            }}
          >

            <tbody>

              <tr>
                <th>
                  File
                </th>

                <td>
                  {
                    importInfo.fileName
                  }
                </td>
              </tr>

              <tr>
                <th>
                  Imported
                </th>

                <td>
                  {
                    new Date(
                      importInfo.importedAt
                    ).toLocaleString(
                      'en-GB'
                    )
                  }
                </td>
              </tr>

              <tr>
                <th>
                  Records
                </th>

                <td>
                  {
                    importInfo.recordCount
                  }
                </td>
              </tr>

              <tr>
                <th>
                  Members
                </th>

                <td>
                  {
                    importInfo.memberCount
                  }
                </td>
              </tr>

              <tr>
                <th>
                  Data Start Date
                </th>

                <td>
                  {
                    formatDate(
                      importInfo.startDate
                    )
                  }
                </td>
              </tr>

              <tr>
                <th>
                  Data End Date
                </th>

                <td>
                  {
                    formatDate(
                      importInfo.endDate
                    )
                  }
                </td>
              </tr>

            </tbody>

          </table>

          <br />

          <button
            onClick={
              clearImportedData
            }
          >
            Clear Imported Data
          </button>

        </>

      )}

      <hr />

      <h2>
        Monthly Availability
      </h2>

      {leaveData.length === 0 ? (

        <p>
          Import Leave Data to calculate
          monthly availability.
        </p>

      ) : (

        <>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(4, 250px)',
              gap: 10,
              marginBottom: 20
            }}
          >

            <div>

              <label
                style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: 5
                }}
              >
                Member
              </label>

              <select
                value={selectedMember}
                onChange={(e) =>
                  setSelectedMember(
                    e.target.value
                  )
                }
                style={{
                  width: '100%'
                }}
              >

                <option value="">
                  Select Member
                </option>

                {members.map(
                  (member) => (

                    <option
                      key={member}
                      value={member}
                    >
                      {member}
                    </option>

                  )
                )}

              </select>

            </div>

            <div>

              <label
                style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: 5
                }}
              >
                Year
              </label>

              <select
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(
                    e.target.value
                  )
                }
                style={{
                  width: '100%'
                }}
              >

                {availableYears.map(
                  (year) => (

                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>

                  )
                )}

              </select>

            </div>

            <div>

              <label
                style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: 5
                }}
              >
                Month
              </label>

              <select
                value={selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(
                    e.target.value
                  )
                }
                style={{
                  width: '100%'
                }}
              >

                {MONTHS.map(
                  (month, index) => (

                    <option
                      key={month}
                      value={index}
                    >
                      {month}
                    </option>

                  )
                )}

              </select>

            </div>

            <div>

              <label
                style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: 5
                }}
              >
                Quarter
              </label>

              <select
                value={selectedQuarter}
                onChange={(e) =>
                  setSelectedQuarter(
                    e.target.value
                  )
                }
                style={{
                  width: '100%'
                }}
              >

                <option value="0">
                  Q1
                </option>

                <option value="1">
                  Q2
                </option>

                <option value="2">
                  Q3
                </option>

                <option value="3">
                  Q4
                </option>

              </select>

            </div>

          </div>

          {monthlyAvailability && (

            <>

              <h3>
                {
                  selectedMember
                }
                {' - '}
                {
                  MONTHS[
                    Number(
                      selectedMonth
                    )
                  ]
                }
                {' '}
                {selectedYear}
              </h3>

              <table
                border="1"
                cellPadding="10"
                style={{
                  borderCollapse:
                    'collapse',
                  marginBottom: 20
                }}
              >

                <thead>

                  <tr>

                    <th>
                      Total Work Days
                    </th>

                    <th>
                      Company Holidays
                    </th>

                    <th>
                      Personal Leave
                    </th>

                    <th>
                      Available Days
                    </th>

                  </tr>

                </thead>

                <tbody>

                  <tr>

                    <td
                      style={{
                        textAlign:
                          'center'
                      }}
                    >
                      {
                        monthlyAvailability.workDays
                      }
                    </td>

                    <td
                      style={{
                        textAlign:
                          'center'
                      }}
                    >
                      {
                        monthlyAvailability.companyHolidayDays
                      }
                    </td>

                    <td
                      style={{
                        textAlign:
                          'center'
                      }}
                    >
                      {
                        monthlyAvailability.personalLeaveDays
                      }
                    </td>

                    <td
                      style={{
                        textAlign:
                          'center',
                        fontWeight:
                          'bold'
                      }}
                    >
                      {
                        monthlyAvailability.availableDays
                      }
                    </td>

                  </tr>

                </tbody>

              </table>

              <p>
                <strong>
                  Calculation:
                </strong>{' '}
                {monthlyAvailability.workDays}
                {' '}
                Work Days −{' '}
                {monthlyAvailability.companyHolidayDays}
                {' '}
                Company Holidays −{' '}
                {monthlyAvailability.personalLeaveDays}
                {' '}
                Personal Leave ={' '}
                <strong>
                  {monthlyAvailability.availableDays}
                  {' '}
                  Available Days
                </strong>
              </p>
              {quarterlyAvailability && (
                <>
                  <hr />

                  <h3>
                    Quarterly Availability Reconciliation
                  </h3>

                  <table
                    border="1"
                    cellPadding="8"
                    style={{
                      borderCollapse:
                        'collapse',
                      marginBottom: 15
                    }}
                  >

                    <thead>

                      <tr>

                        <th>
                          Period
                        </th>

                        <th>
                          Work Days
                        </th>

                        <th>
                          Company Holidays
                        </th>

                        <th>
                          Personal Leave
                        </th>

                        <th>
                          Available Days
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {
                        quarterlyAvailability.monthly.map(
                          (month) => (

                            <tr
                              key={
                                month.monthIndex
                              }
                            >

                              <td>
                                {
                                  MONTHS[
                                    month.monthIndex
                                  ]
                                }
                              </td>

                              <td
                                style={{
                                  textAlign:
                                    'center'
                                }}
                              >
                                {
                                  month.workDays
                                }
                              </td>

                              <td
                                style={{
                                  textAlign:
                                    'center'
                                }}
                              >
                                {
                                  month.companyHolidayDays
                                }
                              </td>

                              <td
                                style={{
                                  textAlign:
                                    'center'
                                }}
                              >
                                {
                                  month.personalLeaveDays
                                }
                              </td>

                              <td
                                style={{
                                  textAlign:
                                    'center',
                                  fontWeight:
                                    'bold'
                                }}
                              >
                                {
                                  month.availableDays
                                }
                              </td>

                            </tr>

                          )
                        )
                      }

                      <tr>

                        <th>
                          Sum of Monthly Available Days
                        </th>

                        <td
                          colSpan="3"
                        >
                        </td>

                        <th
                          style={{
                            textAlign:
                              'center'
                          }}
                        >
                          {
                            quarterlyAvailability
                              .monthlyAvailableDays
                          }
                        </th>

                      </tr>

                      <tr>

                        <th>
                          Quarter Calculation
                        </th>

                        <td
                          style={{
                            textAlign:
                              'center'
                          }}
                        >
                          {
                            quarterlyAvailability
                              .quarterCalculation
                              .workDays
                          }
                        </td>

                        <td
                          style={{
                            textAlign:
                              'center'
                          }}
                        >
                          {
                            quarterlyAvailability
                              .quarterCalculation
                              .companyHolidayDays
                          }
                        </td>

                        <td
                          style={{
                            textAlign:
                              'center'
                          }}
                        >
                          {
                            quarterlyAvailability
                              .quarterCalculation
                              .personalLeaveDays
                          }
                        </td>

                        <th
                          style={{
                            textAlign:
                              'center'
                          }}
                        >
                          {
                            quarterlyAvailability
                              .quarterCalculation
                              .availableDays
                          }
                        </th>

                      </tr>

                    </tbody>

                  </table>

                  <p>

                    <strong>
                      Q
                      {
                        Number(
                          selectedQuarter
                        ) + 1
                      }{' '}
                      {selectedYear}
                      {' '}
                      Reconciliation:
                    </strong>{' '}

                    Sum of monthly available days (
                    {
                      quarterlyAvailability
                        .monthlyAvailableDays
                    }
                    )
                    {' '}

                    {
                      quarterlyAvailability
                        .reconciliationMatches
                        ? '='
                        : '≠'
                    }

                    {' '}

                    quarter available days (
                    {
                      quarterlyAvailability
                        .quarterCalculation
                        .availableDays
                    }
                    )

                  </p>

                  <p
                    style={{
                      fontWeight:
                        'bold',
                      color:
                        quarterlyAvailability
                          .reconciliationMatches
                          ? 'green'
                          : '#cc0000'
                    }}
                  >

                    {
                      quarterlyAvailability
                        .reconciliationMatches
                        ? '✓ Reconciliation Match'
                        : '✗ Reconciliation Mismatch'
                    }

                  </p>

                </>
              )}

              <h3>
                Records Used
              </h3>

              {
                monthlyRecords.length === 0 ? (

                  <p>
                    No leave or holiday records
                    found for this member and
                    month.
                  </p>

                ) : (

                  <div
                    style={{
                      overflowX:
                        'auto'
                    }}
                  >

                    <table
                      border="1"
                      cellPadding="8"
                      style={{
                        borderCollapse:
                          'collapse',
                        width: '100%'
                      }}
                    >

                      <thead>

                        <tr>

                          <th>
                            Leave Type
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            PTO Days
                          </th>

                          <th>
                            Start Date
                          </th>

                          <th>
                            End Date
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {
                          monthlyRecords.map(
                            (
                              record,
                              index
                            ) => (

                              <tr
                                key={
                                  `${record['Member Name']}-${record['Start Date']}-${index}`
                                }
                              >

                                <td>
                                  {
                                    record[
                                      'Leave Type'
                                    ]
                                  }
                                </td>

                                <td>
                                  {
                                    record[
                                      'Status'
                                    ]
                                  }
                                </td>

                                <td
                                  style={{
                                    textAlign:
                                      'center'
                                  }}
                                >
                                  {
                                    record[
                                      'PTO Days'
                                    ]
                                  }
                                </td>

                                <td>
                                  {
                                    record[
                                      'Start Date'
                                    ]
                                  }
                                </td>

                                <td>
                                  {
                                    record[
                                      'End Date'
                                    ]
                                  }
                                </td>

                              </tr>

                            )
                          )
                        }

                      </tbody>

                    </table>

                  </div>

                )
              }

            </>

          )}

        </>

      )}

    </div>
  )
}
