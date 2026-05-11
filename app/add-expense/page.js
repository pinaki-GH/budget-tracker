'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveExpense } from '../../lib/storage'

export default function AddExpense() {
  const router = useRouter()

  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [year, setYear] = useState('')
  const [quarter, setQuarter] = useState('')
  const [purpose, setPurpose] = useState('')
  const [currency, setCurrency] = useState('INR')

  const handleSubmit = () => {
    if (
      !vendor ||
      !amount ||
      !date ||
      !year ||
      !quarter ||
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
      purpose,
      currency
    })

    alert('Expense saved!')
    router.push('/')
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/">
          <button>Home</button>
        </Link>

        <Link href="/add-budget" style={{ marginLeft: 10 }}>
          <button>Add Budget</button>
        </Link>
      </div>

      <h1>Add Expense</h1>

      {/* Vendor */}
      <input
        placeholder="Vendor"
        value={vendor}
        onChange={(e) => setVendor(e.target.value)}
      />

      <br /><br />

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
        placeholder="Purpose / Project"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
      />

      <br /><br />

      {/* Currency */}
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
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

      <button onClick={handleSubmit}>Save</button>
    </div>
  )
}
