'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getExpenses, getBudgets } from '../lib/storage'
import BudgetSummary from '../components/BudgetSummary'
import ExpenseList from '../components/ExpenseList'

export default function Home() {
  const [expenses, setExpenses] = useState([])
  const [budget, setBudget] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    const exp = getExpenses()
    const bud = getBudgets()

    setExpenses(exp)
    setBudget(bud.length > 0 ? bud[bud.length - 1].total_budget : 0)
  }

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div style={{ padding: 20 }}>
      <h1>Budget Tracker</h1>

      {/* ✅ Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/">
          <button>Home</button>
        </Link>

        <Link href="/add-budget" style={{ marginLeft: 10 }}>
          <button>Add Budget</button>
        </Link>

        <Link href="/add-expense" style={{ marginLeft: 10 }}>
          <button>Add Expense</button>
        </Link>

        <button onClick={loadData} style={{ marginLeft: 10 }}>
          Refresh
        </button>
      </div>

      <BudgetSummary budget={budget} totalSpend={totalSpend} />
      <ExpenseList expenses={expenses} />
    </div>
  )
}
