'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import {
  getProjectBudgets,
  getExpenses,
  getForexRates,
  getProjections,
  getServiceProjections,
  getResources
} from '../../lib/storage'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

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

const QUARTER_MONTHS = {
  Q1: [0, 1, 2],
  Q2: [3, 4, 5],
  Q3: [6, 7, 8],
  Q4: [9, 10, 11]
}

const LEAVE_DATA_STORAGE_KEY =
  'budgetTracker:leaveData'


/* =========================================================
   DATE / WORKDAY HELPERS
========================================================= */

function parseDate(value) {
  if (!value) {
    return null
  }

  const parts = String(value).split('-')

  if (parts.length !== 3) {
    return null
  }

  const [year, month, day] = parts.map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(
    year,
    month - 1,
    day
  )
}


function isWeekday(date) {
  const day = date.getDay()

  return (
    day !== 0 &&
    day !== 6
  )
}


function getQuarterStart(year, quarter) {
  return new Date(
    Number(year),
    QUARTER_MONTHS[quarter][0],
    1
  )
}


function getQuarterEnd(year, quarter) {
  return new Date(
    Number(year),
    QUARTER_MONTHS[quarter][2] + 1,
    0
  )
}


function getMonthStart(year, monthIndex) {
  return new Date(
    Number(year),
    monthIndex,
    1
  )
}


function getMonthEnd(year, monthIndex) {
  return new Date(
    Number(year),
    monthIndex + 1,
    0
  )
}


function getWorkDaysInPeriod(startDate, endDate) {
  if (
    !startDate ||
    !endDate ||
    startDate > endDate
  ) {
    return 0
  }

  let count = 0

  const current = new Date(startDate)

  while (current <= endDate) {
    if (isWeekday(current)) {
      count++
    }

    current.setDate(
      current.getDate() + 1
    )
  }

  return count
}


function getDateKey(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}


function getLeaveData() {
  if (
    typeof window === 'undefined'
  ) {
    return []
  }

  try {
    return JSON.parse(
      localStorage.getItem(
        LEAVE_DATA_STORAGE_KEY
      ) || '[]'
    )
  } catch {
    return []
  }
}


/* =========================================================
   LEAVE / AVAILABILITY
========================================================= */

