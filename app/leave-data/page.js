'use client'

import { useEffect, useState } from 'react'
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

export default function LeaveDataPage() {

  const [leaveData, setLeaveData] = useState([])
  const [importInfo, setImportInfo] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {

    try {

      const storedData =
        localStorage.getItem(STORAGE_KEY)

      const storedInfo =
        localStorage.getItem(
          `${STORAGE_KEY}:info`
        )

      if (storedData) {
        setLeaveData(
          JSON.parse(storedData)
        )
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

    }
  }

  function parseCSV(text) {

    const rows = []
    let row = []
    let value = ''
    let insideQuotes = false

    for (let i = 0; i < text.length; i++) {

      const char = text[i]
      const nextChar = text[i + 1]

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
        (char === '\n' || char === '\r') &&
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

        const members =
          [
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
              ? dates.sort()[0]
              : '',

          endDate:
            dates.length
              ? dates.sort()[dates.length - 1]
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

    // Allows the same file to be selected again
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
    setError('')
  }

  function formatDate(dateString) {

    if (!dateString) {
      return ''
    }

    const date =
      new Date(dateString)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateString
    }

    return date.toLocaleDateString(
      'en-GB'
    )
  }

  function formatDateTime(dateString) {

    if (!dateString) {
      return ''
    }

    const date =
      new Date(dateString)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateString
    }

    return date.toLocaleString(
      'en-GB'
    )
  }

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
        Import the CSV exported from the
        Leave Tracker application.
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={
          handleImport
        }
      />

      {error && (

        <div
          style={{
            marginTop: 15,
            padding: 10,
            border: '1px solid #cc0000',
            background: '#fff0f0',
            color: '#cc0000'
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
                  {importInfo.fileName}
                </td>
              </tr>

              <tr>
                <th>
                  Imported
                </th>
                <td>
                  {formatDateTime(
                    importInfo.importedAt
                  )}
                </td>
              </tr>

              <tr>
                <th>
                  Records
                </th>
                <td>
                  {importInfo.recordCount}
                </td>
              </tr>

              <tr>
                <th>
                  Members
                </th>
                <td>
                  {importInfo.memberCount}
                </td>
              </tr>

              <tr>
                <th>
                  Data Start Date
                </th>
                <td>
                  {formatDate(
                    importInfo.startDate
                  )}
                </td>
              </tr>

              <tr>
                <th>
                  Data End Date
                </th>
                <td>
                  {formatDate(
                    importInfo.endDate
                  )}
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
        Imported Leave Records
        {' '}
        ({leaveData.length})
      </h2>

      {leaveData.length === 0 ? (

        <p>
          No Leave Data has been imported yet.
        </p>

      ) : (

        <div
          style={{
            overflowX: 'auto'
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
                  Member Name
                </th>

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

              {leaveData.map(
                (record, index) => (

                  <tr
                    key={
                      `${record['Member Name']}-${record['Start Date']}-${index}`
                    }
                  >

                    <td>
                      {
                        record['Member Name']
                      }
                    </td>

                    <td>
                      {
                        record['Leave Type']
                      }
                    </td>

                    <td>
                      {
                        record['Status']
                      }
                    </td>

                    <td
                      style={{
                        textAlign:
                          'center'
                      }}
                    >
                      {
                        record['PTO Days']
                      }
                    </td>

                    <td>
                      {
                        record['Start Date']
                      }
                    </td>

                    <td>
                      {
                        record['End Date']
                      }
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  )
}
