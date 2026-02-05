import './App.css'
import HamburgerMenu from './components/HamburgerMenu'
import { useContext, useState, useEffect, useMemo } from 'react'
import { FirebaseContext } from './contexts/FirebaseContext'
import Auth from './components/Auth'
import IncomeForm from './components/IncomeForm'
import ExpenseForm from './components/ExpenseForm'
import CategoryForm from './components/CategoryForm'
import SavingsForm from './components/SavingsForm'
import AddToSavingsForm from './components/AddToSavingsForm'
import WalletForm from './components/WalletForm'
import Lendings from './pages/Lendings'
import TablesCompact from './pages/TablesCompact'
import SavingsPage from './pages/SavingsPage'
// WalletsPage removed; wallet management moved to Categories page
import CategoriesPage from './pages/CategoriesPage'
import ExpenseBreakdown from './components/ExpenseBreakdown'
import YearlySummary from './components/YearlySummary'
import WalletSummary from './components/WalletSummary'
import { useBudget } from './hooks/useBudget'

function App() {
  const { isAuthenticated, loading: authLoading, logout } = useContext(FirebaseContext)
  const {
    selectedMonth,
    selectedYear,
    editingIncome,
    editingExpense,
    editingSavings,
    editingCategory,
    viewMode,
    filteredIncomes,
    filteredExpenses,
    totalIncome,
    totalExpenses,
    totalSavings,
    netIncome,
    expensesByCategory,
    incomes,
    expenses,
    savings,
    categories,
    loading: budgetLoading,
    error,
    setSelectedMonth,
    setSelectedYear,
    setViewMode,
    setEditingIncome,
    setEditingExpense,
    setEditingSavings,
    setEditingCategory,
    addIncome,
    addExpense,
    addSavings,
    addCategory,
    deleteIncome,
    deleteExpense,
    deleteSavings,
    deleteCategory,
    editIncome,
    updateIncome,
    editExpense,
    updateExpense,
    editSavings,
    updateSavings,
    editCategory,
    updateCategory,
    wallets,
    walletBalances,
    exportToCSV,
    addWallet,
    deleteWallet,
    updateWallet,
  } = useBudget()

  const [activeTab, setActiveTab] = useState('incomes')
  const [route, setRoute] = useState(window.location.hash || '#/')

  // compute available years from dataset (incomes, expenses, savings)
  const availableYears = useMemo(() => {
    const years = new Set()
    ;[incomes, expenses, savings].forEach(list => {
      (list || []).forEach(item => {
        const dateStr = item.date ?? item.targetDate ?? item.createdAt ?? null
        if (!dateStr) return
        const d = new Date(dateStr)
        if (!isNaN(d)) years.add(d.getFullYear())
      })
    })
    const arr = Array.from(years).sort((a, b) => b - a)
    if (arr.length === 0) arr.push(new Date().getFullYear())
    if (!arr.includes(selectedYear)) arr.push(selectedYear)
    return arr
  }, [incomes, expenses, savings, selectedYear])

  // simple hash routing (kept for backward compatibility)
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // quick panel removed

  // handlers
  const handleAddToSavings = async (id, amount) => {
    const found = savings.find(s => s.id === id)
    if (!found) return
    try {
      await updateSavings({ id, currentAmount: parseFloat(found.currentAmount) + parseFloat(amount) })
    } catch (err) {
      console.error('Add to savings failed', err)
    }
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <Auth />
  }

  // Tables will be rendered as an in-dashboard view (see viewMode)

  // Show loading screen during authentication or budget loading
  if (authLoading || budgetLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dbeafe 0%, #1e40af 100%)',
        color: 'white',
        fontSize: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div>Loading Budget Book...</div>
          <div style={{ fontSize: '16px', marginTop: '10px' }}>
            Auth: {authLoading ? 'Loading' : 'Done'} | Budget: {budgetLoading ? 'Loading' : 'Done'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <HamburgerMenu>
        <div style={{paddingTop: 32}}>
          <div className="side-forms">
            <SavingsForm 
              onAddSavings={addSavings} 
              editingSavings={editingSavings}
              onUpdateSavings={updateSavings}
              onCancelEdit={() => setEditingSavings(null)}
            />
            <AddToSavingsForm
              savings={savings}
              onAddToSavings={async (id, amount) => {
                const found = savings.find(s => s.id === id)
                if (!found) return
                try {
                  await updateSavings({ id, currentAmount: parseFloat(found.currentAmount) + parseFloat(amount) })
                } catch (err) {
                  console.error('Add to savings failed', err)
                }
              }}
            />
            <CategoryForm onAddCategory={addCategory} />
          </div>
        </div>
      </HamburgerMenu>
      <div className="app-header">
        <h1>Budget Book</h1>
        <div style={{display:'flex', gap: '12px', alignItems: 'center'}}>
          
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0',
          color: '#ef4444',
          fontWeight: '500'
        }}>
          Error: {error}
        </div>
      )}

      <div className="month-selector">
        <div className="view-toggle">
          <button 
            onClick={() => { setViewMode('dashboard'); window.location.hash = '#/'; }} 
            className={viewMode === 'dashboard' ? 'active' : ''}
          >
            Dashboard
          </button>
          <button 
            onClick={() => { setViewMode('breakdown'); window.location.hash = '#/'; }} 
            className={viewMode === 'breakdown' ? 'active' : ''}
          >
            Breakdown
          </button>
          <button
            onClick={() => { setViewMode('tables-compact') }}
            className={viewMode === 'tables-compact' ? 'active' : ''}
          >
            Tables
          </button>
          <button
            onClick={() => { setViewMode('lendings') }}
            className={viewMode === 'lendings' ? 'active' : ''}
          >
            Lendings
          </button>
          <button
            onClick={() => { setViewMode('savings') }}
            className={viewMode === 'savings' ? 'active' : ''}
          >
            Savings
          </button>
          {/* Wallets page removed; manage wallets from Categories */}
          <button
            onClick={() => { setViewMode('categories') }}
            className={viewMode === 'categories' ? 'active' : ''}
          >
            Categories
          </button>
        </div>
        
        <div className="month-year-selector">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}>
            <option value={0}>January</option>
            <option value={1}>February</option>
            <option value={2}>March</option>
            <option value={3}>April</option>
            <option value={4}>May</option>
            <option value={5}>June</option>
            <option value={6}>July</option>
            <option value={7}>August</option>
            <option value={8}>September</option>
            <option value={9}>October</option>
            <option value={10}>November</option>
            <option value={11}>December</option>
          </select>
          
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard">
        <div className="summary">
          <div className="summary-item">
            <h3>Total Income</h3>
            <p className="amount income">₱{totalIncome.toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h3>Total Expenses</h3>
            <p className="amount expense">₱{totalExpenses.toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h3>Total Savings</h3>
            <p className="amount savings">₱{totalSavings.toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h3>Net Income</h3>
            <p className="amount net">₱{netIncome.toFixed(2)}</p>
          </div>
        </div>
        <div>
          <WalletSummary wallets={wallets} incomes={incomes} expenses={expenses} />
        </div>

        {/* Income and Expense Breakdown (only visible on Dashboard) */}
        {viewMode === 'dashboard' && (
          <div className="breakdown-section">
            <div className="breakdown-container">
              <div className="income-breakdown">
                <h4>Recent Income</h4>
                <div className="breakdown-list">
                  {filteredIncomes.slice(0, 1).map((income, index) => (
                    <div key={income.id || index} className="breakdown-row income-row">
                      <span className="breakdown-label">{income.source}</span>
                      <span className="breakdown-value">₱{parseFloat(income.amount).toFixed(2)}</span>
                    </div>
                  ))}
                  {filteredIncomes.length === 0 && (
                    <div className="breakdown-row empty-row">No income entries yet</div>
                  )}
                </div>
                <div className="breakdown-form">
                  <IncomeForm
                    onAddIncome={addIncome}
                    editingIncome={editingIncome}
                    onUpdateIncome={updateIncome}
                    onCancelEdit={() => setEditingIncome(null)}
                    wallets={walletBalances}
                  />
                </div>
              </div>

              <div className="expense-breakdown">
                <h4>Recent Expenses</h4>
                <div className="breakdown-list">
                  {filteredExpenses.slice(0, 1).map((expense, index) => (
                    <div key={expense.id || index} className="breakdown-row expense-row">
                      <span className="breakdown-label">{expense.description}</span>
                      <span className="breakdown-value">₱{parseFloat(expense.amount).toFixed(2)}</span>
                    </div>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <div className="breakdown-row empty-row">No expense entries yet</div>
                  )}
                </div>
                <div className="breakdown-form">
                  <ExpenseForm
                    onAddExpense={addExpense}
                    editingExpense={editingExpense}
                    onUpdateExpense={updateExpense}
                    onCancelEdit={() => setEditingExpense(null)}
                    categories={categories}
                    wallets={walletBalances}
                  />
                </div>
              </div>
            </div>
          </div>
        )}





        <div className="main-content">
          <div className="section">
            {viewMode === 'tables-compact' && (
              <div className="tables-full">
                <h2>Tables</h2>
                <TablesCompact />
              </div>
            )}

            {viewMode === 'lendings' && (
              <Lendings />
            )}

            {viewMode === 'savings' && (
              <SavingsPage />
            )}

            {/* wallets view removed - managed within Categories */}

            {viewMode === 'categories' && (
              <CategoriesPage />
            )}

            {viewMode === 'breakdown' && (
              <ExpenseBreakdown expensesByCategory={expensesByCategory} />
            )}
          </div>
        </div>

      {/* Quick actions removed */}
    </div>
    </div>
  )
}

export default App;