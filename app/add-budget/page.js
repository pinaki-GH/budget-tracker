'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveBudget, getBudgets } from '../../lib/storage'

export default function AddBudget() {
  const router = useRouter()

  const [year, setYear] = useState('')
  const [quarter, setQuarter] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [budgets, setBudgets] = useState([])

  useEffect(() => {
    loadBudgets()
  }, [])

  function loadBudgets() {
    const data = getBudgets()
    setBudgets(data)
  }

  const handleSubmit = () => {
    if (!year || !quarter || !amount || !purpose) {
      alert('Please fill all fields')
      return
    }

    saveBudget({
      year,
      quarter,
      purpose,
      total_budget: Number(amount)
    })

    alert('Budget saved!')

    // reset form
    setYear('')
    setQuarter('')
    setAmount('')
    setPurpose('')

    // reload table
    loadBudgets()
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/">
          <button>Home</button>
        </Link>

        <Link href="/add-expense" style={{ marginLeft: 10 }}>
          <button>Add Expense</button>
        </Link>
      </div>

      <h1>Add Budget</h1>

      {/* Year */}
      <select value={year} onChange={(e) => setYear(e.target.value)}>
        <option value="">Select Year</option>
        <option value="2025">2025</option>
        <option value="2026">2026</option>
        <option value="2027">2027</option>
      </select>

      <br /><br />

      {/* Quarter */}
      <select value={quarter} onChange={(e) => setQuarter(e.target.value)}>
        <option value="">Select Quarter</option>
        <option value="Q1">Q1</option>
        <option value="Q2">Q2</option>
        <option value="Q3">Q3</option>
        <option value="Q4">Q4</option>
      </select>

      <br /><br />

      {/* Purpose */}
      <input
        placeholder="Budget For (e.g. Project A / Infra / Marketing)"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
      />

      <br /><br />

      {/* Amount */}
      <input
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <br /><br />

      <button onClick={handleSubmit}>Save</button>

      <hr style={{ margin: '30px 0' }} />

      {/* Budget Table */}
      <h2>Saved Budgets</h2>

      {budgets.length === 0 ? (
        <p>No budgets added yet</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Year</th>
              <th>Quarter</th>
              <th>Purpose</th>
              <th>Budget</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.id}>
                <td>{b.year}</td>
                <td>{b.quarter}</td>
                <td>{b.purpose}</td>
                <td>₹{b.total_budget}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
