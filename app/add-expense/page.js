'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveExpense } from '../../lib/storage'

export default function AddExpense() {
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const router = useRouter()

  const handleSubmit = () => {
    if (!vendor || !amount || !date) {
      alert('Please fill all fields')
      return
    }

    saveExpense({
      vendor_name: vendor,
      amount: Number(amount),
      date
    })

    alert('Expense saved!')
    router.push('/')
  }

  return (
    <div style={{ padding: 20 }}>
      {/* ✅ Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/">
          <button>Home</button>
        </Link>

        <Link href="/add-budget" style={{ marginLeft: 10 }}>
          <button>Add Budget</button>
        </Link>
      </div>

      <h1>Add Expense</h1>

      <input
        placeholder="Vendor"
        onChange={(e) => setVendor(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Amount"
        type="number"
        onChange={(e) => setAmount(e.target.value)}
      />
      <br /><br />

      <input
        type="date"
        onChange={(e) => setDate(e.target.value)}
      />
      <br /><br />

      <button onClick={handleSubmit}>Save</button>
    </div>
  )
}