function calculateAvailabilityForPeriod(
  records,
  member,
  startDate,
  endDate
) {
  if (
    !startDate ||
    !endDate ||
    startDate > endDate
  ) {
    return {
      workDays: 0,
      companyHolidayDays: 0,
      personalLeaveDays: 0,
      availableDays: 0
    }
  }

  const workDays =
    getWorkDaysInPeriod(
      startDate,
      endDate
    )

  if (
    !member ||
    !records?.length
  ) {
    return {
      workDays,
      companyHolidayDays: 0,
      personalLeaveDays: 0,
      availableDays: workDays
    }
  }

  const companyHolidayDates =
    new Set()

  const personalLeaveDates =
    new Set()

  records
    .filter(
      record =>
        record['Member Name'] === member &&
        record.Status === 'Confirmed'
    )
    .forEach(record => {
      const start =
        parseDate(
          record['Start Date']
        )

      const end =
        parseDate(
          record['End Date']
        )

      if (!start || !end) {
        return
      }

      const effectiveStart =
        start > startDate
          ? start
          : startDate

      const effectiveEnd =
        end < endDate
          ? end
          : endDate

      if (
        effectiveStart >
        effectiveEnd
      ) {
        return
      }

      const current =
        new Date(
          effectiveStart
        )

      while (
        current <= effectiveEnd
      ) {
        if (isWeekday(current)) {
          const key =
            getDateKey(current)

          if (
            record['Leave Type'] ===
            'Company Holiday'
          ) {
            companyHolidayDates.add(
              key
            )
          }

          if (
            record['Leave Type'] ===
            'Personal Leave'
          ) {
            personalLeaveDates.add(
              key
            )
          }
        }

        current.setDate(
          current.getDate() + 1
        )
      }
    })

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


function calculateMonthlyAvailability(
  records,
  member,
  year,
  monthIndex,
  projectStartDate,
  projectLastWorkingDay
) {
  let startDate =
    getMonthStart(
      year,
      monthIndex
    )

  let endDate =
    getMonthEnd(
      year,
      monthIndex
    )

  const assignmentStart =
    parseDate(
      projectStartDate
    )

  const assignmentEnd =
    parseDate(
      projectLastWorkingDay
    )

  if (
    assignmentStart &&
    assignmentStart > startDate
  ) {
    startDate =
      assignmentStart
  }

  if (
    assignmentEnd &&
    assignmentEnd < endDate
  ) {
    endDate =
      assignmentEnd
  }

  return calculateAvailabilityForPeriod(
    records,
    member,
    startDate,
    endDate
  )
}


function getExpenseMonthIndex(expense) {
  if (!expense?.date) {
    return null
  }

  const date =
    new Date(expense.date)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null
  }

  return date.getMonth()
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ExecutiveSummary() {
  const currentDate =
    new Date()

  const currentYear =
    String(
      currentDate.getFullYear()
    )

  const currentMonth =
    currentDate.getMonth()

  const currentQuarter =
    currentMonth <= 2
      ? 'Q1'
      : currentMonth <= 5
        ? 'Q2'
        : currentMonth <= 8
          ? 'Q3'
          : 'Q4'
    /* =======================================================
     DATA
  ======================================================= */

  const [budgets, setBudgets] =
    useState([])

  const [expenses, setExpenses] =
    useState([])

  const [projections, setProjections] =
    useState([])

  const [
    serviceProjections,
    setServiceProjections
  ] = useState([])

  const [forexRates, setForexRates] =
    useState([])

  const [resources, setResources] =
    useState([])

  const [leaveData, setLeaveData] =
    useState([])

  /*
    Toggle requested for displaying
    either compact M/K values or
    complete numeric values.
  */
  const [
    showFullNumbers,
    setShowFullNumbers
  ] = useState(false)


  /* =======================================================
     FILTERS
  ======================================================= */

  const [yearFilter, setYearFilter] =
    useState(currentYear)

  const [
    quarterFilter,
    setQuarterFilter
  ] =
    useState('All Quarters')

  const [
    projectFilter,
    setProjectFilter
  ] =
    useState('All Projects')

  const [
    purposeFilter,
    setPurposeFilter
  ] =
    useState('All Purposes')


  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    setBudgets(
      getProjectBudgets()
    )

    setExpenses(
      getExpenses()
    )

    setProjections(
      getProjections()
    )

    setServiceProjections(
      getServiceProjections()
    )

    setForexRates(
      getForexRates()
    )

    setResources(
      getResources()
    )

    setLeaveData(
      getLeaveData()
    )
  }, [])


  /* =======================================================
     CURRENCY CONVERSION
  ======================================================= */

  function convertToSEK(
    amount,
    currency
  ) {
    const value =
      Number(amount || 0)

    if (
      !currency ||
      currency === 'SEK'
    ) {
      return value
    }

    const rate =
      forexRates.find(
        r =>
          r.currency === currency
      )

    return rate
      ? value *
        Number(
          rate.rate || 0
        )
      : value
  }


  /* =======================================================
     AVAILABLE FILTER VALUES
  ======================================================= */

  const availableYears =
    useMemo(() => {
      const values =
        new Set([
          currentYear
        ])

      ;[
        ...budgets,
        ...expenses,
        ...projections,
        ...serviceProjections
      ].forEach(item => {
        if (item.year) {
          values.add(
            item.year
          )
        }
      })

      return Array.from(values)
        .filter(Boolean)
        .sort()
    }, [
      budgets,
      expenses,
      projections,
      serviceProjections,
      currentYear
    ])


  const availableProjects =
    useMemo(() => {
      const values =
        new Set()

      ;[
        ...budgets,
        ...expenses,
        ...projections,
        ...serviceProjections
      ].forEach(item => {
        if (
          String(item.year) ===
            String(yearFilter) &&
          item.project
        ) {
          values.add(
            item.project
          )
        }
      })

      return Array.from(values)
        .sort()
    }, [
      budgets,
      expenses,
      projections,
      serviceProjections,
      yearFilter
    ])


  const availablePurposes =
    useMemo(() => {
      const values =
        new Set()

      ;[
        ...budgets,
        ...expenses,
        ...projections,
        ...serviceProjections
      ].forEach(item => {
        if (
          String(item.year) ===
            String(yearFilter) &&
          item.purpose
        ) {
          values.add(
            item.purpose
          )
        }
      })

      return Array.from(values)
        .sort()
    }, [
      budgets,
      expenses,
      projections,
      serviceProjections,
      yearFilter
    ])


  function matchesCommonFilters(item) {
    return (
      String(item.year) ===
        String(yearFilter) &&
      (
        quarterFilter ===
          'All Quarters' ||
        item.quarter ===
          quarterFilter
      ) &&
      (
        projectFilter ===
          'All Projects' ||
        item.project ===
          projectFilter
      ) &&
      (
        purposeFilter ===
          'All Purposes' ||
        item.purpose ===
          purposeFilter
      )
    )
  }


  const filteredBudgets =
    budgets.filter(
      matchesCommonFilters
    )

  const filteredExpenses =
    expenses.filter(
      matchesCommonFilters
    )

  const filteredStaffProjections =
    projections.filter(
      matchesCommonFilters
    )

  const filteredServiceProjections =
    serviceProjections.filter(
      matchesCommonFilters
    )


  /* =======================================================
     RESOURCE DETAILS
  ======================================================= */

  function getResourceDetails(item) {
    const resource =
      resources.find(
        r =>
          r.resourceName ===
          item.resource
      )

    return {
      member:
        resource?.leaveTrackerMember ||
        item.leaveTrackerMember ||
        '',

      start:
        resource?.projectStartDate ||
        item.projectStartDate ||
        '',

      end:
        resource?.projectLastWorkingDay ||
        item.projectLastWorkingDay ||
        ''
    }
  }


  /* =======================================================
     STAFF MONTHLY PROJECTION
  ======================================================= */

  function calculateStaffMonth(
    item,
    monthIndex
  ) {
    const details =
      getResourceDetails(
        item
      )

    const availability =
      calculateMonthlyAvailability(
        leaveData,
        details.member,
        item.year,
        monthIndex,
        details.start,
        details.end
      )

    const amount =
      availability.availableDays *
      Number(
        item.hoursPerDay || 0
      ) *
      Number(
        item.manHourRate || 0
      ) *
      Number(
        item.fteFactor || 0
      )

    return convertToSEK(
      amount,
      item.currency
    )
  }


  function calculateStaffQuarter(item) {
    return QUARTER_MONTHS[
      item.quarter
    ].reduce(
      (
        sum,
        month
      ) =>
        sum +
        calculateStaffMonth(
          item,
          month
        ),
      0
    )
  }
    /* =======================================================
     SERVICE MONTHLY PROJECTION

     Service Projection Planning currently
     stores quarter-level projection only.

     Therefore monthly service projection
     is derived as Quarter / 3.
  ======================================================= */

  function calculateServiceMonth(item) {
    return convertToSEK(
      Number(
        item.projectedBudget || 0
      ) / 3,
      item.currency
    )
  }


  /* =======================================================
     MONTHLY PROJECTION
  ======================================================= */

  function calculateMonthlyProjection(
    year,
    quarter,
    monthIndex,
    project = null,
    purpose = null
  ) {
    const staff =
      projections
        .filter(
          item =>
            String(item.year) ===
              String(year) &&
            item.quarter ===
              quarter &&
            (
              project === null ||
              item.project ===
                project
            ) &&
            (
              purpose === null ||
              item.purpose ===
                purpose
            )
        )
        .reduce(
          (
            sum,
            item
          ) =>
            sum +
            calculateStaffMonth(
              item,
              monthIndex
            ),
          0
        )

    const service =
      serviceProjections
        .filter(
          item =>
            String(item.year) ===
              String(year) &&
            item.quarter ===
              quarter &&
            (
              project === null ||
              item.project ===
                project
            ) &&
            (
              purpose === null ||
              item.purpose ===
                purpose
            )
        )
        .reduce(
          (
            sum,
            item
          ) =>
            sum +
            calculateServiceMonth(
              item
            ),
          0
        )

    return (
      staff +
      service
    )
  }


  /* =======================================================
     QUARTER ACTUAL
  ======================================================= */

  function getQuarterActual(
    year,
    quarter,
    project = null,
    purpose = null
  ) {
    return expenses
      .filter(
        item =>
          String(item.year) ===
            String(year) &&
          item.quarter ===
            quarter &&
          (
            project === null ||
            item.project ===
              project
          ) &&
          (
            purpose === null ||
            item.purpose ===
              purpose
          )
      )
      .reduce(
        (
          sum,
          item
        ) =>
          sum +
          convertToSEK(
            item.amount,
            item.currency
          ),
        0
      )
  }


  /* =======================================================
     MONTH ACTUAL

     Important:
     hasActual is based on record existence,
     NOT amount > 0.

     Therefore:

       July = 350K record
             -> actual

       August = 0 record
             -> actual

       September = no record
             -> projection
  ======================================================= */

  function getMonthActual(
    year,
    quarter,
    monthIndex,
    project = null,
    purpose = null
  ) {
    const matching =
      expenses.filter(
        item =>
          String(item.year) ===
            String(year) &&
          item.quarter ===
            quarter &&
          getExpenseMonthIndex(
            item
          ) === monthIndex &&
          (
            project === null ||
            item.project ===
              project
          ) &&
          (
            purpose === null ||
            item.purpose ===
              purpose
          )
      )

    return {
      hasActual:
        matching.length > 0,

      amount:
        matching.reduce(
          (
            sum,
            item
          ) =>
            sum +
            convertToSEK(
              item.amount,
              item.currency
            ),
          0
        )
    }
  }


  /* =======================================================
     QUARTER PROJECTION
  ======================================================= */

  function getQuarterProjection(
    year,
    quarter,
    project = null,
    purpose = null
  ) {
    return QUARTER_MONTHS[
      quarter
    ].reduce(
      (
        sum,
        month
      ) =>
        sum +
        calculateMonthlyProjection(
          year,
          quarter,
          month,
          project,
          purpose
        ),
      0
    )
  }


  function isCompleted(
    year,
    quarter
  ) {
    return (
      getQuarterEnd(
        year,
        quarter
      ) < currentDate
    )
  }


  function isFuture(
    year,
    quarter
  ) {
    return (
      getQuarterStart(
        year,
        quarter
      ) > currentDate
    )
  }


  /* =======================================================
     QUARTER EAC

     Completed:
       Actual only

     Future:
       Projection only

     Ongoing:
       Actual for months where an Expense
       Tracking record exists +

       Projection for months where actual
       data is not yet available.
  ======================================================= */

  function calculateQuarterEAC(
    year,
    quarter,
    project = null,
    purpose = null
  ) {
    const actual =
      getQuarterActual(
        year,
        quarter,
        project,
        purpose
      )

    const projection =
      getQuarterProjection(
        year,
        quarter,
        project,
        purpose
      )

    if (
      isCompleted(
        year,
        quarter
      )
    ) {
      return actual
    }

    if (
      isFuture(
        year,
        quarter
      )
    ) {
      return projection
    }

    return QUARTER_MONTHS[
      quarter
    ].reduce(
      (
        sum,
        month
      ) => {
        const monthActual =
          getMonthActual(
            year,
            quarter,
            month,
            project,
            purpose
          )

        return (
          sum +
          (
            monthActual.hasActual
              ? monthActual.amount
              : calculateMonthlyProjection(
                  year,
                  quarter,
                  month,
                  project,
                  purpose
                )
          )
        )
      },
      0
    )
  }


  /* =======================================================
     TOTAL PROJECTIONS
  ======================================================= */

  const totalActualSEK =
    filteredExpenses.reduce(
      (
        sum,
        item
      ) =>
        sum +
        convertToSEK(
          item.amount,
          item.currency
        ),
      0
    )

  const totalStaffProjectionSEK =
    filteredStaffProjections.reduce(
      (
        sum,
        item
      ) =>
        sum +
        calculateStaffQuarter(
          item
        ),
      0
    )

  const totalServiceProjectionSEK =
    filteredServiceProjections.reduce(
      (
        sum,
        item
      ) =>
        sum +
        convertToSEK(
          item.projectedBudget,
          item.currency
        ),
      0
    )

  const totalProjectionSEK =
    totalStaffProjectionSEK +
    totalServiceProjectionSEK
    /* =======================================================
     ROLLING QUARTERLY BUDGET

     Effective Budget =
       Allocated Budget +
       Previous Quarter Balance

     Previous Quarter Balance =
       Previous Effective Budget -
       Previous Actual
  ======================================================= */

  const quarterlySummary = []

  let previousQuarterBalance = 0

  QUARTERS.forEach(
    quarter => {
      const quarterBudgets =
        budgets.filter(
          item =>
            String(item.year) ===
              String(yearFilter) &&
            item.quarter ===
              quarter &&
            (
              projectFilter ===
                'All Projects' ||
              item.project ===
                projectFilter
            ) &&
            (
              purposeFilter ===
                'All Purposes' ||
              item.purpose ===
                purposeFilter
            )
        )

      const allocatedBudget =
        quarterBudgets.reduce(
          (
            sum,
            item
          ) =>
            sum +
            convertToSEK(
              item.budget ??
                item.total_budget ??
                0,
              item.currency
            ),
          0
        )

      const effectiveBudget =
        allocatedBudget +
        previousQuarterBalance

      const project =
        projectFilter ===
          'All Projects'
          ? null
          : projectFilter

      const purpose =
        purposeFilter ===
          'All Purposes'
          ? null
          : purposeFilter

      const actual =
        getQuarterActual(
          yearFilter,
          quarter,
          project,
          purpose
        )

      /*
        Projection is calculated independently
        for every quarter.

        This value is always available to
        the quarterly table.
      */
      const projection =
        getQuarterProjection(
          yearFilter,
          quarter,
          project,
          purpose
        )

      const eac =
        calculateQuarterEAC(
          yearFilter,
          quarter,
          project,
          purpose
        )

      const variance =
        effectiveBudget -
        eac

      const utilization =
        effectiveBudget > 0
          ? (
              actual /
              effectiveBudget
            ) * 100
          : 0

      quarterlySummary.push({
        quarter,
        allocatedBudget,
        effectiveBudget,
        actual,
        projection,
        eac,
        variance,
        utilization
      })

      previousQuarterBalance =
        effectiveBudget -
        actual
    }
  )


  /* =======================================================
     KPI BUDGET

     All Quarters:
       Use total original allocations.

     Specific Quarter:
       Use that quarter's effective budget.

     This avoids double-counting carry-forward
     balances in the annual KPI.
  ======================================================= */

  const totalAllocatedBudgetSEK =
    quarterlySummary.reduce(
      (
        sum,
        row
      ) =>
        sum +
        row.allocatedBudget,
      0
    )

  const selectedQuarterSummary =
    quarterFilter ===
      'All Quarters'
      ? null
      : quarterlySummary.find(
          row =>
            row.quarter ===
            quarterFilter
        )

  const totalBudgetSEK =
    selectedQuarterSummary
      ? selectedQuarterSummary.effectiveBudget
      : totalAllocatedBudgetSEK


  /* =======================================================
     FORECAST / EAC
  ======================================================= */

  const forecastEACSEK =
    quarterlySummary
      .filter(
        row =>
          quarterFilter ===
            'All Quarters' ||
          row.quarter ===
            quarterFilter
      )
      .reduce(
        (
          sum,
          row
        ) =>
          sum +
          row.eac,
        0
      )

  const forecastVarianceSEK =
    totalBudgetSEK -
    forecastEACSEK

  const forecastVariancePercent =
    totalBudgetSEK > 0
      ? (
          forecastVarianceSEK /
          totalBudgetSEK
        ) * 100
      : 0

  const actualUtilizationPercent =
    totalBudgetSEK > 0
      ? (
          totalActualSEK /
          totalBudgetSEK
        ) * 100
      : 0

  const forecastUtilizationPercent =
    totalBudgetSEK > 0
      ? (
          forecastEACSEK /
          totalBudgetSEK
        ) * 100
      : 0

  const forecastHeadroomSEK =
    Math.max(
      0,
      forecastVarianceSEK
    )

  const forecastOverrunSEK =
    Math.max(
      0,
      -forecastVarianceSEK
    )


  function getSelectedQuarters() {
    return (
      quarterFilter ===
        'All Quarters'
        ? QUARTERS
        : [quarterFilter]
    )
  }


  /* =======================================================
     PURPOSE EAC
  ======================================================= */

  function calculatePurposeEAC(
    purpose
  ) {
    const normalizedPurpose =
      purpose === 'Unspecified'
        ? ''
        : purpose

    return getSelectedQuarters()
      .reduce(
        (
          sum,
          quarter
        ) =>
          sum +
          calculateQuarterEAC(
            yearFilter,
            quarter,
            projectFilter ===
              'All Projects'
              ? null
              : projectFilter,
            normalizedPurpose
          ),
        0
      )
  }


  /* =======================================================
     PROJECT EAC
  ======================================================= */

  function calculateProjectEAC(
    project
  ) {
    const normalizedProject =
      project === 'Unspecified'
        ? ''
        : project

    return getSelectedQuarters()
      .reduce(
        (
          sum,
          quarter
        ) =>
          sum +
          calculateQuarterEAC(
            yearFilter,
            quarter,
            normalizedProject,
            purposeFilter ===
              'All Purposes'
              ? null
              : purposeFilter
          ),
        0
      )
  }
    /* =======================================================
     PURPOSE SUMMARY
  ======================================================= */

  const purposeSummary =
    useMemo(
      () => {
        const map = {}

        const ensure =
          purpose => {
            const key =
              purpose ||
              'Unspecified'

            if (!map[key]) {
              map[key] = {
                purpose: key,
                budget: 0,
                actual: 0,
                projection: 0
              }
            }

            return map[key]
          }

        filteredBudgets.forEach(
          item =>
            ensure(
              item.purpose
            ).budget +=
              convertToSEK(
                item.budget ??
                  item.total_budget ??
                  0,
                item.currency
              )
        )

        filteredExpenses.forEach(
          item =>
            ensure(
              item.purpose
            ).actual +=
              convertToSEK(
                item.amount,
                item.currency
              )
        )

        filteredStaffProjections.forEach(
          item =>
            ensure(
              item.purpose
            ).projection +=
              calculateStaffQuarter(
                item
              )
        )

        filteredServiceProjections.forEach(
          item =>
            ensure(
              item.purpose
            ).projection +=
              convertToSEK(
                item.projectedBudget,
                item.currency
              )
        )

        return Object.values(map)
          .map(
            row => {
              const eac =
                calculatePurposeEAC(
                  row.purpose
                )

              return {
                ...row,
                eac,
                variance:
                  row.budget -
                  eac,
                actualUtilization:
                  row.budget > 0
                    ? (
                        row.actual /
                        row.budget
                      ) * 100
                    : 0
              }
            }
          )
          .sort(
            (
              a,
              b
            ) =>
              b.eac -
              a.eac
          )
      },
      [
        filteredBudgets,
        filteredExpenses,
        filteredStaffProjections,
        filteredServiceProjections,
        resources,
        leaveData,
        forexRates,
        yearFilter,
        quarterFilter,
        projectFilter,
        purposeFilter
      ]
    )


  /* =======================================================
     PROJECT SUMMARY
  ======================================================= */

  const projectSummary =
    useMemo(
      () => {
        const map = {}

        const ensure =
          project => {
            const key =
              project ||
              'Unspecified'

            if (!map[key]) {
              map[key] = {
                project: key,
                budget: 0,
                actual: 0,
                projection: 0
              }
            }

            return map[key]
          }

        filteredBudgets.forEach(
          item =>
            ensure(
              item.project
            ).budget +=
              convertToSEK(
                item.budget ??
                  item.total_budget ??
                  0,
                item.currency
              )
        )

        filteredExpenses.forEach(
          item =>
            ensure(
              item.project
            ).actual +=
              convertToSEK(
                item.amount,
                item.currency
              )
        )

        filteredStaffProjections.forEach(
          item =>
            ensure(
              item.project
            ).projection +=
              calculateStaffQuarter(
                item
              )
        )

        filteredServiceProjections.forEach(
          item =>
            ensure(
              item.project
            ).projection +=
              convertToSEK(
                item.projectedBudget,
                item.currency
              )
        )

        return Object.values(map)
          .map(
            row => {
              const eac =
                calculateProjectEAC(
                  row.project
                )

              return {
                ...row,
                eac,
                variance:
                  row.budget -
                  eac,
                utilization:
                  row.budget > 0
                    ? (
                        row.actual /
                        row.budget
                      ) * 100
                    : 0
              }
            }
          )
          .sort(
            (
              a,
              b
            ) =>
              b.eac -
              a.eac
          )
      },
      [
        filteredBudgets,
        filteredExpenses,
        filteredStaffProjections,
        filteredServiceProjections,
        resources,
        leaveData,
        forexRates,
        yearFilter,
        quarterFilter,
        projectFilter,
        purposeFilter
      ]
    )


  /* =======================================================
     EXECUTIVE ATTENTION
  ======================================================= */

  const attentionItems =
    useMemo(
      () => {
        const items = []

        if (
          forecastOverrunSEK > 0
        ) {
          items.push({
            type: 'warning',
            title:
              'Forecast exceeds budget',
            message:
              `Current forecast is ${formatCurrency(
                forecastOverrunSEK
              )} above the applicable budget.`
          })
        } else if (
          totalBudgetSEK > 0
        ) {
          items.push({
            type: 'positive',
            title:
              'Forecast remains within budget',
            message:
              `${formatCurrency(
                forecastHeadroomSEK
              )} of forecast headroom remains.`
          })
        }

        if (
          actualUtilizationPercent >=
          90
        ) {
          items.push({
            type: 'warning',
            title:
              'High actual budget utilization',
            message:
              `${actualUtilizationPercent.toFixed(
                1
              )}% of the applicable budget has already been consumed.`
          })
        }

        projectSummary
          .filter(
            item =>
              item.budget > 0 &&
              item.eac >
                item.budget
          )
          .slice(0, 3)
          .forEach(
            item => {
              items.push({
                type: 'warning',
                title:
                  `${item.project} forecast`,
                message:
                  `Forecast is ${formatCurrency(
                    item.eac -
                    item.budget
                  )} above budget.`
              })
            }
          )

        if (
          !items.length
        ) {
          items.push({
            type: 'neutral',
            title:
              'No immediate financial attention',
            message:
              'There are no current exceptions based on the selected filters.'
          })
        }

        return items
      },
      [
        forecastOverrunSEK,
        forecastHeadroomSEK,
        actualUtilizationPercent,
        projectSummary,
        totalBudgetSEK
      ]
    )


  /* =======================================================
     FORMATTING
  ======================================================= */

  function formatCurrency(value) {
    const amount =
      Number(value || 0)

    /*
      Toggle ON:
        SEK 1,000,000

      Toggle OFF:
        SEK 1.00M
        SEK 949.6K
    */
    if (showFullNumbers) {
      return `SEK ${amount.toLocaleString(
        'en-US',
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }
      )}`
    }

    if (
      Math.abs(amount) >=
      1000000
    ) {
      return `SEK ${(amount / 1000000).toFixed(2)}M`
    }

    if (
      Math.abs(amount) >=
      1000
    ) {
      return `SEK ${(amount / 1000).toFixed(1)}K`
    }

    return `SEK ${amount.toFixed(0)}`
  }


  function formatPercent(value) {
    return `${Number(
      value || 0
    ).toFixed(1)}%`
  }


  function getVarianceLabel(value) {
    return (
      value > 0
        ? 'Headroom'
        : value < 0
          ? 'Over Budget'
          : 'On Budget'
    )
  }


  function clearFilters() {
    setYearFilter(
      currentYear
    )

    setQuarterFilter(
      'All Quarters'
    )

    setProjectFilter(
      'All Projects'
    )

    setPurposeFilter(
      'All Purposes'
    )
  }
    /* =======================================================
     UI
  ======================================================= */

  return (
    <div style={pageStyle}>

      <div style={cardStyle}>
        <h1
          style={{
            marginTop: 0,
            marginBottom: 8
          }}
        >
          Executive Financial Summary
        </h1>

        <p
          style={{
            margin: 0,
            color: '#666'
          }}
        >
          Business Sponsor View —
          Budget, Actual Consumption &
          Forecast
        </p>
      </div>


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
          href="/projections"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Projection Planning
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
      </div>


      <div style={cardStyle}>

        <h2
          style={{
            marginTop: 0
          }}
        >
          Filters
        </h2>

        <div
          style={filterGridStyle}
        >

          <div>
            <label>
              <strong>
                Year
              </strong>
            </label>

            <select
              value={yearFilter}
              onChange={
                e =>
                  setYearFilter(
                    e.target.value
                  )
              }
              style={inputStyle}
            >
              {availableYears.map(
                year => (
                  <option
                    key={year}
                  >
                    {year}
                  </option>
                )
              )}
            </select>
          </div>


          <div>
            <label>
              <strong>
                Quarter
              </strong>
            </label>

            <select
              value={quarterFilter}
              onChange={
                e =>
                  setQuarterFilter(
                    e.target.value
                  )
              }
              style={inputStyle}
            >
              <option>
                All Quarters
              </option>

              {QUARTERS.map(
                quarter => (
                  <option
                    key={quarter}
                  >
                    {quarter}
                  </option>
                )
              )}
            </select>
          </div>


          <div>
            <label>
              <strong>
                Project
              </strong>
            </label>

            <select
              value={projectFilter}
              onChange={
                e =>
                  setProjectFilter(
                    e.target.value
                  )
              }
              style={inputStyle}
            >
              <option>
                All Projects
              </option>

              {availableProjects.map(
                project => (
                  <option
                    key={project}
                  >
                    {project}
                  </option>
                )
              )}
            </select>
          </div>


          <div>
            <label>
              <strong>
                Purpose
              </strong>
            </label>

            <select
              value={purposeFilter}
              onChange={
                e =>
                  setPurposeFilter(
                    e.target.value
                  )
              }
              style={inputStyle}
            >
              <option>
                All Purposes
              </option>

              {availablePurposes.map(
                purpose => (
                  <option
                    key={purpose}
                  >
                    {purpose}
                  </option>
                )
              )}
            </select>
          </div>

        </div>


        <button
          onClick={clearFilters}
          style={{
            marginTop: 15
          }}
        >
          Clear Filters
        </button>

      </div>


      <div
        className="kpiGrid"
        style={kpiGridStyle}
      >

        <KPI
          title="Effective Budget"
          value={formatCurrency(
            totalBudgetSEK
          )}
        />

        <KPI
          title="Projected Spend"
          value={formatCurrency(
            totalProjectionSEK
          )}
        />
            
        <KPI
          title="Actual Consumption"
          value={formatCurrency(
            totalActualSEK
          )}
          sub={`${formatPercent(
            actualUtilizationPercent
          )} utilized (of Effective Budget)`}
        />

        <KPI
          title="Forecast / EAC"
          value={formatCurrency(
            forecastEACSEK
          )}
          sub={`${formatPercent(
            forecastUtilizationPercent
          )} of budget`}
        />

        <KPI
          title="Forecast Variance"
          value={formatCurrency(
            Math.abs(
              forecastVarianceSEK
            )
          )}
          sub={getVarianceLabel(
            forecastVarianceSEK
          )}
          positive={
            forecastVarianceSEK >= 0
          }
        />

        <KPI
          title="Budget Utilization"
          value={formatPercent(
            actualUtilizationPercent
          )}
          progress={
            actualUtilizationPercent
          }
        />

      </div>


      {/* ===================================================
          NUMBER DISPLAY TOGGLE
      =================================================== */}

      <div
        style={{
          ...cardStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          gap: 15,
          padding:
            '12px 16px'
        }}
      >

        <div>
          <strong>
            Display Values
          </strong>

          <div
            style={{
              fontSize: 12,
              color: '#666',
              marginTop: 3
            }}
          >
            Switch between compact
            M/K notation and full
            numeric values.
          </div>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            whiteSpace:
              'nowrap'
          }}
        >
          <input
            type="checkbox"
            checked={
              showFullNumbers
            }
            onChange={
              e =>
                setShowFullNumbers(
                  e.target.checked
                )
            }
          />

          Show full numeric values
        </label>

      </div>


      {/* ===================================================
          QUARTERLY SUMMARY TABLE
      =================================================== */}

      <Section
        title="Budget vs Actual vs Projection"
        subtitle={`Quarterly financial position for ${yearFilter}.`}
      >

        <Table>

          <thead>
            <tr
              style={headRowStyle}
            >
              <th style={thStyle}>
                Quarter
              </th>

              <th style={thStyle}>
                Allocated Budget
              </th>

              <th style={thStyle}>
                Effective Budget
              </th>

              <th style={thStyle}>
                Projected Spend
              </th>

              <th style={thStyle}>
                Actual Spend
              </th>

              <th style={thStyle}>
                Estimate at Completion
              </th>

              <th style={thStyle}>
                Variance
              </th>

              <th style={thStyle}>
                Utilization (Actual vs Effective)
              </th>
            </tr>
          </thead>


          <tbody>
            {quarterlySummary.map(
              row => (
                <tr
                  key={row.quarter}
                >

                  <td style={tdStyle}>
                    <strong>
                      {row.quarter}
                    </strong>
                  </td>

                  <td style={tdStyle}>
                    {formatCurrency(
                      row.allocatedBudget
                    )}
                  </td>

                  <td style={tdStyle}>
                    <strong>
                      {formatCurrency(
                        row.effectiveBudget
                      )}
                    </strong>
                  </td>

                  <td style={tdStyle}>
                    {formatCurrency(
                      row.projection
                    )}
                  </td>

                  <td style={tdStyle}>
                    {formatCurrency(
                      row.actual
                    )}
                  </td>

                  <td style={tdStyle}>
                    {formatCurrency(
                      row.eac
                    )}
                  </td>

                  <VarianceCell
                    value={
                      row.variance
                    }
                    fullNumeric={
                      showFullNumbers
                    }
                  />

                  <td style={tdStyle}>
                    {formatPercent(
                      row.utilization
                    )}
                  </td>

                </tr>
              )
            )}
          </tbody>


          <tfoot>

            <tr
              style={{
                background:
                  '#f8fafc',
                fontWeight:
                  'bold'
              }}
            >

              {/* Requested:
                  Total row renamed to year */}
              <td style={tdStyle}>
                {yearFilter}
              </td>


              {/* Annual Allocated Budget */}
              <td style={tdStyle}>
                {formatCurrency(
                  quarterlySummary.reduce(
                    (
                      sum,
                      row
                    ) =>
                      sum +
                      row.allocatedBudget,
                    0
                  )
                )}
              </td>


              {/* Requested:
                  Annual Effective Budget =
                  Annual Allocated Budget

                  Do NOT sum quarterly
                  effective budgets because
                  that would double-count
                  carry-forward balances.
              */}
              <td style={tdStyle}>
                {formatCurrency(
                  totalAllocatedBudgetSEK
                )}
              </td>


              {/* Annual Projected Spend */}
              <td style={tdStyle}>
                {formatCurrency(
                  quarterlySummary.reduce(
                    (
                      sum,
                      row
                    ) =>
                      sum +
                      row.projection,
                    0
                  )
                )}
              </td>


              {/* Annual Actual Spend */}
              <td style={tdStyle}>
                {formatCurrency(
                  quarterlySummary.reduce(
                    (
                      sum,
                      row
                    ) =>
                      sum +
                      row.actual,
                    0
                  )
                )}
              </td>


              {/* Annual Estimate at Completion */}
              <td style={tdStyle}>
                {formatCurrency(
                  quarterlySummary.reduce(
                    (
                      sum,
                      row
                    ) =>
                      sum +
                      row.eac,
                    0
                  )
                )}
              </td>


              {/* Annual variance */}
              <td style={tdStyle}>
                {formatCurrency(
                  totalAllocatedBudgetSEK -
                    quarterlySummary.reduce(
                      (
                        sum,
                        row
                      ) =>
                        sum +
                        row.eac,
                      0
                    )
                )}
              </td>


              {/* Annual utilization */}
              <td style={tdStyle}>
                {formatPercent(
                  actualUtilizationPercent
                )}
              </td>

            </tr>

          </tfoot>

        </Table>

      </Section>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 1fr',
          gap: 20,
          marginBottom: 20
        }}
      >

        <Section
          title="Forecast Position"
        >

          <div
            style={{
              fontSize: 30,
              fontWeight:
                'bold'
            }}
          >
            {formatCurrency(
              forecastEACSEK
            )}
          </div>

          <div
            style={{
              color: '#666',
              marginBottom: 15
            }}
          >
            Estimate at Completion
          </div>

          <SummaryLine
            label="Budget"
            value={formatCurrency(
              totalBudgetSEK
            )}
          />

          <SummaryLine
            label="Forecast"
            value={formatCurrency(
              forecastEACSEK
            )}
          />

          <SummaryLine
            label={
              forecastVarianceSEK >= 0
                ? 'Forecast Headroom'
                : 'Forecast Overrun'
            }
            value={formatCurrency(
              forecastVarianceSEK >= 0
                ? forecastHeadroomSEK
                : forecastOverrunSEK
            )}
          />

        </Section>


        <Section
          title="Projection Composition"
        >

          <SummaryLine
            label="Staff Cost"
            value={formatCurrency(
              totalStaffProjectionSEK
            )}
          />

          <SummaryLine
            label="Service Cost"
            value={formatCurrency(
              totalServiceProjectionSEK
            )}
          />

          <SummaryLine
            label="Total Projection"
            value={formatCurrency(
              totalProjectionSEK
            )}
            bold
          />

        </Section>

      </div>


      <Section
        title="Spend by Purpose"
      >

        <Table>

          <thead>
            <tr
              style={headRowStyle}
            >
              <th style={thStyle}>
                Purpose
              </th>

              <th style={thStyle}>
                Budget
              </th>

              <th style={thStyle}>
                Actual
              </th>

              <th style={thStyle}>
                Projection
              </th>

              <th style={thStyle}>
                Forecast Variance
              </th>

              <th style={thStyle}>
                Actual Utilization
              </th>
            </tr>
          </thead>


          <tbody>

            {purposeSummary.length ===
            0 ? (

              <tr>
                <td
                  colSpan="6"
                  style={{
                    ...tdStyle,
                    textAlign:
                      'center'
                  }}
                >
                  No data available
                  for the selected
                  filters.
                </td>
              </tr>

            ) : (

              purposeSummary.map(
                row => (
                  <tr
                    key={
                      row.purpose
                    }
                  >

                    <td
                      style={tdStyle}
                    >
                      <strong>
                        {row.purpose}
                      </strong>
                    </td>

                    <td
                      style={tdStyle}
                    >
                      {formatCurrency(
                        row.budget
                      )}
                    </td>

                    <td
                      style={tdStyle}
                    >
                      {formatCurrency(
                        row.actual
                      )}
                    </td>

                    <td
                      style={tdStyle}
                    >
                      {formatCurrency(
                        row.projection
                      )}
                    </td>

                    <VarianceCell
                      value={
                        row.variance
                      }
                      fullNumeric={
                        showFullNumbers
                      }
                    />

                    <td
                      style={tdStyle}
                    >
                      {formatPercent(
                        row.actualUtilization
                      )}
                    </td>

                  </tr>
                )
              )

            )}

          </tbody>

        </Table>

      </Section>


      <Section
        title="Project Financial Position"
      >

        <Table>

          <thead>
            <tr
              style={headRowStyle}
            >

              <th style={thStyle}>
                Project
              </th>

              <th style={thStyle}>
                Budget
              </th>

              <th style={thStyle}>
                Actual
              </th>

              <th style={thStyle}>
                Projection
              </th>

              <th style={thStyle}>
                Forecast / EAC
              </th>

              <th style={thStyle}>
                Variance
              </th>

              <th style={thStyle}>
                Actual Utilization
              </th>

            </tr>
          </thead>


          <tbody>

            {projectSummary.length ===
            0 ? (

              <tr>

                <td
                  colSpan="7"
                  style={{
                    ...tdStyle,
                    textAlign:
                      'center'
                  }}
                >
                  No project data
                  available.
                </td>

              </tr>

            ) : (

              projectSummary.map(
                row => (
                  <tr
                    key={
                      row.project
                    }
                  >

                    <td
                      style={tdStyle}
                    >
                      <strong>
                        {row.project}
                      </strong>
                    </td>

                    <td
                      style={tdStyle}
                    >
                      {formatCurrency(
                        row.budget
                      )}
                    </td>

                    <td
                      style={tdStyle}
                    >
                      {formatCurrency(
                        row.actual
                      )}
                    </td>

                    <td
                      style={tdStyle}
                    >
                      {formatCurrency(
                        row.projection
                      )}
                    </td>

                    <td
                      style={tdStyle}
                    >
                      {formatCurrency(
                        row.eac
                      )}
                    </td>

                    <VarianceCell
                      value={
                        row.variance
                      }
                      fullNumeric={
                        showFullNumbers
                      }
                    />

                    <td
                      style={tdStyle}
                    >
                      {formatPercent(
                        row.utilization
                      )}
                    </td>

                  </tr>
                )
              )

            )}

          </tbody>

        </Table>

      </Section>


      <Section
        title="Attention Required"
      >

        <div
          style={{
            display: 'grid',
            gap: 12
          }}
        >

          {attentionItems.map(
            (
              item,
              index
            ) => (

              <div
                key={index}
                style={{
                  padding: 15,
                  background:
                    item.type ===
                    'warning'
                      ? '#fff7ed'
                      : item.type ===
                        'positive'
                        ? '#f0fdf4'
                        : '#f8fafc',
                  border:
                    `1px solid ${
                      item.type ===
                      'warning'
                        ? '#fdba74'
                        : item.type ===
                          'positive'
                          ? '#86efac'
                          : '#cbd5e1'
                    }`,
                  borderRadius: 8
                }}
              >

                <strong>
                  {item.title}
                </strong>

                <div
                  style={{
                    marginTop: 5,
                    color: '#555'
                  }}
                >
                  {item.message}
                </div>

              </div>

            )
          )}

        </div>

      </Section>


      <div
  style={{
    ...cardStyle,
    color: '#666',
    fontSize: 13,
    lineHeight: 1.6
  }}
