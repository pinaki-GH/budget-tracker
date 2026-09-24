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


/* =========================================================
   CONSTANTS
========================================================= */

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

  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}


function isWeekday(date) {

  const day = date.getDay()

  return day !== 0 && day !== 6
}


function getQuarterStart(year, quarter) {

  const month = QUARTER_MONTHS[quarter][0]

  return new Date(
    Number(year),
    month,
    1
  )
}


function getQuarterEnd(year, quarter) {

  const month = QUARTER_MONTHS[quarter][2]

  return new Date(
    Number(year),
    month + 1,
    0
  )
}


function getWorkDaysInPeriod(
  startDate,
  endDate
) {

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


function getWorkDaysInQuarter(
  year,
  quarter
) {

  return getWorkDaysInPeriod(
    getQuarterStart(year, quarter),
    getQuarterEnd(year, quarter)
  )
}


/* =========================================================
   LEAVE DATA
========================================================= */

const LEAVE_DATA_STORAGE_KEY =
  'budgetTracker:leaveData'


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


function getDateKey(date) {

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}


/* =========================================================
   ASSIGNMENT / LEAVE AVAILABILITY
========================================================= */

function calculateAvailability(
  records,
  member,
  year,
  quarter,
  projectStartDate,
  projectLastWorkingDay
) {

  let periodStart =
    getQuarterStart(
      year,
      quarter
    )

  let periodEnd =
    getQuarterEnd(
      year,
      quarter
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
    assignmentStart > periodStart
  ) {

    periodStart =
      assignmentStart
  }


  if (
    assignmentEnd &&
    assignmentEnd < periodEnd
  ) {

    periodEnd =
      assignmentEnd
  }


  if (
    periodStart > periodEnd
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
      periodStart,
      periodEnd
    )


  if (
    !member ||
    !records ||
    records.length === 0
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
      (record) =>
        record['Member Name'] === member &&
        record.Status === 'Confirmed'
    )
    .forEach((record) => {

      const start =
        parseDate(
          record['Start Date']
        )

      const end =
        parseDate(
          record['End Date']
        )

      if (
        !start ||
        !end
      ) {
        return
      }


      const effectiveStart =
        start > periodStart
          ? start
          : periodStart

      const effectiveEnd =
        end < periodEnd
          ? end
          : periodEnd


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

        if (
          isWeekday(current)
        ) {

          const key =
            getDateKey(current)

          if (
            record['Leave Type'] ===
            'Company Holiday'
          ) {

            companyHolidayDates.add(
              key
            )

          } else if (
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
/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ExecutiveSummary() {

  const currentDate =
    new Date()

  const currentYear =
    currentDate.getFullYear().toString()

  const currentMonth =
    currentDate.getMonth()

  let currentQuarter = 'Q1'

  if (currentMonth <= 2) {
    currentQuarter = 'Q1'
  } else if (currentMonth <= 5) {
    currentQuarter = 'Q2'
  } else if (currentMonth <= 8) {
    currentQuarter = 'Q3'
  } else {
    currentQuarter = 'Q4'
  }


  /* =======================================================
     DATA
  ======================================================= */

  const [budgets, setBudgets] =
    useState([])

  const [expenses, setExpenses] =
    useState([])

  const [projections, setProjections] =
    useState([])

  const [serviceProjections, setServiceProjections] =
    useState([])

  const [forexRates, setForexRates] =
    useState([])

  const [resources, setResources] =
    useState([])

  const [leaveData, setLeaveData] =
    useState([])


  /* =======================================================
     FILTERS
  ======================================================= */

  const [yearFilter, setYearFilter] =
    useState(currentYear)

  const [quarterFilter, setQuarterFilter] =
    useState('All Quarters')

  const [projectFilter, setProjectFilter] =
    useState('All Projects')

  const [purposeFilter, setPurposeFilter] =
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

    const numericAmount =
      Number(amount || 0)

    if (
      !currency ||
      currency === 'SEK'
    ) {

      return numericAmount
    }


    const rate =
      forexRates.find(
        (r) =>
          r.currency === currency
      )


    return rate
      ? numericAmount *
        Number(rate.rate || 0)
      : numericAmount
  }


  /* =======================================================
     AVAILABLE FILTER VALUES
  ======================================================= */

  const availableYears =
    useMemo(() => {

      const values =
        new Set()

      budgets.forEach(
        (b) => values.add(b.year)
      )

      expenses.forEach(
        (e) => values.add(e.year)
      )

      projections.forEach(
        (p) => values.add(p.year)
      )

      serviceProjections.forEach(
        (p) => values.add(p.year)
      )

      values.add(currentYear)

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

      budgets.forEach(
        (b) => {

          if (
            String(b.year) ===
            String(yearFilter)
          ) {

            if (b.project) {
              values.add(b.project)
            }
          }
        }
      )


      expenses.forEach(
        (e) => {

          if (
            String(e.year) ===
            String(yearFilter)
          ) {

            if (e.project) {
              values.add(e.project)
            }
          }
        }
      )


      projections.forEach(
        (p) => {

          if (
            String(p.year) ===
            String(yearFilter)
          ) {

            if (p.project) {
              values.add(p.project)
            }
          }
        }
      )


      serviceProjections.forEach(
        (p) => {

          if (
            String(p.year) ===
            String(yearFilter)
          ) {

            if (p.project) {
              values.add(p.project)
            }
          }
        }
      )


      return Array.from(values)
        .filter(Boolean)
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

      budgets.forEach(
        (b) => {

          if (
            String(b.year) ===
            String(yearFilter)
          ) {

            if (b.purpose) {
              values.add(b.purpose)
            }
          }
        }
      )


      expenses.forEach(
        (e) => {

          if (
            String(e.year) ===
            String(yearFilter)
          ) {

            if (e.purpose) {
              values.add(e.purpose)
            }
          }
        }
      )


      projections.forEach(
        (p) => {

          if (
            String(p.year) ===
            String(yearFilter)
          ) {

            if (p.purpose) {
              values.add(p.purpose)
            }
          }
        }
      )


      serviceProjections.forEach(
        (p) => {

          if (
            String(p.year) ===
            String(yearFilter)
          ) {

            if (p.purpose) {
              values.add(p.purpose)
            }
          }
        }
      )


      return Array.from(values)
        .filter(Boolean)
        .sort()

    }, [
      budgets,
      expenses,
      projections,
      serviceProjections,
      yearFilter
    ])


  /* =======================================================
     FILTER MATCH HELPER
  ======================================================= */

  function matchesCommonFilters(
    item
  ) {

    if (
      String(item.year) !==
      String(yearFilter)
    ) {
      return false
    }


    if (
      quarterFilter !==
      'All Quarters' &&
      item.quarter !==
      quarterFilter
    ) {
      return false
    }


    if (
      projectFilter !==
      'All Projects' &&
      item.project !==
      projectFilter
    ) {
      return false
    }


    if (
      purposeFilter !==
      'All Purposes' &&
      item.purpose !==
      purposeFilter
    ) {
      return false
    }


    return true
  }
    /* =======================================================
     FILTERED DATA
  ======================================================= */

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
     BUDGET
  ======================================================= */

  const totalBudgetSEK =
    filteredBudgets.reduce(
      (sum, item) => {

        return (
          sum +
          convertToSEK(
            item.budget ??
            item.total_budget ??
            0,
            item.currency
          )
        )

      },
      0
    )


  /* =======================================================
     ACTUAL CONSUMPTION
  ======================================================= */

  const totalActualSEK =
    filteredExpenses.reduce(
      (sum, item) => {

        return (
          sum +
          convertToSEK(
            item.amount,
            item.currency
          )
        )

      },
      0
    )


  /* =======================================================
     STAFF PROJECTION
  ======================================================= */

  const calculateStaffProjection =
    (item) => {

      const resource =
        resources.find(
          (r) =>
            r.resourceName ===
            item.resource
        )


      const leaveTrackerMember =
        resource?.leaveTrackerMember ||
        item.leaveTrackerMember ||
        ''


      const projectStartDate =
        resource?.projectStartDate ||
        item.projectStartDate ||
        ''


      const projectLastWorkingDay =
        resource?.projectLastWorkingDay ||
        item.projectLastWorkingDay ||
        ''


      const availability =
        calculateAvailability(
          leaveData,
          leaveTrackerMember,
          item.year,
          item.quarter,
          projectStartDate,
          projectLastWorkingDay
        )


      const availableDays =
        availability.availableDays


      const hoursPerDay =
        Number(
          item.hoursPerDay || 0
        )


      const manHourRate =
        Number(
          item.manHourRate || 0
        )


      const fteFactor =
        Number(
          item.fteFactor || 0
        )


      const projectedBudget =
        availableDays *
        hoursPerDay *
        manHourRate *
        fteFactor


      return convertToSEK(
        projectedBudget,
        item.currency
      )
    }


  const totalStaffProjectionSEK =
    filteredStaffProjections.reduce(
      (sum, item) =>
        sum +
        calculateStaffProjection(
          item
        ),
      0
    )


  /* =======================================================
     SERVICE PROJECTION
  ======================================================= */

  const totalServiceProjectionSEK =
    filteredServiceProjections.reduce(
      (sum, item) => {

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


  const totalProjectionSEK =
    totalStaffProjectionSEK +
    totalServiceProjectionSEK


  /* =======================================================
     FORECAST / EAC
  ======================================================= */

  /*
     EAC =
     Actual Consumption +
     Remaining Projection

     Because the Projection Planning records
     represent the planned quarter spend, we
     subtract actual consumption from the
     projection only when the projection is
     greater than actual consumption.

     This avoids adding the same consumed amount
     twice.
  */

  const remainingProjectionSEK =
    Math.max(
      0,
      totalProjectionSEK -
      totalActualSEK
    )


  const forecastEACSEK =
    totalActualSEK +
    remainingProjectionSEK


  /* =======================================================
     VARIANCE
  ======================================================= */

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


  /* =======================================================
     HEADROOM
  ======================================================= */

  const forecastHeadroomSEK =
    Math.max(
      0,
      totalBudgetSEK -
      forecastEACSEK
    )


  const forecastOverrunSEK =
    Math.max(
      0,
      forecastEACSEK -
      totalBudgetSEK
    )


  /* =======================================================
     PURPOSE SUMMARY
  ======================================================= */

  const purposeSummary =
    useMemo(() => {

      const map = {}


      filteredBudgets.forEach(
        (item) => {

          const key =
            item.purpose ||
            'Unspecified'


          if (!map[key]) {

            map[key] = {
              purpose: key,
              budget: 0,
              actual: 0,
              projection: 0
            }
          }


          map[key].budget +=
            convertToSEK(
              item.budget ??
              item.total_budget ??
              0,
              item.currency
            )
        }
      )


      filteredExpenses.forEach(
        (item) => {

          const key =
            item.purpose ||
            'Unspecified'


          if (!map[key]) {

            map[key] = {
              purpose: key,
              budget: 0,
              actual: 0,
              projection: 0
            }
          }


          map[key].actual +=
            convertToSEK(
              item.amount,
              item.currency
            )
        }
      )


      filteredStaffProjections.forEach(
        (item) => {

          const key =
            item.purpose ||
            'Unspecified'


          if (!map[key]) {

            map[key] = {
              purpose: key,
              budget: 0,
              actual: 0,
              projection: 0
            }
          }


          map[key].projection +=
            calculateStaffProjection(
              item
            )
        }
      )


      filteredServiceProjections.forEach(
        (item) => {

          const key =
            item.purpose ||
            'Unspecified'


          if (!map[key]) {

            map[key] = {
              purpose: key,
              budget: 0,
              actual: 0,
              projection: 0
            }
          }


          map[key].projection +=
            convertToSEK(
              item.projectedBudget,
              item.currency
            )
        }
      )


      return Object.values(map)
        .map((row) => ({

          ...row,

          variance:
            row.budget -
            row.projection,

          actualUtilization:
            row.budget > 0
              ? (
                  row.actual /
                  row.budget
                ) * 100
              : 0

        }))
        .sort(
          (a, b) =>
            b.projection -
            a.projection
        )

    }, [
      filteredBudgets,
      filteredExpenses,
      filteredStaffProjections,
      filteredServiceProjections,
      resources,
      leaveData,
      forexRates
    ])
    /* =======================================================
     QUARTERLY SUMMARY
  ======================================================= */

  const quarterlySummary =
    QUARTERS.map(
      (quarter) => {

        const quarterBudgets =
          budgets.filter(
            (item) =>
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


        const quarterExpenses =
          expenses.filter(
            (item) =>
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


        const quarterStaff =
          projections.filter(
            (item) =>
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


        const quarterService =
          serviceProjections.filter(
            (item) =>
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


        const budget =
          quarterBudgets.reduce(
            (sum, item) =>
              sum +
              convertToSEK(
                item.budget ??
                item.total_budget ??
                0,
                item.currency
              ),
            0
          )


        const actual =
          quarterExpenses.reduce(
            (sum, item) =>
              sum +
              convertToSEK(
                item.amount,
                item.currency
              ),
            0
          )


        const staffProjection =
          quarterStaff.reduce(
            (sum, item) =>
              sum +
              calculateStaffProjection(
                item
              ),
            0
          )


        const serviceProjection =
          quarterService.reduce(
            (sum, item) =>
              sum +
              convertToSEK(
                item.projectedBudget,
                item.currency
              ),
            0
          )


        const projection =
          staffProjection +
          serviceProjection


        const eac =
          actual +
          Math.max(
            0,
            projection - actual
          )


        return {
          quarter,
          budget,
          actual,
          projection,
          eac,
          variance:
            budget - eac
        }
      }
    )


  /* =======================================================
     PROJECT SUMMARY
  ======================================================= */

  const projectSummary =
    useMemo(() => {

      const map = {}


      const ensureProject =
        (project) => {

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
        (item) => {

          ensureProject(
            item.project
          ).budget +=
            convertToSEK(
              item.budget ??
              item.total_budget ??
              0,
              item.currency
            )
        }
      )


      filteredExpenses.forEach(
        (item) => {

          ensureProject(
            item.project
          ).actual +=
            convertToSEK(
              item.amount,
              item.currency
            )
        }
      )


      filteredStaffProjections.forEach(
        (item) => {

          ensureProject(
            item.project
          ).projection +=
            calculateStaffProjection(
              item
            )
        }
      )


      filteredServiceProjections.forEach(
        (item) => {

          ensureProject(
            item.project
          ).projection +=
            convertToSEK(
              item.projectedBudget,
              item.currency
            )
        }
      )


      return Object.values(map)
        .map((row) => {

          const eac =
            row.actual +
            Math.max(
              0,
              row.projection -
              row.actual
            )


          return {
            ...row,
            eac,
            variance:
              row.budget - eac,
            utilization:
              row.budget > 0
                ? (
                    row.actual /
                    row.budget
                  ) * 100
                : 0
          }

        })
        .sort(
          (a, b) =>
            b.eac - a.eac
        )

    }, [
      filteredBudgets,
      filteredExpenses,
      filteredStaffProjections,
      filteredServiceProjections,
      resources,
      leaveData,
      forexRates
    ])
    /* =======================================================
     EXECUTIVE ATTENTION
  ======================================================= */

  const attentionItems =
    useMemo(() => {

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
            )} above the available budget.`
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
            )}% of the budget has already been consumed.`
        })
      }


      projectSummary
        .filter(
          (item) =>
            item.budget > 0 &&
            item.eac >
              item.budget
        )
        .slice(0, 3)
        .forEach(
          (item) => {

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
        items.length === 0
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

    }, [
      forecastOverrunSEK,
      forecastHeadroomSEK,
      actualUtilizationPercent,
      projectSummary,
      totalBudgetSEK
    ])


  /* =======================================================
     FORMATTING
  ======================================================= */

  function formatCurrency(
    value
  ) {

    const amount =
      Number(value || 0)


    if (
      Math.abs(amount) >=
      1000000
    ) {

      return (
        'SEK ' +
        (
          amount /
          1000000
        ).toFixed(2) +
        'M'
      )
    }


    if (
      Math.abs(amount) >=
      1000
    ) {

      return (
        'SEK ' +
        (
          amount /
          1000
        ).toFixed(1) +
        'K'
      )
    }


    return (
      'SEK ' +
      amount.toFixed(0)
    )
  }


  function formatPercent(
    value
  ) {

    return (
      Number(value || 0)
        .toFixed(1) +
      '%'
    )
  }


  function getVarianceLabel(
    value
  ) {

    if (value > 0) {
      return 'Headroom'
    }

    if (value < 0) {
      return 'Over Budget'
    }

    return 'On Budget'
  }


  function getVarianceClass(
    value
  ) {

    if (value > 0) {
      return 'positive'
    }

    if (value < 0) {
      return 'negative'
    }

    return 'neutral'
  }


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

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
    return (

    <div
      style={{
        padding: 24,
        fontFamily: 'Arial, sans-serif',
        background: '#f5f7fa',
        minHeight: '100vh'
      }}
    >

      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        style={{
          background: '#ffffff',
          padding: 24,
          borderRadius: 10,
          marginBottom: 20,
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.08)'
        }}
      >

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
          Business Sponsor View — Budget,
          Actual Consumption & Forecast
        </p>

      </div>


      {/* ==================================================
          NAVIGATION
      ================================================== */}

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


      {/* ==================================================
          FILTERS
      ================================================== */}

      <div
        style={{
          background: '#ffffff',
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.08)'
        }}
      >

        <h2
          style={{
            marginTop: 0
          }}
        >
          Filters
        </h2>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(4, 1fr)',
            gap: 15
          }}
        >

          <div>

            <label>
              <strong>
                Year
              </strong>
            </label>

            <br />

            <select
              value={yearFilter}
              onChange={(e) =>
                setYearFilter(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                padding: 8,
                marginTop: 5
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

            <label>
              <strong>
                Quarter
              </strong>
            </label>

            <br />

            <select
              value={quarterFilter}
              onChange={(e) =>
                setQuarterFilter(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                padding: 8,
                marginTop: 5
              }}
            >

              <option>
                All Quarters
              </option>

              {QUARTERS.map(
                (quarter) => (

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

            <br />

            <select
              value={projectFilter}
              onChange={(e) =>
                setProjectFilter(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                padding: 8,
                marginTop: 5
              }}
            >

              <option>
                All Projects
              </option>

              {availableProjects.map(
                (project) => (

                  <option
                    key={project}
                    value={project}
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

            <br />

            <select
              value={purposeFilter}
              onChange={(e) =>
                setPurposeFilter(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                padding: 8,
                marginTop: 5
              }}
            >

              <option>
                All Purposes
              </option>

              {availablePurposes.map(
                (purpose) => (

                  <option
                    key={purpose}
                    value={purpose}
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


      {/* ==================================================
          KPI CARDS
      ================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(6, 1fr)',
          gap: 15,
          marginBottom: 20
        }}
      >

        <div className="kpiCard">

          <div className="kpiTitle">
            Total Budget
          </div>

          <div className="kpiValue">
            {formatCurrency(
              totalBudgetSEK
            )}
          </div>

        </div>


        <div className="kpiCard">

          <div className="kpiTitle">
            Actual Consumption
          </div>

          <div className="kpiValue">
            {formatCurrency(
              totalActualSEK
            )}
          </div>

          <div className="kpiSub">
            {formatPercent(
              actualUtilizationPercent
            )}{' '}
            utilized
          </div>

        </div>


        <div className="kpiCard">

          <div className="kpiTitle">
            Projected Consumption
          </div>

          <div className="kpiValue">
            {formatCurrency(
              totalProjectionSEK
            )}
          </div>

        </div>


        <div className="kpiCard">

          <div className="kpiTitle">
            Forecast / EAC
          </div>

          <div className="kpiValue">
            {formatCurrency(
              forecastEACSEK
            )}
          </div>

          <div className="kpiSub">
            {formatPercent(
              forecastUtilizationPercent
            )}{' '}
            of budget
          </div>

        </div>


        <div
          className={`kpiCard ${
            forecastVarianceSEK >= 0
              ? 'positiveCard'
              : 'negativeCard'
          }`}
        >

          <div className="kpiTitle">
            Forecast Variance
          </div>

          <div className="kpiValue">
            {formatCurrency(
              Math.abs(
                forecastVarianceSEK
              )
            )}
          </div>

          <div className="kpiSub">
            {getVarianceLabel(
              forecastVarianceSEK
            )}
          </div>

        </div>


        <div className="kpiCard">

          <div className="kpiTitle">
            Budget Utilization
          </div>

          <div className="kpiValue">
            {formatPercent(
              actualUtilizationPercent
            )}
          </div>

          <div
            style={{
              marginTop: 10,
              background: '#e5e7eb',
              height: 8,
              borderRadius: 4
            }}
          >

            <div
              style={{
                width:
                  `${Math.min(
                    actualUtilizationPercent,
                    100
                  )}%`,
                height: '100%',
                background:
                  actualUtilizationPercent >=
                  100
                    ? '#d32f2f'
                    : actualUtilizationPercent >=
                      90
                      ? '#f59e0b'
                      : '#2e7d32',
                borderRadius: 4
              }}
            />

          </div>

        </div>

      </div>
      {/* ==================================================
          QUARTERLY FINANCIAL POSITION
      ================================================== */}

      <div
        style={{
          background: '#ffffff',
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.08)'
        }}
      >

        <h2
          style={{
            marginTop: 0
          }}
        >
          Budget vs Actual vs Projection
        </h2>

        <p
          style={{
            color: '#666'
          }}
        >
          Quarterly financial position for{' '}
          {yearFilter}.
        </p>


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

            <thead>

              <tr
                style={{
                  background:
                    '#f3f4f6'
                }}
              >

                <th style={thStyle}>
                  Quarter
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
                  Utilization
                </th>

              </tr>

            </thead>


            <tbody>

              {quarterlySummary.map(
                (row) => (

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
                        row.budget
                      )}
                    </td>

                    <td style={tdStyle}>
                      {formatCurrency(
                        row.actual
                      )}
                    </td>

                    <td style={tdStyle}>
                      {formatCurrency(
                        row.projection
                      )}
                    </td>

                    <td style={tdStyle}>
                      {formatCurrency(
                        row.eac
                      )}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 'bold',
                        color:
                          row.variance >= 0
                            ? '#2e7d32'
                            : '#d32f2f'
                      }}
                    >
                      {formatCurrency(
                        Math.abs(
                          row.variance
                        )
                      )}

                      <br />

                      <span
                        style={{
                          fontSize: 12
                        }}
                      >
                        {row.variance >=
                        0
                          ? 'Headroom'
                          : 'Over Budget'}
                      </span>
                    </td>

                    <td style={tdStyle}>

                      {formatPercent(
                        row.budget > 0
                          ? (
                              row.actual /
                              row.budget
                            ) * 100
                          : 0
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
                  fontWeight: 'bold'
                }}
              >

                <td style={tdStyle}>
                  Total
                </td>

                <td style={tdStyle}>
                  {formatCurrency(
                    quarterlySummary.reduce(
                      (sum, row) =>
                        sum +
                        row.budget,
                      0
                    )
                  )}
                </td>

                <td style={tdStyle}>
                  {formatCurrency(
                    quarterlySummary.reduce(
                      (sum, row) =>
                        sum +
                        row.actual,
                      0
                    )
                  )}
                </td>

                <td style={tdStyle}>
                  {formatCurrency(
                    quarterlySummary.reduce(
                      (sum, row) =>
                        sum +
                        row.projection,
                      0
                    )
                  )}
                </td>

                <td style={tdStyle}>
                  {formatCurrency(
                    quarterlySummary.reduce(
                      (sum, row) =>
                        sum +
                        row.eac,
                      0
                    )
                  )}
                </td>

                <td style={tdStyle}>
                  {formatCurrency(
                    Math.abs(
                      quarterlySummary.reduce(
                        (sum, row) =>
                          sum +
                          row.variance,
                        0
                      )
                    )
                  )}
                </td>

                <td style={tdStyle}>
                  {formatPercent(
                    actualUtilizationPercent
                  )}
                </td>

              </tr>

            </tfoot>

          </table>

        </div>

      </div>


      {/* ==================================================
          FORECAST POSITION
      ================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 1fr',
          gap: 20,
          marginBottom: 20
        }}
      >

        <div
          style={{
            background: '#ffffff',
            padding: 20,
            borderRadius: 10,
            boxShadow:
              '0 1px 4px rgba(0,0,0,0.08)'
          }}
        >

          <h2
            style={{
              marginTop: 0
            }}
          >
            Forecast Position
          </h2>

          <div
            style={{
              fontSize: 30,
              fontWeight: 'bold',
              marginBottom: 8
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


          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              marginBottom: 8
            }}
          >

            <span>
              Budget
            </span>

            <strong>
              {formatCurrency(
                totalBudgetSEK
              )}
            </strong>

          </div>


          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              marginBottom: 8
            }}
          >

            <span>
              Forecast
            </span>

            <strong>
              {formatCurrency(
                forecastEACSEK
              )}
            </strong>

          </div>


          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              borderTop:
                '1px solid #ddd',
              paddingTop: 10
            }}
          >

            <span>
              {forecastVarianceSEK >= 0
                ? 'Forecast Headroom'
                : 'Forecast Overrun'}
            </span>

            <strong
              style={{
                color:
                  forecastVarianceSEK >= 0
                    ? '#2e7d32'
                    : '#d32f2f'
              }}
            >
              {formatCurrency(
                forecastVarianceSEK >= 0
                  ? forecastHeadroomSEK
                  : forecastOverrunSEK
              )}
            </strong>

          </div>

        </div>


        <div
          style={{
            background: '#ffffff',
            padding: 20,
            borderRadius: 10,
            boxShadow:
              '0 1px 4px rgba(0,0,0,0.08)'
          }}
        >

          <h2
            style={{
              marginTop: 0
            }}
          >
            Projection Composition
          </h2>


          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              padding: '12px 0',
              borderBottom:
                '1px solid #eee'
            }}
          >

            <span>
              Staff Cost
            </span>

            <strong>
              {formatCurrency(
                totalStaffProjectionSEK
              )}
            </strong>

          </div>


          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              padding: '12px 0',
              borderBottom:
                '1px solid #eee'
            }}
          >

            <span>
              Service Cost
            </span>

            <strong>
              {formatCurrency(
                totalServiceProjectionSEK
              )}
            </strong>

          </div>


          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              padding: '12px 0',
              fontWeight: 'bold'
            }}
          >

            <span>
              Total Projection
            </span>

            <strong>
              {formatCurrency(
                totalProjectionSEK
              )}
            </strong>

          </div>

        </div>

      </div>
      {/* ==================================================
          PURPOSE SUMMARY
      ================================================== */}

      <div
        style={{
          background: '#ffffff',
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.08)'
        }}
      >

        <h2
          style={{
            marginTop: 0
          }}
        >
          Spend by Purpose
        </h2>


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

            <thead>

              <tr
                style={{
                  background:
                    '#f3f4f6'
                }}
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
                  (row) => {

                    const eac =
                      row.actual +
                      Math.max(
                        0,
                        row.projection -
                        row.actual
                      )

                    const variance =
                      row.budget -
                      eac

                    return (

                      <tr
                        key={
                          row.purpose
                        }
                      >

                        <td style={tdStyle}>
                          <strong>
                            {row.purpose}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          {formatCurrency(
                            row.budget
                          )}
                        </td>

                        <td style={tdStyle}>
                          {formatCurrency(
                            row.actual
                          )}
                        </td>

                        <td style={tdStyle}>
                          {formatCurrency(
                            row.projection
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color:
                              variance >=
                              0
                                ? '#2e7d32'
                                : '#d32f2f',
                            fontWeight:
                              'bold'
                          }}
                        >

                          {formatCurrency(
                            Math.abs(
                              variance
                            )
                          )}

                          <br />

                          <span
                            style={{
                              fontSize: 12
                            }}
                          >
                            {variance >=
                            0
                              ? 'Headroom'
                              : 'Over Budget'}
                          </span>

                        </td>

                        <td style={tdStyle}>

                          {formatPercent(
                            row.actualUtilization
                          )}

                        </td>

                      </tr>

                    )
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ==================================================
          PROJECT FINANCIAL POSITION
      ================================================== */}

      <div
        style={{
          background: '#ffffff',
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.08)'
        }}
      >

        <h2
          style={{
            marginTop: 0
          }}
        >
          Project Financial Position
        </h2>


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

            <thead>

              <tr
                style={{
                  background:
                    '#f3f4f6'
                }}
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
                  (row) => (

                    <tr
                      key={
                        row.project
                      }
                    >

                      <td style={tdStyle}>
                        <strong>
                          {row.project}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {formatCurrency(
                          row.budget
                        )}
                      </td>

                      <td style={tdStyle}>
                        {formatCurrency(
                          row.actual
                        )}
                      </td>

                      <td style={tdStyle}>
                        {formatCurrency(
                          row.projection
                        )}
                      </td>

                      <td style={tdStyle}>
                        {formatCurrency(
                          row.eac
                        )}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          color:
                            row.variance >=
                            0
                              ? '#2e7d32'
                              : '#d32f2f',
                          fontWeight:
                            'bold'
                        }}
                      >

                        {formatCurrency(
                          Math.abs(
                            row.variance
                          )
                        )}

                        <br />

                        <span
                          style={{
                            fontSize: 12
                          }}
                        >
                          {row.variance >=
                          0
                            ? 'Headroom'
                            : 'Over Budget'}
                        </span>

                      </td>

                      <td style={tdStyle}>

                        {formatPercent(
                          row.utilization
                        )}

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>
      {/* ==================================================
          ATTENTION REQUIRED
      ================================================== */}

      <div
        style={{
          background: '#ffffff',
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.08)'
        }}
      >

        <h2
          style={{
            marginTop: 0
          }}
        >
          Attention Required
        </h2>


        <div
          style={{
            display: 'grid',
            gap: 12
          }}
        >

          {attentionItems.map(
            (item, index) => {

              let background =
                '#f8fafc'

              let border =
                '#cbd5e1'

              if (
                item.type ===
                'warning'
              ) {

                background =
                  '#fff7ed'

                border =
                  '#fdba74'
              }

              if (
                item.type ===
                'positive'
              ) {

                background =
                  '#f0fdf4'

                border =
                  '#86efac'
              }


              return (

                <div
                  key={index}
                  style={{
                    padding: 15,
                    background,
                    border:
                      `1px solid ${border}`,
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
            }
          )}

        </div>

      </div>


      {/* ==================================================
          DATA BASIS
      ================================================== */}

      <div
        style={{
          background: '#ffffff',
          padding: 15,
          borderRadius: 10,
          color: '#666',
          fontSize: 13
        }}
      >

        <strong>
          Executive Summary methodology:
        </strong>

        <span
          style={{
            marginLeft: 6
          }}
        >
          Budget is sourced from Project
          Budgets, Actual Consumption from
          Expense Tracking, and Projection
          from Staff and Service Projection
          Planning. All financial values are
          normalized to SEK using the
          configured Forex Rates.
        </span>

      </div>


      {/* ==================================================
          INLINE STYLES
      ================================================== */}

      <style jsx>{`

        .kpiCard {
          background: #ffffff;
          padding: 18px;
          border-radius: 10px;
          min-height: 110px;
          box-shadow:
            0 1px 4px rgba(0,0,0,0.08);
        }

        .positiveCard {
          border-left:
            5px solid #2e7d32;
        }

        .negativeCard {
          border-left:
            5px solid #d32f2f;
        }

        .kpiTitle {
          color: #666666;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .kpiValue {
          font-size: 22px;
          font-weight: bold;
        }

        .kpiSub {
          margin-top: 6px;
          font-size: 12px;
          color: #666666;
        }

        @media (max-width: 1200px) {

          .kpiCard {
            min-width: 180px;
          }

        }

      `}</style>

    </div>
  )
}


/* =========================================================
   TABLE STYLES
========================================================= */

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
