import './ExpenseBreakdown.css'

function ExpenseBreakdown({ expensesByCategory }) {
  return (
    <div className="breakdown">
      {expensesByCategory.map(item => (
        <div key={item.category} className="breakdown-item">
          <div className="breakdown-header">
            <span className="breakdown-category">{item.category}</span>
            <span className="breakdown-amount">${item.total.toFixed(2)}</span>
          </div>
          <div className="breakdown-progress">
            <div
              className="breakdown-bar"
              style={{ width: item.percentage + '%' }}
            ></div>
          </div>
          <div className="breakdown-percentage">{item.percentage}% of total expenses</div>
        </div>
      ))}
    </div>
  )
}

export default ExpenseBreakdown