>

  <strong>
    Executive Summary methodology:
  </strong>

  <div
    style={{
      marginTop: 8
    }}
  >
    Budget is sourced from Project Budgets,
    Actual Consumption from Expense
    Tracking, and Projection from Staff
    and Service Projection Planning.
    Monthly EAC uses actual Expense
    Tracking records when available,
    including valid zero-value records;
    missing monthly actuals use monthly
    Projection Planning values. All
    financial values are normalized to SEK
    using the configured Forex Rates.
  </div>

  <div
    style={{
      marginTop: 10
    }}
  >
    <strong>
      Budget methodology:
    </strong>{' '}
    Effective Budget is calculated using
    the original Allocated Budget for the
    quarter plus the closing balance
    carried forward from the previous
    quarter. The closing balance is based
    on Actual Spend, not Estimate at
    Completion (EAC). Therefore, a forecast
    overrun in one quarter does not reduce
    the next quarter's Effective Budget
    until the corresponding actual spend
    is recorded. EAC is used to show the
    current forecast position against the
    Effective Budget.
  </div>

</div>
      <style jsx>{`

        @media (max-width: 1200px) {

          .kpiGrid {
            grid-template-columns:
              repeat(3, 1fr) !important;
          }

        }

        @media (max-width: 800px) {

          .kpiGrid {
            grid-template-columns:
              repeat(2, 1fr) !important;
          }

          .filterGrid {
            grid-template-columns:
              1fr 1fr !important;
          }

        }

      `}</style>

    </div>
  )
}


