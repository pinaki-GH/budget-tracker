'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  getProjections,
  saveProjection,
  updateProjection,
  deleteProjection,
  getForexRates,
  getResources,
  getServiceProjections,
  saveServiceProjection,
  updateServiceProjection,
  deleteServiceProjection
} from '../../lib/storage'

function getWorkDaysInQuarter(
  year,
  quarter
) {

  const quarterMonths = {
    Q1: [0, 1, 2],
    Q2: [3, 4, 5],
    Q3: [6, 7, 8],
    Q4: [9, 10, 11]
  }

  let workDays = 0

  quarterMonths[quarter].forEach(
    (month) => {

      const date =
        new Date(
          Number(year),
          month,
          1
        )

      while (
        date.getMonth() === month
      ) {

        const day =
          date.getDay()

        if (
          day !== 0 &&
          day !== 6
        ) {
          workDays++
        }

        date.setDate(
          date.getDate() + 1
        )
      }
    }
  )

  return workDays
}

const LEAVE_DATA_STORAGE_KEY =
  'budgetTracker:leaveData'

const MONTH_NAMES = [
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

function parseLeaveDate(dateString) {
  if (!dateString) {
    return null
  }

  const parts =
    dateString.split('-')

  if (parts.length !== 3) {
    return null
  }

  const year =
    Number(parts[0])

  const month =
    Number(parts[1])

  const day =
    Number(parts[2])

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

function isWeekday(date) {
  const day =
    date.getDay()

  return (
    day !== 0 &&
    day !== 6
  )
}

function getDateKey(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function getRecordDatesInMonth(
  record,
  year,
  monthIndex
) {

  const startDate =
    parseLeaveDate(
      record['Start Date']
    )

  const endDate =
    parseLeaveDate(
      record['End Date']
    )

  if (
    !startDate ||
    !endDate
  ) {
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

  const dates = []

  const current =
    new Date(effectiveStart)

  while (
    current <= effectiveEnd
  ) {

    dates.push(
      new Date(current)
    )

    current.setDate(
      current.getDate() + 1
    )
  }

  return dates
}

function getQuarterMonths(
  quarter
) {

  const quarterMonths = {
    Q1: [0, 1, 2],
    Q2: [3, 4, 5],
    Q3: [6, 7, 8],
    Q4: [9, 10, 11]
  }

  return (
    quarterMonths[quarter] ||
    []
  )
}

function getQuarterForMonth(
  monthIndex
) {

  if (
    monthIndex < 3
  ) {
    return 'Q1'
  }

  if (
    monthIndex < 6
  ) {
    return 'Q2'
  }

  if (
    monthIndex < 9
  ) {
    return 'Q3'
  }

  return 'Q4'
}

function calculateLeaveAvailability(
  records,
  member,
  year,
  startMonthIndex,
  endMonthIndex
) {

  const periodStart =
    new Date(
      Number(year),
      Number(startMonthIndex),
      1
    )

  const periodEnd =
    new Date(
      Number(year),
      Number(endMonthIndex) + 1,
      0
    )

  let workDays = 0

  const current =
    new Date(periodStart)

  while (
    current <= periodEnd
  ) {

    if (
      isWeekday(current)
    ) {
      workDays++
    }

    current.setDate(
      current.getDate() + 1
    )
  }

  const companyHolidayDates =
    new Set()

  const personalLeaveDates =
    new Set()

  records
    .filter(
      (record) =>
        record['Member Name'] ===
          member &&
        record['Status']
          ?.trim()
          .toLowerCase() ===
          'confirmed'
    )
    .forEach(
      (record) => {

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
            .forEach(
              (date) => {

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
              }
            )
        }
      }
    )

  // Prevent the same calendar day from
  // being deducted twice.
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

export default function ProjectionsPage() {

  const [
    projections,
    setProjections
  ] = useState([])

  const [
    resources,
    setResources
  ] = useState([])

  const [
    leaveData,
    setLeaveData
  ] = useState([])

  const [year, setYear] =
    useState('2026')

  const [quarter, setQuarter] =
    useState('Q1')

  const [project, setProject] =
    useState('')

  const [resource, setResource] =
    useState('')

  const selectedResource =
    resources.find(
      (r) =>
        r.resourceName ===
        resource
    )

  const hoursPerDay =
    selectedResource?.hoursPerDay ||
    0

  const manHourRate =
    selectedResource?.manHourRate ||
    0

  const currency =
    selectedResource?.currency ||
    ''

  const purpose =
    selectedResource?.purpose ||
    ''

  const [
    workDays,
    setWorkDays
  ] = useState(0)

  const [
    holidayDays,
    setHolidayDays
  ] = useState(0)

  const [
    leaveDays,
    setLeaveDays
  ] = useState(0)

  const [
    fteFactor,
    setFteFactor
  ] = useState('1')

  const [
    forexRates,
    setForexRates
  ] = useState([])

  const [
    serviceProjections,
    setServiceProjections
  ] = useState([])

  const [
    serviceYear,
    setServiceYear
  ] = useState('2026')

  const [
    serviceQuarter,
    setServiceQuarter
  ] = useState('Q1')

  const [
    serviceProject,
    setServiceProject
  ] = useState('')

  const [
    servicePurpose,
    setServicePurpose
  ] = useState('')

  const [
    serviceCurrency,
    setServiceCurrency
  ] = useState('SEK')

  const [
    serviceBudget,
    setServiceBudget
  ] = useState('')

  const [
    editingServiceId,
    setEditingServiceId
  ] = useState(null)

  const [
    editingId,
    setEditingId
  ] = useState(null)

  // Filters

  const [
    filterYear,
    setFilterYear
  ] = useState('')

  const [
    filterQuarter,
    setFilterQuarter
  ] = useState('')

  const [
    filterMonth,
    setFilterMonth
  ] = useState('')

  const [
    filterProject,
    setFilterProject
  ] = useState(
    'All Projects'
  )

  const [
    filterPurpose,
    setFilterPurpose
  ] = useState('')

  const [
    staffColumns,
    setStaffColumns
  ] = useState({
    year: true,
    quarter: true,
    project: true,
    resource: true,
    purpose: true,
    days: true,
    holidayDays: true,
    leaveDays: true,
    availableDays: true,
    hours: true,
    rate: true,
    currency: true,
    fte: true,
    projectedSpend: true,
    projectedSpendSEK: true,
    actions: true
  })

  const [
    serviceColumns,
    setServiceColumns
  ] = useState({
    year: true,
    quarter: true,
    project: true,
    purpose: true,
    currency: true,
    budget: true,
    budgetSEK: true,
    actions: true
  })

  const centerCell = {
    textAlign: 'center'
  }

  const fieldLabel = {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: 4
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {

    setWorkDays(
      getWorkDaysInQuarter(
        year,
        quarter
      )
    )

  }, [
    year,
    quarter
  ])

  useEffect(() => {

    if (
      !selectedResource?.leaveTrackerMember ||
      leaveData.length === 0
    ) {
      return
    }

    const quarterMonths =
      getQuarterMonths(
        quarter
      )

    const availability =
      calculateLeaveAvailability(
        leaveData,
        selectedResource
          .leaveTrackerMember,
        year,
        quarterMonths[0],
        quarterMonths[2]
      )

    setHolidayDays(
      availability.companyHolidayDays
    )

    setLeaveDays(
      availability.personalLeaveDays
    )

  }, [
    year,
    quarter,
    resource,
    selectedResource,
    leaveData
  ])

  function loadData() {

    setProjections(
      getProjections()
    )

    setForexRates(
      getForexRates()
    )

    setResources(
      getResources()
    )

    try {

      const storedLeaveData =
        localStorage.getItem(
          LEAVE_DATA_STORAGE_KEY
        )

      const parsedLeaveData =
        storedLeaveData
          ? JSON.parse(
              storedLeaveData
            )
          : []

      setLeaveData(
        Array.isArray(
          parsedLeaveData
        )
          ? parsedLeaveData
          : []
      )

    } catch (error) {

      console.error(
        'Unable to load Leave Data:',
        error
      )

      setLeaveData([])
    }

    setServiceProjections(
      getServiceProjections()
    )
  }

  function convertToSEK(
    amount,
    currency
  ) {

    if (
      currency === 'SEK'
    ) {
      return amount
    }

    const rate =
      forexRates.find(
        (r) =>
          r.currency ===
          currency
      )

    return rate
      ? amount * rate.rate
      : amount
  }

  const availableDays =
    Math.max(
      0,
      Number(
        workDays || 0
      ) -
      Number(
        holidayDays || 0
      ) -
      Number(
        leaveDays || 0
      )
    )

  const projectedBudget =
    availableDays *
    Number(
      hoursPerDay || 0
    ) *
    Number(
      manHourRate || 0
    ) *
    Number(
      fteFactor || 0
    )

  function clearForm() {

    setYear('2026')
    setQuarter('Q1')
    setProject('')
    setResource('')

    setWorkDays(
      getWorkDaysInQuarter(
        '2026',
        'Q1'
      )
    )

    setFteFactor('1')
    setHolidayDays(0)
    setLeaveDays(0)

    setEditingId(null)
  }

  function clearServiceForm() {

    setServiceYear('2026')
    setServiceQuarter('Q1')
    setServiceProject('')
    setServicePurpose('')
    setServiceCurrency('SEK')
    setServiceBudget('')
    setEditingServiceId(null)
  }

  function handleSave() {

    const record = {

      id:
        editingId ||
        Date.now(),

      year,
      quarter,

      project,

      resource,
      purpose,

      leaveTrackerMember:
        selectedResource
          ?.leaveTrackerMember ||
        '',

      workDays,
      holidayDays,
      leaveDays,
      availableDays,

      hoursPerDay,
      manHourRate,
      currency,

      fteFactor
    }

    if (editingId) {

      updateProjection(
        editingId,
        record
      )

    } else {

      saveProjection(
        record
      )
    }

    loadData()
    clearForm()
  }

  function handleSaveService() {

    const record = {

      id:
        editingServiceId ||
        Date.now(),

      year:
        serviceYear,

      quarter:
        serviceQuarter,

      project:
        serviceProject,

      purpose:
        servicePurpose,

      currency:
        serviceCurrency,

      projectedBudget:
        Number(
          serviceBudget
        )
    }

    if (
      editingServiceId
    ) {

      updateServiceProjection(
        editingServiceId,
        record
      )

    } else {

      saveServiceProjection(
        record
      )
    }

    loadData()
    clearServiceForm()
  }

  function handleEdit(
    item
  ) {

    setEditingId(
      item.id
    )

    setYear(
      item.year
    )

    setQuarter(
      item.quarter
    )

    setProject(
      item.project
    )

    setResource(
      item.resource
    )

    setHolidayDays(
      item.holidayDays ||
      0
    )

    setLeaveDays(
      item.leaveDays ||
      0
    )

    setFteFactor(
      item.fteFactor
    )
  }

  function handleEditService(
    item
  ) {

    setEditingServiceId(
      item.id
    )

    setServiceYear(
      item.year
    )

    setServiceQuarter(
      item.quarter
    )

    setServiceProject(
      item.project
    )

    setServicePurpose(
      item.purpose
    )

    setServiceCurrency(
      item.currency
    )

    setServiceBudget(
      item.projectedBudget
    )
  }

  function handleDelete(
    id
  ) {

    if (
      !confirm(
        'Delete this projection?'
      )
    ) {
      return
    }

    deleteProjection(id)

    loadData()
  }

  function handleDeleteService(
    id
  ) {

    if (
      !confirm(
        'Delete service projection?'
      )
    ) {
      return
    }

    deleteServiceProjection(
      id
    )

    loadData()
  }
    function getProjectionDisplayMetrics(item) {

  const resourceRecord =
    resources.find(
      (r) =>
        r.resourceName ===
        item.resource
    )

  const leaveTrackerMember =
    resourceRecord?.leaveTrackerMember ||
    item.leaveTrackerMember ||
    ''

  /*
    If Leave Data is not available or
    the resource is not mapped to a
    Leave Tracker Member, retain the
    saved projection values.
  */
  if (
    !leaveTrackerMember ||
    leaveData.length === 0
  ) {

    const available =
      Number(
        item.availableDays ??
        item.workDays ??
        0
      )

    const budget =
      available *
      Number(item.hoursPerDay || 0) *
      Number(item.manHourRate || 0) *
      Number(item.fteFactor || 0)

    return {
      workDays:
        Number(
          item.workDays || 0
        ),

      holidayDays:
        Number(
          item.holidayDays || 0
        ),

      leaveDays:
        Number(
          item.leaveDays || 0
        ),

      availableDays:
        available,

      budget
    }
  }

  /*
    MONTH VIEW
    Calculate only the selected month.
  */
  if (filterMonth !== '') {

    const monthIndex =
      Number(filterMonth)

    const availability =
      calculateLeaveAvailability(
        leaveData,
        leaveTrackerMember,
        item.year,
        monthIndex,
        monthIndex
      )

    const budget =
      Number(
        availability.availableDays || 0
      ) *
      Number(item.hoursPerDay || 0) *
      Number(item.manHourRate || 0) *
      Number(item.fteFactor || 0)

    return {
      workDays:
        availability.workDays,

      holidayDays:
        availability.companyHolidayDays,

      leaveDays:
        availability.personalLeaveDays,

      availableDays:
        availability.availableDays,

      budget
    }
  }

  /*
    QUARTER VIEW
    Calculate the quarter dynamically
    from its three individual months.

    This makes:

    Q4 =
    October + November + December
  */

  const quarterMonths =
    getQuarterMonths(
      item.quarter
    )

  const monthlyAvailability =
    quarterMonths.map(
      (monthIndex) =>
        calculateLeaveAvailability(
          leaveData,
          leaveTrackerMember,
          item.year,
          monthIndex,
          monthIndex
        )
    )

  const workDays =
    monthlyAvailability.reduce(
      (sum, month) =>
        sum + month.workDays,
      0
    )

  const holidayDays =
    monthlyAvailability.reduce(
      (sum, month) =>
        sum + month.companyHolidayDays,
      0
    )

  const leaveDays =
    monthlyAvailability.reduce(
      (sum, month) =>
        sum + month.personalLeaveDays,
      0
    )

  const availableDays =
    monthlyAvailability.reduce(
      (sum, month) =>
        sum + month.availableDays,
      0
    )

  const budget =
    availableDays *
    Number(item.hoursPerDay || 0) *
    Number(item.manHourRate || 0) *
    Number(item.fteFactor || 0)

  return {
    workDays,
    holidayDays,
    leaveDays,
    availableDays,
    budget
  }
}

  function exportStaffCostCSV() {

    const rows =
      filteredProjections.map(
        (item) => {

          const displayMetrics =
            getProjectionDisplayMetrics(
              item
            )

          const budget =
            displayMetrics.budget

          return [

            item.year,
            item.quarter,
            item.project,
            item.resource,
            item.purpose,

            displayMetrics.workDays,
            displayMetrics.holidayDays,
            displayMetrics.leaveDays,
            displayMetrics.availableDays,

            item.hoursPerDay,
            item.manHourRate,
            item.currency,
            item.fteFactor,

            budget.toFixed(2),

            convertToSEK(
              budget,
              item.currency
            ).toFixed(2)

          ]
        }
      )

    const csv = [

      [
        'Year',
        'Quarter',
        'Project',
        'Resource',
        'Purpose',

        filterMonth
          ? 'Work Days (Month)'
          : 'Work Days',

        filterMonth
          ? 'Holiday Days (Month)'
          : 'Holiday Days',

        filterMonth
          ? 'Leave Days (Month)'
          : 'Leave Days',

        filterMonth
          ? 'Available Days (Month)'
          : 'Available Days',

        'Hours',
        'Rate',
        'Currency',
        'FTE',
        'Projected Spend',
        'Projected Spend SEK'
      ],

      ...rows

    ]
      .map(
        (row) =>
          row.join(',')
      )
      .join('\n')

    const blob =
      new Blob(
        [csv],
        {
          type:
            'text/csv;charset=utf-8;'
        }
      )

    const link =
      document.createElement(
        'a'
      )

    link.href =
      URL.createObjectURL(
        blob
      )

    link.download =
      'StaffCostProjections.csv'

    link.click()
  }

  function exportServiceCostCSV() {

    const rows =
      filteredServiceProjections.map(
        (item) => [

          item.year,
          item.quarter,
          item.project,
          item.purpose,
          item.currency,
          item.projectedBudget,

          convertToSEK(
            item.projectedBudget,
            item.currency
          ).toFixed(2)

        ]
      )

    const csv = [

      [
        'Year',
        'Quarter',
        'Project',
        'Purpose',
        'Currency',
        'Projected Spend',
        'Projected Spend SEK'
      ],

      ...rows

    ]
      .map(
        (row) =>
          row.join(',')
      )
      .join('\n')

    const blob =
      new Blob(
        [csv],
        {
          type:
            'text/csv;charset=utf-8;'
        }
      )

    const link =
      document.createElement(
        'a'
      )

    link.href =
      URL.createObjectURL(
        blob
      )

    link.download =
      'ServiceCostProjections.csv'

    link.click()
  }

  function exportAllProjectionsCSV() {

    const rows = []

    rows.push([
      'STAFF COST PROJECTIONS'
    ])

    rows.push([

      'Year',
      'Quarter',
      'Project',
      'Resource',
      'Purpose',
      'Work Days',
      'Holiday Days',
      'Leave Days',
      'Available Days',
      'Hours',
      'Rate',
      'Currency',
      'FTE',
      'Projected Spend'

    ])

    filteredProjections.forEach(
      (item) => {

        const displayMetrics =
          getProjectionDisplayMetrics(
            item
          )

        const budget =
          displayMetrics.budget

        rows.push([

          item.year,
          item.quarter,
          item.project,
          item.resource,
          item.purpose,

          displayMetrics.workDays,
          displayMetrics.holidayDays,
          displayMetrics.leaveDays,
          displayMetrics.availableDays,

          item.hoursPerDay,
          item.manHourRate,
          item.currency,
          item.fteFactor,

          budget.toFixed(2)

        ])
      }
    )

    rows.push([])
    rows.push([])

    rows.push([
      'SERVICE COST PROJECTIONS'
    ])

    rows.push([

      'Year',
      'Quarter',
      'Project',
      'Purpose',
      'Currency',
      'Projected Spend',
      'Projected Spend SEK'

    ])

    filteredServiceProjections.forEach(
      (item) => {

        rows.push([

          item.year,
          item.quarter,
          item.project,
          item.purpose,
          item.currency,
          item.projectedBudget,

          convertToSEK(
            item.projectedBudget,
            item.currency
          ).toFixed(2)

        ])
      }
    )

    const csv =
      rows
        .map(
          (row) =>
            row.join(',')
        )
        .join('\n')

    const blob =
      new Blob(
        [csv],
        {
          type:
            'text/csv;charset=utf-8;'
        }
      )

    const link =
      document.createElement(
        'a'
      )

    link.href =
      URL.createObjectURL(
        blob
      )

    link.download =
      'ProjectionPlanning.csv'

    link.click()
  }

  const filteredProjections =
    projections.filter(
      (p) => {

        return (

          (!filterYear ||
            p.year ===
              filterYear)

          &&

          (!filterQuarter ||
            p.quarter ===
              filterQuarter)

          &&

          (
            filterProject ===
              'All Projects' ||

            p.project ===
              filterProject
          )

          &&

          (
            !filterPurpose ||

            p.purpose
              .toLowerCase()
              .includes(
                filterPurpose
                  .toLowerCase()
              )
          )

        )
      }
    )

  const filteredServiceProjections =
    serviceProjections.filter(
      (item) => {

        return (

          (!filterYear ||
            item.year ===
              filterYear)

          &&

          (!filterQuarter ||
            item.quarter ===
              filterQuarter)

          &&

          (
            filterProject ===
              'All Projects' ||

            item.project ===
              filterProject
          )

          &&

          (
            !filterPurpose ||

            item.purpose
              .toLowerCase()
              .includes(
                filterPurpose
                  .toLowerCase()
              )
          )

        )
      }
    )

  const totalProjectedBudgetSEK =
    filteredProjections.reduce(
      (
        sum,
        p
      ) => {

        const displayMetrics =
          getProjectionDisplayMetrics(
            p
          )

        return (
          sum +
          convertToSEK(
            displayMetrics.budget,
            p.currency
          )
        )
      },
      0
    )

  const totalServiceSEK =
    filteredServiceProjections.reduce(
      (
        sum,
        item
      ) => {

        return (
          sum +
          convertToSEK(
            item.projectedBudget,
            item.currency
          )
        )

      },
      0
    )

  const quarterMonthIndexes =
    filterQuarter
      ? getQuarterMonths(
          filterQuarter
        )
      : null

  const monthOptions =
    quarterMonthIndexes
      ? quarterMonthIndexes.map(
          (index) => ({
            index,
            name:
              MONTH_NAMES[index]
          })
        )
      : MONTH_NAMES.map(
          (
            name,
            index
          ) => ({
            index,
            name
          })
        )

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'Arial'
      }}
    >

      <h1>
        Projection Planning
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
          href="/leave-data"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Leave Data
          </button>
        </Link>

      </div>

      <hr />

      <h2>
        Add Staff Cost Projection
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(3, 1fr)',
          gap: 10,
          maxWidth: 900
        }}
      >
        <div>

          <label
            style={fieldLabel}
          >
            Year
          </label>

          <select
            value={year}
            onChange={(e) =>
              setYear(
                e.target.value
              )
            }
          >
            <option>
              2025
            </option>

            <option>
              2026
            </option>

            <option>
              2027
            </option>
          </select>

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Quarter
          </label>

          <select
            value={quarter}
            onChange={(e) =>
              setQuarter(
                e.target.value
              )
            }
          >

            <option>
              Q1
            </option>

            <option>
              Q2
            </option>

            <option>
              Q3
            </option>

            <option>
              Q4
            </option>

          </select>

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Project
          </label>

          <input
            value={project}
            onChange={(e) =>
              setProject(
                e.target.value
              )
            }
          />

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Resource
          </label>

          <select
            value={resource}
            onChange={(e) =>
              setResource(
                e.target.value
              )
            }
          >

            <option value="">
              Select Resource
            </option>

            {
              resources
                .filter(
                  (r) =>
                    r.active
                )
                .map(
                  (r) => (

                    <option
                      key={r.id}
                      value={
                        r.resourceName
                      }
                    >
                      {
                        r.resourceName
                      }
                    </option>

                  )
                )
            }

          </select>

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Purpose
          </label>

          <input
            value={purpose}
            readOnly
          />

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Total Work Days
          </label>

          <input
            value={workDays}
            readOnly
          />

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Holiday Days
          </label>

          <input
            type="number"
            value={
              holidayDays
            }
            onChange={(e) =>
              setHolidayDays(
                Number(
                  e.target.value ||
                  0
                )
              )
            }
          />

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Leave Days
          </label>

          <input
            type="number"
            value={
              leaveDays
            }
            onChange={(e) =>
              setLeaveDays(
                Number(
                  e.target.value ||
                  0
                )
              )
            }
          />

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Available Days
          </label>

          <input
            value={
              availableDays
            }
            readOnly
          />

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Hours / Day
          </label>

          <input
            value={
              hoursPerDay
            }
            readOnly
          />

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Man Hour Rate
          </label>

          <input
            value={
              manHourRate
            }
            readOnly
          />

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            Currency
          </label>

          <input
            value={
              currency
            }
            readOnly
          />

        </div>

        <div>

          <label
            style={fieldLabel}
          >
            FTE Factor
          </label>

          <input
            type="number"
            step="0.1"
            value={
              fteFactor
            }
            onChange={(e) =>
              setFteFactor(
                e.target.value
              )
            }
          />

        </div>

      </div>

      <br />

      <h3>

        Projected Spend:
        {' '}

        {
          projectedBudget.toFixed(
            2
          )
        }

        {' '}

        {currency}

      </h3>

      <button
        onClick={
          handleSave
        }
      >

        {
          editingId
            ? 'Update Staff Cost Projection'
            : 'Save Staff Cost Projection'
        }

      </button>

      <hr />

      <h2>
        Filters
      </h2>

      <select
        value={
          filterYear
        }
        onChange={(e) =>
          setFilterYear(
            e.target.value
          )
        }
      >

        <option value="">
          All Years
        </option>

        <option>
          2025
        </option>

        <option>
          2026
        </option>

        <option>
          2027
        </option>

      </select>

      <select
        value={
          filterQuarter
        }
        onChange={(e) => {

          const newQuarter =
            e.target.value

          setFilterQuarter(
            newQuarter
          )

          if (
            filterMonth &&
            newQuarter &&
            !getQuarterMonths(
              newQuarter
            ).includes(
              Number(
                filterMonth
              )
            )
          ) {
            setFilterMonth('')
          }

        }}
        style={{
          marginLeft: 10
        }}
      >

        <option value="">
          All Quarters
        </option>

        <option>
          Q1
        </option>

        <option>
          Q2
        </option>

        <option>
          Q3
        </option>

        <option>
          Q4
        </option>

      </select>

      <select
        value={
          filterMonth
        }
        onChange={(e) =>
          setFilterMonth(
            e.target.value
          )
        }
        style={{
          marginLeft: 10
        }}
      >

        <option value="">
          All Months
        </option>

        {
          monthOptions.map(
            (month) => (

              <option
                key={
                  month.index
                }
                value={
                  month.index
                }
              >
                {
                  month.name
                }
              </option>

            )
          )
        }

      </select>

      <select
        value={
          filterProject
        }
        onChange={(e) =>
          setFilterProject(
            e.target.value
          )
        }
        style={{
          marginLeft: 10
        }}
      >

        <option>
          All Projects
        </option>

        {
          [
            ...new Set(
              projections
                .map(
                  (p) =>
                    p.project
                )
                .filter(
                  Boolean
                )
            )
          ].map(
            (projectName) => (

              <option
                key={
                  projectName
                }
                value={
                  projectName
                }
              >
                {
                  projectName
                }
              </option>

            )
          )
        }

      </select>

      <input
        placeholder="Purpose"
        value={
          filterPurpose
        }
        onChange={(e) =>
          setFilterPurpose(
            e.target.value
          )
        }
        style={{
          marginLeft: 10
        }}
      />

      <button
        onClick={() => {

          setFilterYear('')
          setFilterQuarter('')
          setFilterMonth('')
          setFilterProject(
            'All Projects'
          )
          setFilterPurpose('')

        }}
        style={{
          marginLeft: 10
        }}
      >
        Clear Filter
      </button>

      <hr />

      <div
        style={{
          marginBottom: 15,
          padding: 10,
          border:
            '1px solid #ddd'
        }}
      >

        <div
          style={{
            marginTop: 15,
            marginBottom: 15
          }}
        >

          <button
            onClick={
              exportStaffCostCSV
            }
          >
            Export Staff Cost
          </button>

          <button
            onClick={
              exportServiceCostCSV
            }
            style={{
              marginLeft: 10
            }}
          >
            Export Service Cost
          </button>

          <button
            onClick={
              exportAllProjectionsCSV
            }
            style={{
              marginLeft: 10
            }}
          >
            Export All Projections
          </button>

        </div>

        <strong>
          Show / Hide Staff Cost Columns
        </strong>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 10
          }}
        >

          {
            Object.keys(
              staffColumns
            ).map(
              (key) => (

                <label
                  key={key}
                >

                  <input
                    type="checkbox"
                    checked={
                      staffColumns[
                        key
                      ]
                    }
                    onChange={() =>
                      setStaffColumns({
                        ...staffColumns,
                        [key]:
                          !staffColumns[
                            key
                          ]
                      })
                    }
                  />

                  {' '}

                  {key}

                </label>

              )
            )
          }

        </div>

      </div>

      {
        filterMonth && (

          <p
            style={{
              marginTop: 10,
              padding: 10,
              border:
                '1px solid #ddd',
              background:
                '#f7f7f7'
            }}
          >

            <strong>
              Monthly View:
            </strong>
            {' '}

            {
              MONTH_NAMES[
                Number(
                  filterMonth
                )
              ]
            }
            {' '}

            {
              filterYear ||
              'selected year'
            }.

            The underlying
            projection remains
            quarter-level. The
            table is showing
            monthly available
            days and monthly
            projected spend
            derived from
            Leave Data.

          </p>

        )
      }

      <h2>

        Saved Projections
        (Staff Cost):
        {' '}
        SEK
        {' '}

        {
          totalProjectedBudgetSEK.toFixed(
            2
          )
        }

      </h2>

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

            {
              staffColumns.year &&
              <th
                style={
                  centerCell
                }
              >
                Year
              </th>
            }

            {
              staffColumns.quarter &&
              <th
                style={
                  centerCell
                }
              >
                Quarter
              </th>
            }

            {
              staffColumns.project &&
              <th
                style={
                  centerCell
                }
              >
                Project
              </th>
            }

            {
              staffColumns.resource &&
              <th
                style={
                  centerCell
                }
              >
                Resource
              </th>
            }

            {
              staffColumns.purpose &&
              <th
                style={
                  centerCell
                }
              >
                Purpose
              </th>
            }

            {
              staffColumns.days &&
              <th
                style={
                  centerCell
                }
              >
                {
                  filterMonth
                    ? 'Work Days (Month)'
                    : 'Days'
                }
              </th>
            }

            {
              staffColumns.holidayDays &&
              <th
                style={
                  centerCell
                }
              >
                Holiday Days
              </th>
            }

            {
              staffColumns.leaveDays &&
              <th
                style={
                  centerCell
                }
              >
                Leave Days
              </th>
            }

            {
              staffColumns.availableDays &&
              <th
                style={
                  centerCell
                }
              >
                Available Days
              </th>
            }

            {
              staffColumns.hours &&
              <th
                style={
                  centerCell
                }
              >
                Hours
              </th>
            }

            {
              staffColumns.rate &&
              <th
                style={
                  centerCell
                }
              >
                Rate
              </th>
            }

            {
              staffColumns.currency &&
              <th
                style={
                  centerCell
                }
              >
                Currency
              </th>
            }

            {
              staffColumns.fte &&
              <th
                style={
                  centerCell
                }
              >
                FTE
              </th>
            }

            {
              staffColumns.projectedSpend &&
              <th
                style={
                  centerCell
                }
              >
                {
                  filterMonth
                    ? 'Projected Spend (Month)'
                    : 'Projected Spend'
                }
              </th>
            }

            {
              staffColumns.projectedSpendSEK &&
              <th
                style={
                  centerCell
                }
              >
                {
                  filterMonth
                    ? 'Projected Spend (Month, SEK)'
                    : 'Projected Spend (SEK)'
                }
              </th>
            }

            {
              staffColumns.actions &&
              <th
                style={
                  centerCell
                }
              >
                Actions
              </th>
            }

          </tr>

        </thead>

        <tbody>
                      {
            filteredProjections.map(
              (item) => {

                const displayMetrics =
                  getProjectionDisplayMetrics(
                    item
                  )

                const budget =
                  displayMetrics.budget

                const budgetSEK =
                  convertToSEK(
                    budget,
                    item.currency
                  )

                return (

                  <tr
                    key={
                      item.id
                    }
                  >

                    {
                      staffColumns.year &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          item.year
                        }
                      </td>
                    }

                    {
                      staffColumns.quarter &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          item.quarter
                        }
                      </td>
                    }

                    {
                      staffColumns.project &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          item.project
                        }
                      </td>
                    }

                    {
                      staffColumns.resource &&
                      <td>
                        {
                          item.resource
                        }
                      </td>
                    }

                    {
                      staffColumns.purpose &&
                      <td>
                        {
                          item.purpose
                        }
                      </td>
                    }

                    {
                      staffColumns.days &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          displayMetrics
                            .workDays
                        }
                      </td>
                    }

                    {
                      staffColumns.holidayDays &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          displayMetrics
                            .holidayDays
                        }
                      </td>
                    }

                    {
                      staffColumns.leaveDays &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          displayMetrics
                            .leaveDays
                        }
                      </td>
                    }

                    {
                      staffColumns.availableDays &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          displayMetrics
                            .availableDays
                        }
                      </td>
                    }

                    {
                      staffColumns.hours &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          item.hoursPerDay
                        }
                      </td>
                    }

                    {
                      staffColumns.rate &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          item.manHourRate
                        }
                      </td>
                    }

                    {
                      staffColumns.currency &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          item.currency
                        }
                      </td>
                    }

                    {
                      staffColumns.fte &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          item.fteFactor
                        }
                      </td>
                    }

                    {
                      staffColumns.projectedSpend &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          budget.toFixed(
                            2
                          )
                        }
                      </td>
                    }

                    {
                      staffColumns.projectedSpendSEK &&
                      <td
                        style={
                          centerCell
                        }
                      >
                        {
                          budgetSEK.toFixed(
                            2
                          )
                        }
                      </td>
                    }

                    {
                      staffColumns.actions &&
                      <td
                        style={
                          centerCell
                        }
                      >

                        <button
                          onClick={() =>
                            handleEdit(
                              item
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              item.id
                            )
                          }
                          style={{
                            marginLeft: 5
                          }}
                        >
                          Delete
                        </button>

                      </td>
                    }

                  </tr>

                )
              }
            )
          }

        </tbody>

      </table>

      <hr />

      <h1>
        Service Cost Projection
      </h1>

      <h2>
        Add Service Cost Projection
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, 1fr)',
          gap: 10,
          maxWidth: 900
        }}
      >

        <select
          value={
            serviceYear
          }
          onChange={(e) =>
            setServiceYear(
              e.target.value
            )
          }
        >

          <option>
            2025
          </option>

          <option>
            2026
          </option>

          <option>
            2027
          </option>

        </select>

        <select
          value={
            serviceQuarter
          }
          onChange={(e) =>
            setServiceQuarter(
              e.target.value
            )
          }
        >

          <option>
            Q1
          </option>

          <option>
            Q2
          </option>

          <option>
            Q3
          </option>

          <option>
            Q4
          </option>

        </select>

        <input
          placeholder="Project"
          value={
            serviceProject
          }
          onChange={(e) =>
            setServiceProject(
              e.target.value
            )
          }
        />

        <input
          placeholder="Purpose"
          value={
            servicePurpose
          }
          onChange={(e) =>
            setServicePurpose(
              e.target.value
            )
          }
        />

        <select
          value={
            serviceCurrency
          }
          onChange={(e) =>
            setServiceCurrency(
              e.target.value
            )
          }
        >

          <option>
            SEK
          </option>

          <option>
            USD
          </option>

          <option>
            EUR
          </option>

          <option>
            INR
          </option>

        </select>

        <input
          type="number"
          placeholder="Projected Spend"
          value={
            serviceBudget
          }
          onChange={(e) =>
            setServiceBudget(
              e.target.value
            )
          }
        />

      </div>

      <br />

      <button
        onClick={
          handleSaveService
        }
      >

        {
          editingServiceId
            ? 'Update Service Cost Projection'
            : 'Save Service Cost Projection'
        }

      </button>

      <hr />

      <h2>

        Saved Projections
        (Service Cost):
        {' '}
        SEK
        {' '}

        {
          totalServiceSEK.toFixed(
            2
          )
        }

      </h2>

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

            <th
              style={
                centerCell
              }
            >
              Year
            </th>

            <th
              style={
                centerCell
              }
            >
              Quarter
            </th>

            <th
              style={
                centerCell
              }
            >
              Project
            </th>

            <th
              style={
                centerCell
              }
            >
              Purpose
            </th>

            <th
              style={
                centerCell
              }
            >
              Currency
            </th>

            <th
              style={
                centerCell
              }
            >
              Projected Spend
            </th>

            <th
              style={
                centerCell
              }
            >
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {
            filteredServiceProjections.map(
              (item) => (

                <tr
                  key={
                    item.id
                  }
                >

                  <td
                    style={
                      centerCell
                    }
                  >
                    {
                      item.year
                    }
                  </td>

                  <td
                    style={
                      centerCell
                    }
                  >
                    {
                      item.quarter
                    }
                  </td>

                  <td
                    style={
                      centerCell
                    }
                  >
                    {
                      item.project
                    }
                  </td>

                  <td>
                    {
                      item.purpose
                    }
                  </td>

                  <td
                    style={
                      centerCell
                    }
                  >
                    {
                      item.currency
                    }
                  </td>

                  <td
                    style={
                      centerCell
                    }
                  >
                    {
                      Number(
                        item.projectedBudget
                      ).toFixed(2)
                    }
                  </td>

                  <td
                    style={
                      centerCell
                    }
                  >

                    <button
                      onClick={() =>
                        handleEditService(
                          item
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteService(
                          item.id
                        )
                      }
                      style={{
                        marginLeft: 5
                      }}
                    >
                      Delete
                    </button>

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
