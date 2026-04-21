'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { saveBudget, getBudgets, deleteBudget } from '../../lib/storage'

export default function AddBudget() {
  const [year, setYear] = useState('')
  const [quarter, setQuarter] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [budgets, setBudgets] = useState([])

  useEffect(() => {
    loadBudgets()
  }, [])

  function loadBudgets() {
    const data = getBudgets()
    setBudgets(data)
  }

  const handleSubmit = () => {
    if (!year || !quarter || !amount || !purpose || !currency) {
      alert('Please fill all fields')
      return
    }

    saveBudget({
      year,
      quarter,
      purpose,
      currency,
      total_budget: Number(amount)
    })

    alert('Budget saved!')

    // reset form
    setYear('')
    setQuarter('')
    setAmount('')
    setPurpose('')
    setCurrency('INR')

    loadBudgets()
  }

  // ✅ Delete handler
  const handleDelete = (id) => {
    const confirmDelete = confirm('Are you sure you want to delete this budget?')
    if (!confirmDelete) return

    deleteBudget(id)
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
        placeholder="Budget For (e.g. Project A)"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
      />

      <br /><br />

      {/* Currency */}
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="INR">₹ INR</option>
        <option value="USD">$ USD</option>
        <option value="EUR">€ EUR</option>
      </select>

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
              <th>Currency</th>
              <th>Budget</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.id}>
                <td>{b.year}</td>
                <td>{b.quarter}</td>
                <td>{b.purpose}</td>
                <td>{b.currency}</td>
                <td>
                  {b.currency === 'INR' && '₹'}
                  {b.currency === 'USD' && '$'}
                  {b.currency === 'EUR' && '€'}
                  {b.total_budget}
                </td>
                <td>
                  <button onClick={() => handleDelete(b.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
