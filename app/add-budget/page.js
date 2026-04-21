'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveBudget } from '../../lib/storage'

export default function AddBudget() {
  const [quarter, setQuarter] = useState('')
  const [amount, setAmount] = useState('')
  const router = useRouter()

  const handleSubmit = () => {
    if (!quarter || !amount) {
      alert('Please fill all fields')
      return
    }

    saveBudget({
      quarter,
      total_budget: Number(amount)
    })

    alert('Budget saved!')
    router.push('/')
  }

  return (
    <div style={{ padding: 20 }}>
      {/* ✅ Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/">
          <button>Home</button>
        </Link>

        <Link href="/add-expense" style={{ marginLeft: 10 }}>
          <button>Add Expense</button>
        </Link>
      </div>

      <h1>Add Budget</h1>

      <input
        placeholder="Quarter (Q1-2026)"
        onChange={(e) => setQuarter(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Amount"
        type="number"
        onChange={(e) => setAmount(e.target.value)}
      />
      <br /><br />

      <button onClick={handleSubmit}>Save</button>
    </div>
  )
}
