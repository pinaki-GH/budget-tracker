export default function BudgetSummary({ budget, totalSpend }) {
  const remaining = budget - totalSpend

  return (
    <div>
      <h2>Summary</h2>
      <p>Total Budget: ₹{budget}</p>
      <p>Total Spend: ₹{totalSpend}</p>
      <p>Remaining: ₹{remaining}</p>
    </div>
  )
}