/* =========================================================
   REUSABLE UI COMPONENTS
========================================================= */

function KPI({
  title,
  value,
  sub,
  positive,
  progress
}) {

  return (

    <div
      className="kpiCard"
      style={{
        ...kpiCardStyle,
        borderLeft:
          positive !== undefined
            ? `5px solid ${
                positive
                  ? '#2e7d32'
                  : '#d32f2f'
              }`
            : undefined
      }}
    >

      <div
        style={kpiTitleStyle}
      >
        {title}
      </div>

      <div
        style={kpiValueStyle}
      >
        {value}
      </div>

      {sub && (

        <div
          style={kpiSubStyle}
        >
          {sub}
        </div>

      )}

      {progress !== undefined && (

        <div
          style={{
            marginTop: 10,
            background:
              '#e5e7eb',
            height: 8,
            borderRadius: 4
          }}
        >

          <div
            style={{
              width:
                `${Math.min(
                  progress,
                  100
                )}%`,
              height: '100%',
              background:
                progress >= 100
                  ? '#d32f2f'
                  : progress >= 90
                    ? '#f59e0b'
                    : '#2e7d32',
              borderRadius: 4
            }}
          />

        </div>

      )}

    </div>
  )
}


function Section({
  title,
  subtitle,
  children
}) {

  return (

    <div
      style={cardStyle}
    >

      <h2
        style={{
          marginTop: 0
        }}
      >
        {title}
      </h2>

      {subtitle && (

        <p
          style={{
            color: '#666'
          }}
        >
          {subtitle}
        </p>

      )}

      {children}

    </div>
  )
}


