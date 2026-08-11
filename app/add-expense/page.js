'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import {
  saveExpense,
  getExpenses,
  deleteExpense,
  updateExpense
} from '../../lib/storage'

export default function AddExpense() {

  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [year, setYear] = useState('')
  const [quarter, setQuarter] = useState('')
  const [project, setProject] = useState('')
  const [purpose, setPurpose] = useState('')
  const [currency, setCurrency] = useState('INR')

  const [expenses, setExpenses] = useState([])
  const [editingId, setEditingId] = useState(null)

  // Filters
  const [filterYear, setFilterYear] = useState('')
  const [filterQuarter, setFilterQuarter] =
    useState('')
  const [filterProject, setFilterProject] =
    useState('All Projects')
  const [filterPurpose, setFilterPurpose] =
    useState('')
  const [filterMonth, setFilterMonth] =
  useState('')
  
  useEffect(() => {
    loadExpenses()
  }, [])

  function loadExpenses() {
    setExpenses(getExpenses())
  }

  const handleSubmit = () => {

    if (
      !vendor ||
      !amount ||
      !date ||
      !year ||
      !quarter ||
      !project ||
      !purpose
    ) {
      alert('Please fill all fields')
      return
    }

    saveExpense({
      vendor_name: vendor,
      amount: Number(amount),
      date,
      year,
      quarter,
      project,
      purpose,
      currency
    })

    resetForm()
    loadExpenses()
  }

  const handleDelete = (id) => {

    if (!confirm('Delete this expense?')) return

    deleteExpense(id)
    loadExpenses()
  }

  const handleEdit = (e) => {

    setEditingId(e.id)

    setVendor(e.vendor_name)
    setAmount(e.amount)
    setDate(e.date)
    setYear(e.year)
    setQuarter(e.quarter)
    setProject(e.project || '')
    setPurpose(e.purpose)
    setCurrency(e.currency)
  }

  const handleUpdate = () => {

    updateExpense({
      id: editingId,
      vendor_name: vendor,
      amount: Number(amount),
      date,
      year,
      quarter,
      project,
      purpose,
      currency
    })

    setEditingId(null)

    resetForm()
    loadExpenses()
  }

  const resetForm = () => {

    setVendor('')
    setAmount('')
    setDate('')
    setYear('')
    setQuarter('')
    setProject('')
    setPurpose('')
    setCurrency('INR')
  }

  const clearFilters = () => {
  setFilterYear('')
  setFilterQuarter('')
  setFilterMonth('')
  setFilterProject('All Projects')
  setFilterPurpose('')
  }

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
  filterQuarter
    ? quarterMonths[filterQuarter]
    : allMonths
  
  // Filtered Expenses
  const filteredExpenses = expenses.filter((e) => {

  const expenseMonth =
    e.date
      ? e.date.split('-')[1]
      : ''

  return (
    (!filterYear || e.year === filterYear) &&

    (!filterQuarter ||
      e.quarter === filterQuarter) &&

    (!filterMonth ||
      expenseMonth === filterMonth) &&

    (filterProject === 'All Projects' ||
      e.project === filterProject) &&

    (!filterPurpose ||
      e.purpose.toLowerCase().includes(
        filterPurpose.toLowerCase()
      ))
  )
})

  // Totals by currency
  const expenseTotalsByCurrency = {}

  filteredExpenses.forEach((e) => {

    if (!expenseTotalsByCurrency[e.currency]) {
      expenseTotalsByCurrency[e.currency] = 0
    }

    expenseTotalsByCurrency[e.currency] +=
      Number(e.amount || 0)
  })

  const expenseTotalsText =
    Object.entries(expenseTotalsByCurrency)
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
      
        <Link href="/project-budgets" style={{ marginLeft: 10 }}>
          <button>Project Budgets</button>
        </Link>
        
        <Link href="/add-budget" style={{ marginLeft: 10 }}>
          <button>Projected Spend</button>
        </Link>

        <Link href="/forex-rates" style={{ marginLeft: 10 }}>
          <button>Forex Rates</button>
        </Link>

        <Link href="/resource-master" style={{ marginLeft: 10 }}>
          <button>Resource Master</button>
        </Link>

        <Link href="/projections" style={{ marginLeft: 10 }}>
          <button>Projection Planning</button>
        </Link>
        
      </div>

      <h1>{editingId ? 'Edit Expense' : 'Expense Tracking (based on Actual Consumption)'}</h1>

      {/* Vendor */}
      <input
        placeholder="Vendor"
        value={vendor}
        onChange={(e) => setVendor(e.target.value)}
      />

      <br /><br />

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
        placeholder="Purpose / Project"
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
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <br /><br />

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
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
        Saved Expenses
        {expenseTotalsText &&
          ` (${expenseTotalsText})`}
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
  onChange={(e) => {
  setFilterQuarter(e.target.value)
  setFilterMonth('')
}}
  style={{ marginLeft: 10 }}
>
  <option value="">All Quarters</option>
  <option>Q1</option>
  <option>Q2</option>
  <option>Q3</option>
  <option>Q4</option>
</select>

<select
  value={filterMonth}
  onChange={(e) =>
    setFilterMonth(e.target.value)
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
              expenses
                .map((e) => e.project)
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

      {filteredExpenses.length === 0 ? (
        <p>No expenses found</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Year</th>
              <th>Quarter</th>
              <th>Project</th>
              <th>Purpose</th>
              <th>Currency</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredExpenses.map((e) => (
              <tr key={e.id}>
                <td>{e.vendor_name}</td>
                <td>{e.year}</td>
                <td>{e.quarter}</td>
                <td>{e.project}</td>
                <td>{e.purpose}</td>
                <td>{e.currency}</td>
                <td>{e.amount}</td>
                <td>{e.date}</td>

                <td>
                  <button onClick={() => handleEdit(e)}>
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(e.id)}
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
