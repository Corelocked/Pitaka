import './Table.css'

function YearlySummary({ incomes, expenses, year }) {
  const monthlyData = Array.from({ length: 12 }, (_, month) => {
    const monthIncomes = incomes.filter(inc => {
      const date = new Date(inc.date)
      return date.getMonth() === month && date.getFullYear() === year
    })
    const monthExpenses = expenses.filter(exp => {
      const date = new Date(exp.date)
      return date.getMonth() === month && date.getFullYear() === year
    })

    const totalIncome = monthIncomes.reduce((sum, inc) => sum + inc.amount, 0)
    const totalExpenses = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const net = totalIncome - totalExpenses

    return {
      month: new Date(year, month).toLocaleString('default', { month: 'short' }),
      income: totalIncome,
      expenses: totalExpenses,
      net
    }
  })

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Income</th>
          <th>Expenses</th>
          <th>Net</th>
        </tr>
      </thead>
      <tbody>
        {monthlyData.map(data => (
          <tr key={data.month}>
            <td>{data.month}</td>
            <td className="amount">₱{data.income.toFixed(2)}</td>
            <td className="amount">₱{data.expenses.toFixed(2)}</td>
            <td className={'amount ' + (data.net >= 0 ? 'positive' : 'negative')}>
              ₱{data.net.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default YearlySummary