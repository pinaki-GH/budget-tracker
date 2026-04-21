export default function ExpenseList({ expenses }) {
  if (!expenses || expenses.length === 0) {
    return <p>No expenses added yet</p>
  }

  return (
    <div>
      <h2>Expenses</h2>
      <ul>
        {expenses.map((e, i) => (
          <li key={i}>
            {e.vendor_name} - ₹{e.amount} ({e.date})
          </li>
        ))}
      </ul>
    </div>
  )
}
