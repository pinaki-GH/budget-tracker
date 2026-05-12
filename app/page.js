'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getBudgets, getExpenses } from '../lib/storage'

export default function Home() {
  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])

  const [yearFilter, setYearFilter] = useState('')
  const [quarterFilter, setQuarterFilter] = useState('')
  const [purposeFilter, setPurposeFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setBudgets(getBudgets())
    setExpenses(getExpenses())
  }

  // Exchange rates to SEK
  const exchangeRates = {
    SEK: 1,
    INR: 0.13,
    USD: 10.5,
    EUR: 11.5
  }

  // Convert currency to SEK
  const convertToSEK = (amount, currency) => {
    return amount * (exchangeRates[currency] || 1)
  }

  // Filter budgets
  const filteredBudgets = budgets.filter((b) => {
    return (
      (!yearFilter || b.year === yearFilter) &&
      (!quarterFilter || b.quarter === quarterFilter) &&
      (!purposeFilter ||
        b.purpose.toLowerCase().includes(purposeFilter.toLowerCase()))
    )
  })

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    return (
      (!yearFilter || e.year === yearFilter) &&
      (!quarterFilter || e.quarter === quarterFilter) &&
      (!purposeFilter ||
        e.purpose.toLowerCase().includes(purposeFilter.toLowerCase()))
    )
  })

  // Totals in SEK
  const totalBudgetSEK = filteredBudgets.reduce((sum, b) => {
    return sum + convertToSEK(b.total_budget, b.currency)
  }, 0)

  const totalSpendSEK = filteredExpenses.reduce((sum, e) => {
    return sum + convertToSEK(e.amount, e.currency)
  }, 0)

  const remainingSEK = totalBudgetSEK - totalSpendSEK

  // Utilization %
  const utilization =
    totalBudgetSEK > 0
      ? (totalSpendSEK / totalBudgetSEK) * 100
      : 0

  // Progress bar color
  const getProgressColor = () => {
    if (utilization < 60) return '#4CAF50'
    if (utilization < 85) return '#FF9800'
    return '#F44336'
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

        //<button onClick={loadData} style={{ marginLeft: 10 }}>
          //Refresh
        //</button>
      </div>

      <hr />

      {/* Filters */}
      <h2>Filters</h2>

      <div style={{ marginBottom: 20 }}>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="">All Years</option>
          <option>2025</option>
          <option>2026</option>
          <option>2027</option>
        </select>

        <select
          value={quarterFilter}
          onChange={(e) => setQuarterFilter(e.target.value)}
          style={{ marginLeft: 10 }}
        >
          <option value="">All Quarters</option>
          <option>Q1</option>
          <option>Q2</option>
          <option>Q3</option>
          <option>Q4</option>
        </select>

        <input
          placeholder="Filter by purpose"
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
          style={{ marginLeft: 10 }}
        />
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
            minWidth: 220,
            background: '#f9f9f9'
          }}
        >
          <h3>Total Budget</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold' }}>
            kr {totalBudgetSEK.toFixed(2)}
          </p>
        </div>

        {/* Total Spend */}
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 20,
            minWidth: 220,
            background: '#f9f9f9'
          }}
        >
          <h3>Total Spend</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold' }}>
            kr {totalSpendSEK.toFixed(2)}
          </p>
        </div>

        {/* Remaining */}
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 20,
            minWidth: 220,
            background: '#f9f9f9'
          }}
        >
          <h3>Remaining</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold' }}>
            kr {remainingSEK.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Utilization */}
      <h2>Budget Utilization</h2>

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
            width: `${Math.min(utilization, 100)}%`,
            background: getProgressColor(),
            height: '100%',
            color: 'white',
            textAlign: 'center',
            lineHeight: '35px',
            fontWeight: 'bold',
            transition: '0.3s'
          }}
        >
          {utilization.toFixed(1)}%
        </div>
      </div>

      <p style={{ marginTop: 10 }}>
        {utilization < 60 && 'Healthy budget utilization'}
        {utilization >= 60 &&
          utilization < 85 &&
          'Budget utilization increasing'}
        {utilization >= 85 && 'Warning: Budget nearing limit'}
      </p>

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
            <th>Year</th>
            <th>Quarter</th>
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
              <td>{e.year}</td>
              <td>{e.quarter}</td>
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
