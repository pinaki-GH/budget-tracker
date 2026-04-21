'use client'

import { useState } from 'react'
import { saveBudget } from '../../lib/storage'

export default function AddBudget() {
  const [quarter, setQuarter] = useState('')
  const [amount, setAmount] = useState('')

  const handleSubmit = () => {
    saveBudget({
      quarter,
      total_budget: Number(amount)
    })

    alert('Budget saved!')
  }

  return (
    <div>
      <h1>Add Budget</h1>

      <input placeholder="Quarter (Q1-2026)" onChange={(e) => setQuarter(e.target.value)} />
      <input placeholder="Amount" onChange={(e) => setAmount(e.target.value)} />

      <button onClick={handleSubmit}>Save</button>
    </div>
  )
}
