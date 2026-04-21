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

// ✅ NEW: update/edit function
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
  expenses.push(expense)
  localStorage.setItem('expenses', JSON.stringify(expenses))
}
