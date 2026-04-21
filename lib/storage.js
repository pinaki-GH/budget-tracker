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
  budgets.push(budget)
  localStorage.setItem('budgets', JSON.stringify(budgets))
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