function Table({
  children
}) {

  return (

    <div
      style={{
        overflowX: 'auto'
      }}
    >

      <table
        style={{
          width: '100%',
          borderCollapse:
            'collapse'
        }}
      >

        {children}

      </table>

    </div>
  )
}


function SummaryLine({
  label,
  value,
  bold
}) {

  return (

    <div
      style={{
        display: 'flex',
        justifyContent:
          'space-between',
        padding: '12px 0',
        borderBottom:
          '1px solid #eee',
        fontWeight:
          bold
            ? 'bold'
            : 'normal'
      }}
    >

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  )
}


function VarianceCell({
  value,
  fullNumeric = false
}) {

  return (

    <td
      style={{
        ...tdStyle,
        fontWeight: 'bold',
        color:
          value >= 0
            ? '#2e7d32'
            : '#d32f2f'
      }}
    >

      {formatStaticCurrency(
        Math.abs(value),
        fullNumeric
      )}

      <br />

      <span
        style={{
          fontSize: 12
        }}
      >
        {value >= 0
          ? 'Headroom'
          : 'Over Budget'}
      </span>

    </td>
  )
}


function formatStaticCurrency(
  value,
  fullNumeric = false
) {

  const amount =
    Number(value || 0)

  if (fullNumeric) {

    return `SEK ${amount.toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    )}`
  }

  if (
    Math.abs(amount) >=
    1000000
  ) {

    return `SEK ${(amount / 1000000).toFixed(2)}M`
  }

  if (
    Math.abs(amount) >=
    1000
  ) {

    return `SEK ${(amount / 1000).toFixed(1)}K`
  }

  return `SEK ${amount.toFixed(0)}`
}


