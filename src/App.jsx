import './App.css'
import IncomeForm from './components/IncomeForm'
import ExpenseForm from './components/ExpenseForm'
import IncomeTable from './components/IncomeTable'
import ExpenseTable from './components/ExpenseTable'
import ExpenseBreakdown from './components/ExpenseBreakdown'
import YearlySummary from './components/YearlySummary'
import { useBudget } from './hooks/useBudget'

function App() {
  const {
    selectedMonth,
    selectedYear,
    editingIncome,
    editingExpense,
    viewMode,
    filteredIncomes,
    filteredExpenses,
    totalIncome,
    totalExpenses,
    netIncome,
    expensesByCategory,
    incomes,
    expenses,
    loading,
    error,
    setSelectedMonth,
    setSelectedYear,
    setViewMode,
    setEditingIncome,
    setEditingExpense,
    addIncome,
    addExpense,
    deleteIncome,
    deleteExpense,
    editIncome,
    updateIncome,
    editExpense,
    updateExpense,
    exportToCSV
  } = useBudget()

  // Show loading state
  if (loading) {
    return (
      <div className="app">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid var(--primary-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading your budget data...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="app">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h2 style={{ color: 'var(--danger-color)' }}>Error Loading Data</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <h1>Budget Book</h1>

      <div className="month-selector">
        <div className="view-toggle">
          <button
            className={viewMode === 'monthly' ? 'active' : ''}
            onClick={() => setViewMode('monthly')}
          >
            Monthly
          </button>
          <button
            className={viewMode === 'yearly' ? 'active' : ''}
            onClick={() => setViewMode('yearly')}
          >
            Yearly
          </button>
        </div>
        {viewMode === 'monthly' && (
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
            {Array.from({length: 12}, (_, i) => (
              <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        )}
        <input
          type="number"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          min="2020"
          max="2030"
        />
        <button onClick={exportToCSV} className="export-btn">Export to CSV</button>
      </div>

      <div className="summary">
        <div className="summary-item">
          <h3>Total Income</h3>
          <p>${totalIncome.toFixed(2)}</p>
        </div>
        <div className="summary-item">
          <h3>Total Expenses</h3>
          <p>${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="summary-item">
          <h3>Net Income</h3>
          <p className={netIncome >= 0 ? 'positive' : 'negative'}>${netIncome.toFixed(2)}</p>
        </div>
      </div>

      <div className="main-content">
        <div className="section">
          <h2>Income</h2>
          <IncomeForm onAddIncome={addIncome} editingIncome={editingIncome} onUpdateIncome={updateIncome} onCancelEdit={() => setEditingIncome(null)} />
          <IncomeTable incomes={filteredIncomes} onDeleteIncome={deleteIncome} onEditIncome={editIncome} />
        </div>

        <div className="section">
          <h2>Expenses</h2>
          <ExpenseForm onAddExpense={addExpense} editingExpense={editingExpense} onUpdateExpense={updateExpense} onCancelEdit={() => setEditingExpense(null)} />
          <ExpenseTable expenses={filteredExpenses} onDeleteExpense={deleteExpense} onEditExpense={editExpense} />
        </div>

        <div className="section">
          <h2>Expense Breakdown</h2>
          <ExpenseBreakdown expensesByCategory={expensesByCategory} />
        </div>

        {viewMode === 'yearly' && (
          <div className="section yearly-summary">
            <h2>Monthly Summary ({selectedYear})</h2>
            <YearlySummary incomes={incomes} expenses={expenses} year={selectedYear} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
