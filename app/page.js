'use client'

import { useEffect, useState } from 'react'
import { getExpenses, getBudgets } from '../lib/storage'
import BudgetSummary from '../components/BudgetSummary'
import ExpenseList from '../components/ExpenseList'

export default function Home() {
  const [expenses, setExpenses] = useState([])
  const [budget, setBudget] = useState(0)

  useEffect(() => {
    const exp = getExpenses()
    const bud = getBudgets()

    setExpenses(exp)
    setBudget(bud.length > 0 ? bud[0].total_budget : 0)
  }, [])

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div style={{ padding: 20 }}>
      <h1>Budget Tracker</h1>

      <BudgetSummary budget={budget} totalSpend={totalSpend} />
      <ExpenseList expenses={expenses} />
    </div>
  )
}
