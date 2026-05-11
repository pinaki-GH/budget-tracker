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

  const totalBudget = filteredBudgets.reduce(
    (sum, b) => sum + b.total_budget,
    0
  )

  const totalSpend = filteredExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  )

  const remaining = totalBudget - totalSpend

  return (
    <div style={{ padding: 20 }}>
      <h1>PMO Budget Dashboard</h1>

      {/* Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/add-budget">
          <button>Add Budget</button>
        </Link>

        <Link href="/add-expense" style={{ marginLeft: 10 }}>
          <button>Add Expense</button>
        </Link>

        <button onClick={loadData} style={{ marginLeft: 10 }}>
          Refresh
        </button>
      </div>

      <hr />

      {/* Filters */}
      <h2>Filters</h2>

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

      <hr style={{ margin: '20px 0' }} />

      {/* Summary */}
      <h2>Summary</h2>

      <p>Total Budget: {totalBudget}</p>
      <p>Total Spend: {totalSpend}</p>
      <p>Remaining: {remaining}</p>

      <hr style={{ margin: '20px 0' }} />

      {/* Budget Table */}
      <h2>Budgets</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Year</th>
            <th>Quarter</th>
            <th>Purpose</th>
            <th>Currency</th>
            <th>Budget</th>
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
            </tr>
          ))}
        </tbody>
      </table>

      <hr style={{ margin: '20px 0' }} />

      {/* Expense Table */}
      <h2>Expenses</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Year</th>
            <th>Quarter</th>
            <th>Purpose</th>
            <th>Currency</th>
            <th>Amount</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
