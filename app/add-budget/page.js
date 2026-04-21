'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  saveBudget,
  getBudgets,
  deleteBudget,
  updateBudget
} from '../../lib/storage'

export default function AddBudget() {
  const [year, setYear] = useState('')
  const [quarter, setQuarter] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [currency, setCurrency] = useState('INR')

  const [budgets, setBudgets] = useState([])
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    loadBudgets()
  }, [])

  function loadBudgets() {
    setBudgets(getBudgets())
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
      currency,
      total_budget: Number(amount)
    })

    resetForm()
    loadBudgets()
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this budget?')) return
    deleteBudget(id)
    loadBudgets()
  }

  // ✅ Start editing
  const handleEdit = (b) => {
    setEditingId(b.id)
    setYear(b.year)
    setQuarter(b.quarter)
    setPurpose(b.purpose)
    setCurrency(b.currency)
    setAmount(b.total_budget)
  }

  // ✅ Save edited budget
  const handleUpdate = () => {
    updateBudget({
      id: editingId,
      year,
      quarter,
      purpose,
      currency,
      total_budget: Number(amount)
    })

    setEditingId(null)
    resetForm()
    loadBudgets()
  }

  const resetForm = () => {
    setYear('')
    setQuarter('')
    setPurpose('')
    setCurrency('INR')
    setAmount('')
  }

  const getSymbol = (cur) => {
    if (cur === 'INR') return '₹'
    if (cur === 'USD') return '$'
    if (cur === 'EUR') return '€'
    if (cur === 'SEK') return 'kr'
    return ''
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/"><button>Home</button></Link>
        <Link href="/add-expense" style={{ marginLeft: 10 }}>
          <button>Add Expense</button>
        </Link>
      </div>

      <h1>{editingId ? 'Edit Budget' : 'Add Budget'}</h1>

      {/* Year */}
      <select value={year} onChange={(e) => setYear(e.target.value)}>
        <option value="">Select Year</option>
        <option>2025</option>
        <option>2026</option>
        <option>2027</option>
      </select>

      <br /><br />

      {/* Quarter */}
      <select value={quarter} onChange={(e) => setQuarter(e.target.value)}>
        <option value="">Select Quarter</option>
        <option>Q1</option>
        <option>Q2</option>
        <option>Q3</option>
        <option>Q4</option>
      </select>

      <br /><br />

      {/* Purpose */}
      <input
        placeholder="Purpose"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
      />

      <br /><br />

      {/* Currency (UPDATED with SEK) */}
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="INR">₹ INR</option>
        <option value="USD">$ USD</option>
        <option value="EUR">€ EUR</option>
        <option value="SEK">kr SEK</option>
      </select>

      <br /><br />

      {/* Amount */}
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <br /><br />

      {/* Button switches between Save / Update */}
      {editingId ? (
        <button onClick={handleUpdate}>Update</button>
      ) : (
        <button onClick={handleSubmit}>Save</button>
      )}

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
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.id}>
                <td>{b.year}</td>
                <td>{b.quarter}</td>
                <td>{b.purpose}</td>
                <td>{b.currency}</td>
                <td>{getSymbol(b.currency)} {b.total_budget}</td>
                <td>
                  <button onClick={() => handleEdit(b)}>Edit</button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    style={{ marginLeft: 5 }}
                  >
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
