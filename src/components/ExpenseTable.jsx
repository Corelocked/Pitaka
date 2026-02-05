import './Table.css'

function ExpenseTable({ expenses, onDeleteExpense, onEditExpense }) {
  if (expenses.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">🛒</div>
        <p>No expenses yet. Add your first expense above!</p>
      </div>
    )
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map(expense => (
          <tr key={expense.id}>
            <td>{expense.description}</td>
            <td>{expense.category}</td>
            <td className="amount">${expense.amount.toFixed(2)}</td>
            <td>{new Date(expense.date).toLocaleDateString()}</td>
            <td className="actions">
              <button className="edit-btn" onClick={() => onEditExpense(expense)}>Edit</button>
              <button className="delete-btn" onClick={() => onDeleteExpense(expense.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ExpenseTable