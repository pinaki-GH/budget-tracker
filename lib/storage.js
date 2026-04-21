export function getBudgets() {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('budgets') || '[]')
}

export function saveBudget(budget) {
  const budgets = getBudgets()
  budgets.push(budget)
  localStorage.setItem('budgets', JSON.stringify(budgets))
}

export function getExpenses() {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('expenses') || '[]')
}

export function saveExpense(expense) {
  const expenses = getExpenses()
  expenses.push(expense)
  localStorage.setItem('expenses', JSON.stringify(expenses))
}
