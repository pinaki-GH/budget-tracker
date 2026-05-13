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
  const [quarterFilter, setQuarterFilter] = useState([currentQuarter])

  // Project Filter
  const [projectFilter, setProjectFilter] =
    useState('All Projects')

  const [purposeFilter, setPurposeFilter] = useState('')

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

  // Filter budgets
  const filteredBudgets = budgets.filter((b) => {
    return (
      yearFilter.includes(b.year) &&
      quarterFilter.includes(b.quarter) &&

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
    return (
      yearFilter.includes(e.year) &&
      quarterFilter.includes(e.quarter) &&

      (projectFilter === 'All Projects' ||
        e.project === projectFilter) &&

      (!purposeFilter ||
        e.purpose.toLowerCase().includes(
          purposeFilter.toLowerCase()
        ))
    )
  })

  // Year-only filtered data
  const yearlyBudgets = budgets.filter((b) =>
    yearFilter.includes(b.year)
  )

  const yearlyExpenses = expenses.filter((e) =>
    yearFilter.includes(e.year)
  )

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
    setQuarterFilter([currentQuarter])
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

      {/* Budgets Table */}
      <h2>Budgets</h2>

      <table
        border="1"
        cellPadding="8"
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          marginBottom: 30
        }}
      >
        <thead style={{ background: '#f0f0f0' }}>
          <tr>
            <th>Year</th>
            <th>Quarter</th>
            <th>Project</th>
            <th>Purpose</th>
            <th>Currency</th>
            <th>Original Amount</th>
            <th>SEK Equivalent</th>
          </tr>
        </thead>

        <tbody>
          {filteredBudgets.map((b) => (
            <tr key={b.id}>
              <td>{b.year}</td>
              <td>{b.quarter}</td>
              <td>{b.project}</td>
              <td>{b.purpose}</td>
              <td>{b.currency}</td>
              <td>{b.total_budget}</td>

              <td>
                kr{' '}
                {convertToSEK(
                  b.total_budget,
                  b.currency
                ).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Expenses Table */}
      <h2>Expenses</h2>

      <table
        border="1"
        cellPadding="8"
        style={{
          borderCollapse: 'collapse',
          width: '100%'
        }}
      >
        <thead style={{ background: '#f0f0f0' }}>
          <tr>
            <th>Vendor</th>
            <th>Date</th>
            <th>Year</th>
            <th>Quarter</th>
            <th>Project</th>
            <th>Purpose</th>
            <th>Currency</th>
            <th>Original Amount</th>
            <th>SEK Equivalent</th>
          </tr>
        </thead>

        <tbody>
          {filteredExpenses.map((e) => (
            <tr key={e.id}>
              <td>{e.vendor_name}</td>
              <td>{e.date}</td>
              <td>{e.year}</td>
              <td>{e.quarter}</td>
              <td>{e.project}</td>
              <td>{e.purpose}</td>
              <td>{e.currency}</td>
              <td>{e.amount}</td>

              <td>
                kr{' '}
                {convertToSEK(
                  e.amount,
                  e.currency
                ).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
