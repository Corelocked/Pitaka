import './Table.css'

function IncomeTable({ incomes, onDeleteIncome, onEditIncome }) {
  if (incomes.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">💰</div>
        <p>No income entries yet. Add your first income above!</p>
      </div>
    )
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Source</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {incomes.map(income => (
          <tr key={income.id}>
            <td>{income.source}</td>
            <td className="amount">${income.amount.toFixed(2)}</td>
            <td>{new Date(income.date).toLocaleDateString()}</td>
            <td className="actions">
              <button className="edit-btn" onClick={() => onEditIncome(income)}>Edit</button>
              <button className="delete-btn" onClick={() => onDeleteIncome(income.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default IncomeTable