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

export function deleteExpense(id) {
  const expenses = getExpenses()

  const updated = expenses.filter((e) => e.id !== id)

  localStorage.setItem('expenses', JSON.stringify(updated))
}

export function updateExpense(updatedExpense) {
  const expenses = getExpenses()

  const updated = expenses.map((e) =>
    e.id === updatedExpense.id ? updatedExpense : e
  )

  localStorage.setItem('expenses', JSON.stringify(updated))
}

/* =========================================
   FOREX RATES
========================================= */

const defaultRates = [
  {
    id: 1,
    currency: 'SEK',
    rate: 1
  },
  {
    id: 2,
    currency: 'INR',
    rate: 0.13
  },
  {
    id: 3,
    currency: 'USD',
    rate: 10.5
  },
  {
    id: 4,
    currency: 'EUR',
    rate: 11.5
  }
]

export function getForexRates() {

  if (typeof window === 'undefined') return defaultRates

  const stored = localStorage.getItem('forexRates')

  // First time load
  if (!stored) {
    localStorage.setItem(
      'forexRates',
      JSON.stringify(defaultRates)
    )

    return defaultRates
  }

  try {
    return JSON.parse(stored)
  } catch {
    return defaultRates
  }
}

export function saveForexRate(rateData) {

  const rates = getForexRates()

  rates.push({
    id: Date.now(),
    ...rateData
  })

  localStorage.setItem(
    'forexRates',
    JSON.stringify(rates)
  )
}

export function deleteForexRate(id) {

  const rates = getForexRates()

  const updated = rates.filter((r) => r.id !== id)

  localStorage.setItem(
    'forexRates',
    JSON.stringify(updated)
  )
}

export function updateForexRate(updatedRate) {

  const rates = getForexRates()

  const updated = rates.map((r) =>
    r.id === updatedRate.id
      ? updatedRate
      : r
  )

  localStorage.setItem(
    'forexRates',
    JSON.stringify(updated)
  )
}
