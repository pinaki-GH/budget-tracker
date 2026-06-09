'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  getBudgets,
  getExpenses,
  getForexRates
} from '../lib/storage'

export default function Home() {

  // Current Date
  const currentDate = new Date()

  // Current Year
  const currentYear = currentDate.getFullYear().toString()

  // Current Quarter
  const currentMonth = currentDate.getMonth() + 1

  let currentQuarter = 'Q1'

  if (currentMonth >= 1 && currentMonth <= 3) {
    currentQuarter = 'Q1'
  } else if (currentMonth >= 4 && currentMonth <= 6) {
    currentQuarter = 'Q2'
  } else if (currentMonth >= 7 && currentMonth <= 9) {
    currentQuarter = 'Q3'
  } else {
    currentQuarter = 'Q4'
  }

  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [forexRates, setForexRates] = useState([])

  // Multi-select filters
  const [yearFilter, setYearFilter] = useState([currentYear])
  const [quarterFilter, setQuarterFilter] = useState([])
  const [monthFilter, setMonthFilter] = useState('')

  // Project Filter
  const [projectFilter, setProjectFilter] =
    useState('All Projects')

  const [purposeFilter, setPurposeFilter] = useState('')

  const quarterMonths = {
  Q1: [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' }
  ],
  Q2: [
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' }
  ],
  Q3: [
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' }
  ],
  Q4: [
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]
}

const allMonths = [
  ...quarterMonths.Q1,
  ...quarterMonths.Q2,
  ...quarterMonths.Q3,
  ...quarterMonths.Q4
]

const availableMonths =
  quarterFilter.length === 0
    ? allMonths
    : quarterFilter.length === 1
      ? quarterMonths[quarterFilter[0]]
      : allMonths

  useEffect(() => {
    loadData()
  }, [])

  
  function loadData() {
    setBudgets(getBudgets())
    setExpenses(getExpenses())
    setForexRates(getForexRates())
  }

  // Convert currency to SEK using saved forex rates
  const convertToSEK = (amount, currency) => {

    const rateObj = forexRates.find(
      (r) => r.currency === currency
    )

    const rate = rateObj ? rateObj.rate : 1

    return amount * rate
  }

  // Returns YYYY-MM from expense date
  const getMonthKey = (dateString) => {

  const date = new Date(dateString)

  const year = date.getFullYear()

  const month =
    String(date.getMonth() + 1)
      .padStart(2, '0')

  return `${year}-${month}`
 }
  
  // Filter budgets
  const filteredBudgets = budgets.filter((b) => {

  let budgetMonthMatch = true

  if (monthFilter) {

    const quarterMonthMap = {
      Q1: ['01', '02', '03'],
      Q2: ['04', '05', '06'],
      Q3: ['07', '08', '09'],
      Q4: ['10', '11', '12']
    }

    budgetMonthMatch =
      quarterMonthMap[b.quarter]
        ?.includes(monthFilter)
  }

  return (
    yearFilter.includes(b.year) &&
    (
      quarterFilter.length === 0 ||
      quarterFilter.includes(b.quarter)
    ) &&
    budgetMonthMatch &&

    (projectFilter === 'All Projects' ||
      b.project === projectFilter) &&

    (!purposeFilter ||
      b.purpose.toLowerCase().includes(
        purposeFilter.toLowerCase()
      ))
  )
})

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {

  const expenseMonth =
    e.date
      ? e.date.split('-')[1]
      : ''

  return (
    yearFilter.includes(e.year) &&
    (
      quarterFilter.length === 0 ||
      quarterFilter.includes(e.quarter)
    ) &&

    (!monthFilter ||
      expenseMonth === monthFilter) &&

    (projectFilter === 'All Projects' ||
      e.project === projectFilter) &&

    (!purposeFilter ||
      e.purpose.toLowerCase().includes(
        purposeFilter.toLowerCase()
      ))
  )
})

  // Year-only filtered data
  const yearlyBudgets = budgets.filter((b) => {
  return (
    yearFilter.includes(b.year) &&

    (projectFilter === 'All Projects' ||
      b.project === projectFilter) &&

    (!purposeFilter ||
      b.purpose.toLowerCase().includes(
        purposeFilter.toLowerCase()
      ))
    )
  })

  const yearlyExpenses = expenses.filter((e) => {
  return (
    yearFilter.includes(e.year) &&

    (projectFilter === 'All Projects' ||
      e.project === projectFilter) &&

    (!purposeFilter ||
      e.purpose.toLowerCase().includes(
        purposeFilter.toLowerCase()
      ))
    )
  })

  const runwayBudgets = budgets.filter((b) => {
  return (
    yearFilter.includes(b.year) &&

    (projectFilter === 'All Projects' ||
      b.project === projectFilter)
  )
})

