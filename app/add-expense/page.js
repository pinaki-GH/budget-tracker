'use client'

import { useState } from 'react'
import { saveExpense } from '../../lib/storage'

export default function AddExpense() {
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')

  const handleSubmit = () => {
    saveExpense({
      vendor_name: vendor,
      amount: Number(amount),
      date
    })

    alert('Expense saved!')
  }

  return (
    <div>
      <h1>Add Expense</h1>

      <input placeholder="Vendor" onChange={(e) => setVendor(e.target.value)} />
      <input placeholder="Amount" onChange={(e) => setAmount(e.target.value)} />
      <input type="date" onChange={(e) => setDate(e.target.value)} />

      <button onClick={handleSubmit}>Save</button>
    </div>
  )
}
