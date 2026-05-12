export function getBudgets() {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(localStorage.getItem('budgets') || '[]')
  } catch {
    return []
  }
}

export function saveBudget(budget) {
  const budgets = getBudgets()

  budgets.push({
    id: Date.now(),
    ...budget
  })

  localStorage.setItem('budgets', JSON.stringify(budgets))
}

export function deleteBudget(id) {
  const budgets = getBudgets()

  const updated = budgets.filter((b) => b.id !== id)

  localStorage.setItem('budgets', JSON.stringify(updated))
}

export function updateBudget(updatedBudget) {
  const budgets = getBudgets()

  const updated = budgets.map((b) =>
    b.id === updatedBudget.id ? updatedBudget : b
  )

  localStorage.setItem('budgets', JSON.stringify(updated))
}

export function getExpenses() {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(localStorage.getItem('expenses') || '[]')
  } catch {
    return []
  }
}

export function saveExpense(expense) {
  const expenses = getExpenses()

  expenses.push({
    id: Date.now(),
    ...expense
  })

  localStorage.setItem('expenses', JSON.stringify(expenses))
}

// ✅ NEW
export function deleteExpense(id) {
  const expenses = getExpenses()

  const updated = expenses.filter((e) => e.id !== id)

  localStorage.setItem('expenses', JSON.stringify(updated))
}

// ✅ NEW
export function updateExpense(updatedExpense) {
  const expenses = getExpenses()

  const updated = expenses.map((e) =>
    e.id === updatedExpense.id ? updatedExpense : e
  )

  localStorage.setItem('expenses', JSON.stringify(updated))
}