const runwayExpenses = expenses.filter((e) => {
  return (
    yearFilter.includes(e.year) &&

    (projectFilter === 'All Projects' ||
      e.project === projectFilter)
  )
})
  
  // Purpose Summary Table

const purposeSummaryMap = {}

// Budgets
filteredBudgets.forEach((b) => {

  const key =
    `${b.year}|${b.quarter}|${b.project}|${b.purpose}`

  if (!purposeSummaryMap[key]) {
    purposeSummaryMap[key] = {
      year: b.year,
      quarter: b.quarter,
      project: b.project,
      purpose: b.purpose,
      budget: 0,
      spend: 0
    }
  }

  purposeSummaryMap[key].budget +=
    convertToSEK(
      Number(b.total_budget || 0),
      b.currency
    )
})

// Expenses
filteredExpenses.forEach((e) => {

  const key =
    `${e.year}|${e.quarter}|${e.project}|${e.purpose}`

  if (!purposeSummaryMap[key]) {
    purposeSummaryMap[key] = {
      year: e.year,
      quarter: e.quarter,
      project: e.project,
      purpose: e.purpose,
      budget: 0,
      spend: 0
    }
  }

  purposeSummaryMap[key].spend +=
    convertToSEK(
      Number(e.amount || 0),
      e.currency
    )
})

const purposeSummary =
  Object.values(purposeSummaryMap)
    .map((row) => ({
      ...row,
      remaining:
        row.budget - row.spend
    }))
    .sort((a, b) => {

      if (a.year !== b.year) {
        return a.year.localeCompare(b.year)
      }

      if (a.quarter !== b.quarter) {
        return a.quarter.localeCompare(b.quarter)
      }

      return a.purpose.localeCompare(
        b.purpose
      )
    })

    
   // Quarter totals
  const totalBudgetSEK = filteredBudgets.reduce((sum, b) => {
    return sum + convertToSEK(
      b.total_budget,
      b.currency
    )
  }, 0)

  const totalSpendSEK = filteredExpenses.reduce((sum, e) => {
    return sum + convertToSEK(
      e.amount,
      e.currency
    )
  }, 0)

  const remainingSEK =
    totalBudgetSEK - totalSpendSEK

  // Year totals
  const runwayBudgetSEK = runwayBudgets.reduce((sum, b) => {
  return sum + convertToSEK(
    b.total_budget,
    b.currency
  )
}, 0)

  const runwaySpendSEK = runwayExpenses.reduce((sum, e) => {
  return sum + convertToSEK(
    e.amount,
    e.currency
  )
}, 0)

  const runwayRemainingSEK =
  runwayBudgetSEK - runwaySpendSEK

  const yearlyBudgetSEK = yearlyBudgets.reduce((sum, b) => {
  return sum + convertToSEK(
    b.total_budget,
    b.currency
  )
}, 0)

const yearlySpendSEK = yearlyExpenses.reduce((sum, e) => {
  return sum + convertToSEK(
    e.amount,
    e.currency
  )
}, 0)

const yearlyRemainingSEK =
  yearlyBudgetSEK - yearlySpendSEK

  
   /* =====================================
   PROJECT RUNWAY CALCULATION
===================================== */

// Last 3 calendar months
const latestExpenseDate =
  runwayExpenses.reduce((latest, expense) => {

    const expenseDate =
      new Date(expense.date)

    return expenseDate > latest
      ? expenseDate
      : latest

  }, new Date(0))
  
const monthKeys = []

for (let i = 2; i >= 0; i--) {

  const d = new Date(
  latestExpenseDate.getFullYear(),
  latestExpenseDate.getMonth() - i,
  1
  )

  const year = d.getFullYear()

  const month =
    String(d.getMonth() + 1)
      .padStart(2, '0')

  monthKeys.push(`${year}-${month}`)
}

  const runwayPeriod =
    `${monthKeys[0]} to ${monthKeys[2]}`
  
// Build purpose burn rates
const purposeBurnRates = {}

runwayExpenses.forEach((e) => {

  const purpose = e.purpose

  if (!purposeBurnRates[purpose]) {

    purposeBurnRates[purpose] = {
      purpose,
      monthlySpend: {}
    }

    monthKeys.forEach((m) => {
      purposeBurnRates[purpose]
        .monthlySpend[m] = 0
    })
  }

  const monthKey =
    getMonthKey(e.date)

  if (monthKeys.includes(monthKey)) {

    purposeBurnRates[purpose]
      .monthlySpend[monthKey] +=
      convertToSEK(
        Number(e.amount || 0),
        e.currency
      )
  }
})

// Calculate average burn per purpose
let projectBurnRate = 0

Object.values(purposeBurnRates)
  .forEach((purpose) => {

    const values =
      Object.values(
        purpose.monthlySpend
      )

    const avg =
      values.reduce(
        (sum, v) => sum + v,
        0
      ) / values.length

    projectBurnRate += avg
  })