/* =========================================================
   STYLES
========================================================= */

const pageStyle = {
  padding: 24,
  fontFamily:
    'Arial, sans-serif',
  background:
    '#f5f7fa',
  minHeight:
    '100vh'
}

const cardStyle = {
  background: '#fff',
  padding: 20,
  borderRadius: 10,
  marginBottom: 20,
  boxShadow:
    '0 1px 4px rgba(0,0,0,0.08)'
}

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(4,1fr)',
  gap: 15
}

const inputStyle = {
  width: '100%',
  padding: 8,
  marginTop: 5
}

const kpiGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(6,1fr)',
  gap: 15,
  marginBottom: 20
}

const kpiCardStyle = {
  background: '#fff',
  padding: 18,
  borderRadius: 10,
  minHeight: 110,
  boxShadow:
    '0 1px 4px rgba(0,0,0,0.08)'
}

const kpiTitleStyle = {
  color: '#666',
  fontSize: 13,
  marginBottom: 10
}

const kpiValueStyle = {
  fontSize: 22,
  fontWeight: 'bold'
}

const kpiSubStyle = {
  marginTop: 6,
  fontSize: 12,
  color: '#666'
}

const headRowStyle = {
  background: '#f3f4f6'
}

const thStyle = {
  padding: 12,
  borderBottom:
    '1px solid #ddd',
  textAlign: 'left',
  fontSize: 13
}

const tdStyle = {
  padding: 12,
  borderBottom:
    '1px solid #eee',
  fontSize: 13
}
