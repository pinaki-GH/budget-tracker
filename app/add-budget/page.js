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
  const [project, setProject] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [currency, setCurrency] = useState('INR')

  const [budgets, setBudgets] = useState([])
  const [editingId, setEditingId] = useState(null)

  // Filters
  const [filterYear, setFilterYear] = useState('')
  const [filterQuarter, setFilterQuarter] =
    useState('')
  const [filterProject, setFilterProject] =
    useState('All Projects')
  const [filterPurpose, setFilterPurpose] =
    useState('')

  useEffect(() => {
    loadBudgets()
  }, [])

  function loadBudgets() {
    setBudgets(getBudgets())
  }

  const handleSubmit = () => {

    if (
      !year ||
      !quarter ||
      !project ||
      !amount ||
      !purpose
    ) {
      alert('Please fill all fields')
      return
    }

    saveBudget({
      year,
      quarter,
      project,
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

  const handleEdit = (b) => {

    setEditingId(b.id)

    setYear(b.year)
    setQuarter(b.quarter)
    setProject(b.project || '')
    setPurpose(b.purpose)
    setCurrency(b.currency)
    setAmount(b.total_budget)
  }

  const handleUpdate = () => {

    updateBudget({
      id: editingId,
      year,
      quarter,
      project,
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
    setProject('')
    setPurpose('')
    setCurrency('INR')
    setAmount('')
  }

  const clearFilters = () => {
    setFilterYear('')
    setFilterQuarter('')
    setFilterProject('All Projects')
    setFilterPurpose('')
  }

  const getSymbol = (cur) => {
    if (cur === 'INR') return '₹'
    if (cur === 'USD') return '$'
    if (cur === 'EUR') return '€'
    if (cur === 'SEK') return 'kr'
    return ''
  }

  // Filtered Budgets
  const filteredBudgets = budgets.filter((b) => {
    return (
      (!filterYear || b.year === filterYear) &&
      (!filterQuarter ||
        b.quarter === filterQuarter) &&

      (filterProject === 'All Projects' ||
        b.project === filterProject) &&

      (!filterPurpose ||
        b.purpose.toLowerCase().includes(
          filterPurpose.toLowerCase()
        ))
    )
  })

  // Totals by currency
  const budgetTotalsByCurrency = {}

  filteredBudgets.forEach((b) => {

    if (!budgetTotalsByCurrency[b.currency]) {
      budgetTotalsByCurrency[b.currency] = 0
    }

    budgetTotalsByCurrency[b.currency] +=
      Number(b.total_budget || 0)
  })

  const budgetTotalsText =
    Object.entries(budgetTotalsByCurrency)
      .map(([currency, total]) =>
        `${currency} ${total.toFixed(2)}`
      )
      .join(' | ')

  return (
    <div style={{ padding: 20 }}>

      {/* Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/">
          <button>Dashboard</button>
        </Link>

        <Link href="/add-expense" style={{ marginLeft: 10 }}>
          <button>Expense</button>
        </Link>

        <Link href="/forex-rates" style={{ marginLeft: 10 }}>
          <button>Forex Rates</button>
        </Link>

        <Link href="/resource-master" style={{ marginLeft: 10 }}>
          <button>Resource Master</button>
        </Link>

        <Link href="/projections" style={{ marginLeft: 10 }}>
          <button>Projections</button>
        </Link>
        
      </div>

      <h1>{editingId ? 'Edit Budget' : 'Budget'}</h1>

      {/* Year */}
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
      >
        <option value="">Select Year</option>
        <option>2025</option>
        <option>2026</option>
        <option>2027</option>
      </select>

      <br /><br />

      {/* Quarter */}
      <select
        value={quarter}
        onChange={(e) => setQuarter(e.target.value)}
      >
        <option value="">Select Quarter</option>
        <option>Q1</option>
        <option>Q2</option>
        <option>Q3</option>
        <option>Q4</option>
      </select>

      <br /><br />

      {/* Project */}
      <input
        placeholder="Project"
        value={project}
        onChange={(e) => setProject(e.target.value)}
      />

      <br /><br />

      {/* Purpose */}
      <input
        placeholder="Purpose"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
      />

      <br /><br />

      {/* Currency */}
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
      >
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

      {editingId ? (
        <button onClick={handleUpdate}>
          Update
        </button>
      ) : (
        <button onClick={handleSubmit}>
          Save
        </button>
      )}

      <hr style={{ margin: '30px 0' }} />

      <h2>
        Saved Budgets
        {budgetTotalsText &&
          ` (${budgetTotalsText})`}
      </h2>

      {/* Filters */}
      <div style={{ marginBottom: 20 }}>

        <select
          value={filterYear}
          onChange={(e) =>
            setFilterYear(e.target.value)
          }
        >
          <option value="">All Years</option>
          <option>2025</option>
          <option>2026</option>
          <option>2027</option>
        </select>

        <select
          value={filterQuarter}
          onChange={(e) =>
            setFilterQuarter(e.target.value)
          }
          style={{ marginLeft: 10 }}
        >
          <option value="">All Quarters</option>
          <option>Q1</option>
          <option>Q2</option>
          <option>Q3</option>
          <option>Q4</option>
        </select>

        <select
          value={filterProject}
          onChange={(e) =>
            setFilterProject(e.target.value)
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

        <input
          placeholder="Search purpose"
          value={filterPurpose}
          onChange={(e) =>
            setFilterPurpose(e.target.value)
          }
          style={{ marginLeft: 10 }}
        />

        <button
          onClick={clearFilters}
          style={{ marginLeft: 10 }}
        >
          Clear Filter
        </button>
      </div>

      {filteredBudgets.length === 0 ? (
        <p>No budgets found</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Year</th>
              <th>Quarter</th>
              <th>Project</th>
              <th>Purpose</th>
              <th>Currency</th>
              <th>Amount</th>
              <th>Actions</th>
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

                <td>
                  {getSymbol(b.currency)} {b.total_budget}
                </td>

                <td>
                  <button
                    onClick={() => handleEdit(b)}
                  >
                    Edit
                  </button>

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