// Project Runway
let projectRunwayMonths = null

if (projectBurnRate > 0) {

  projectRunwayMonths =
    runwayRemainingSEK /
    projectBurnRate
}
  
    // Utilization
  const quarterUtilization =
    totalBudgetSEK > 0
      ? (totalSpendSEK / totalBudgetSEK) * 100
      : 0

  const yearlyUtilization =
    yearlyBudgetSEK > 0
      ? (yearlySpendSEK / yearlyBudgetSEK) * 100
      : 0

  // Progress bar color
  const getProgressColor = (utilization) => {
    if (utilization < 95) return '#4CAF50'
    if (utilization < 100) return '#FF9800'
    return '#F44336'
  }

  // Clear Filters
  const clearFilters = () => {
  setYearFilter([currentYear])
  setQuarterFilter([])
  setMonthFilter('')
  setProjectFilter('All Projects')
  setPurposeFilter('')
}

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>

      <h1>PMO Budget Dashboard</h1>

      {/* Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/add-budget">
          <button>Budget</button>
        </Link>

        <Link href="/add-expense" style={{ marginLeft: 10 }}>
          <button>Expense</button>
        </Link>

        <Link href="/forex-rates" style={{ marginLeft: 10 }}>
          <button>Forex Rates</button>
        </Link>
      </div>

      <hr />

      {/* Filters */}
      <h2>Filters</h2>

      <div style={{ marginBottom: 20 }}>

        {/* Years */}
        <div style={{ marginBottom: 10 }}>
          <strong>Years:</strong>

          {['2025', '2026', '2027'].map((year) => (
            <label
              key={year}
              style={{ marginLeft: 10 }}
            >
              <input
                type="checkbox"
                checked={yearFilter.includes(year)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setYearFilter([
                      ...yearFilter,
                      year
                    ])
                  } else {
                    setYearFilter(
                      yearFilter.filter(
                        (y) => y !== year
                      )
                    )
                  }
                }}
              />

              {year}
            </label>
          ))}
        </div>

        {/* Quarters */}
        <div style={{ marginBottom: 10 }}>
          <strong>Quarters:</strong>

          {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
            <label
              key={quarter}
              style={{ marginLeft: 10 }}
            >
              <input
                type="checkbox"
                checked={quarterFilter.includes(
                  quarter
                )}
                onChange={(e) => {
                  if (e.target.checked) {
                    setQuarterFilter([
                      ...quarterFilter,
                      quarter
                    ])
                  } else {
                    setQuarterFilter(
                      quarterFilter.filter(
                        (q) => q !== quarter
                      )
                    )
                  }
                }}
              />

              {quarter}
            </label>
          ))}
        </div>

        {/* Month Filter */}
<div style={{ marginBottom: 10 }}>
  <strong>Month:</strong>

  <select
    value={monthFilter}
    onChange={(e) =>
      setMonthFilter(e.target.value)
    }
    style={{ marginLeft: 10 }}
  >
    <option value="">
      All Months
    </option>

    {availableMonths.map((month) => (
      <option
        key={month.value}
        value={month.value}
      >
        {month.label}
      </option>
    ))}
  </select>
</div>

        {/* Project Filter */}
        <div style={{ marginBottom: 10 }}>
          <strong>Project:</strong>

          <select
            value={projectFilter}
            onChange={(e) =>
              setProjectFilter(e.target.value)
            }
            style={{ marginLeft: 10 }}
          >
            <option>All Projects</option>

            {[
              ...new Set(
                budgets
                  .map((b) => b.project)
                  .filter(Boolean)
              )
            ].map((project) => (
              <option
                key={project}
                value={project}
              >
                {project}
              </option>
            ))}
          </select>
        </div>

        {/* Purpose */}
        <input
          placeholder="Filter by purpose"
          value={purposeFilter}
          onChange={(e) =>
            setPurposeFilter(e.target.value)
          }
          style={{
            marginTop: 10
          }}
        />

        {/* Clear Filter */}
        <button
          onClick={clearFilters}
          style={{
            marginLeft: 10
          }}
        >
          Clear Filter
        </button>
      </div>

      <hr />

      {/* KPI Cards */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          marginTop: 20,
          marginBottom: 30
        }}
      >

        {/* Total Budget */}
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 20,
            minWidth: 260,
            background: '#f9f9f9'
          }}
        >
          <h3>Total Budget (SEK)</h3>

          <p>
            <strong>Quarter:</strong><br />
            kr {totalBudgetSEK.toFixed(2)}
          </p>

          <p>
            <strong>Year:</strong><br />
            kr {yearlyBudgetSEK.toFixed(2)}
          </p>
        </div>

        {/* Total Spend */}
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 20,
            minWidth: 260,
            background: '#f9f9f9'
          }}
        >
          <h3>Total Spend (SEK)</h3>

          <p>
            <strong>Quarter:</strong><br />
            kr {totalSpendSEK.toFixed(2)}
          </p>

          <p>
            <strong>Year:</strong><br />
            kr {yearlySpendSEK.toFixed(2)}
          </p>
        </div>

        {/* Remaining */}
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 20,
            minWidth: 260,
            background: '#f9f9f9'
          }}
        >
          <h3>Remaining (SEK)</h3>

          <p>
            <strong>Quarter:</strong><br />
            kr {remainingSEK.toFixed(2)}
          </p>

          <p>
            <strong>Year:</strong><br />
            kr {yearlyRemainingSEK.toFixed(2)}
          </p>
        </div>
      
        {/* Budget Runway */}
      <div
  style={{
    border: '1px solid #ddd',
    borderRadius: 10,
    padding: 20,
    minWidth: 260,
    background: '#f9f9f9'
  }}
>

  <h3>Budget Runway</h3>

  {projectRunwayMonths === null ? (

    <p>No spend history</p>

  ) : projectRunwayMonths <= 0 ? (

    <p
      style={{
        color: 'red',
        fontWeight: 'bold'
      }}
    >
      Budget Exhausted
    </p>

  ) : (

    <>
      <p>
        <strong>
          Estimated Duration
        </strong>
      </p>

      <p
        style={{
          fontSize: 24,
          fontWeight: 'bold'
        }}
      >
        {projectRunwayMonths.toFixed(1)}
        {' '}
        Months
      </p>

      <div
  style={{
    marginTop: 20,
    fontSize: 14,
    color: '#666'
  }}
>
  <div>
    <strong>Project Burn Rate:</strong>
  </div>

  <div>
    kr {projectBurnRate.toFixed(0)} / month
  </div>

  <br />

  <div>
    <strong>Calculation Period:</strong>
  </div>

  <div>
    {runwayPeriod}
  </div>

  <br />

  <div>
    Based on rolling
    3-month spend trend
  </div>
</div>
    </>
  )}

</div>      
</div>

      {/* Quarter Utilization */}
      <h2>Quarter Utilization</h2>

      <div
        style={{
          width: '100%',
          maxWidth: 600,
          border: '1px solid #ccc',
          borderRadius: 10,
          overflow: 'hidden',
          height: 35,
          background: '#eee'
        }}
      >
        <div
          style={{
            width: `${Math.min(
              quarterUtilization,
              100
            )}%`,
            background: getProgressColor(
              quarterUtilization
            ),
            height: '100%',
            color: 'white',
            textAlign: 'center',
            lineHeight: '35px',
            fontWeight: 'bold'
          }}
        >
          {quarterUtilization.toFixed(1)}%
        </div>
      </div>

      <br />

      {/* Year Utilization */}
      <h2>Year Utilization</h2>

      <div
        style={{
          width: '100%',
          maxWidth: 600,
          border: '1px solid #ccc',
          borderRadius: 10,
          overflow: 'hidden',
          height: 35,
          background: '#eee'
        }}
      >
        <div
          style={{
            width: `${Math.min(
              yearlyUtilization,
              100
            )}%`,
            background: getProgressColor(
              yearlyUtilization
            ),
            height: '100%',
            color: 'white',
            textAlign: 'center',
            lineHeight: '35px',
            fontWeight: 'bold'
          }}
        >
          {yearlyUtilization.toFixed(1)}%
        </div>
      </div>

      <hr style={{ margin: '30px 0' }} />

      <h2>
  Budget vs Spend by Purpose
</h2>

<table
  border="1"
  cellPadding="8"
  style={{
    borderCollapse: 'collapse',
    width: '100%'
  }}
>

  <thead
    style={{
      background: '#f0f0f0'
    }}
  >
    <tr>
      <th>Year</th>
      <th>Quarter</th>
      <th>Project</th>
      <th>Purpose</th>
      <th>Budget (SEK)</th>
      <th>Spend (SEK)</th>
      <th>Remaining (SEK)</th>
    </tr>
  </thead>

  <tbody>

    {purposeSummary.map((row, index) => (

      <tr key={index}>

        <td>{row.year}</td>

        <td>{row.quarter}</td>

        <td>{row.project}</td>

        <td>{row.purpose}</td>

        <td>
          kr {row.budget.toFixed(2)}
        </td>

        <td>
          kr {row.spend.toFixed(2)}
        </td>

        <td
          style={{
            color:
              row.remaining < 0
                ? 'red'
                : 'inherit',
            fontWeight:
              row.remaining < 0
                ? 'bold'
                : 'normal'
          }}
        >
          kr {row.remaining.toFixed(2)}
        </td>

      </tr>

    ))}

  </tbody>

</table>
      
    </div>
  )
}
