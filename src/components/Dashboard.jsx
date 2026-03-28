import { useMemo } from 'react'
import {
  ActivityIcon,
  ChartIcon,
  ExpenseIcon,
  IncomeIcon,
  TrendUpIcon,
  WalletIcon
} from './Icons'
import '../MobileApp.css'

function Dashboard({ 
  totalIncome, 
  totalExpenses, 
  netIncome, 
  totalSavings,
  walletBalances,
  savings,
  filteredIncomes,
  filteredExpenses,
  transfers,
  expensesByCategory,
  selectedMonth,
  selectedYear
}) {
  const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Get recent transactions (incomes, expenses, transfers)
  const recentTransactions = useMemo(() => {
    const transactions = [
      ...filteredIncomes.map(i => ({ ...i, type: 'income', date: i.date })),
      ...filteredExpenses.map(e => ({ ...e, type: 'expense', date: e.date })),
      ...transfers.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
      }).map(t => ({ ...t, type: 'transfer', date: t.date }))
    ]
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  }, [filteredIncomes, filteredExpenses, transfers, selectedMonth, selectedYear])

  const totalBalance = useMemo(() => 
    walletBalances.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0),
    [walletBalances]
  )

  const featuredSavingsGoals = useMemo(() => {
    return [...(savings || [])]
      .map((goal) => {
        const current = parseFloat(goal.currentAmount || 0)
        const target = parseFloat(goal.targetAmount || 0)
        const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0

        return {
          ...goal,
          current,
          target,
          progress
        }
      })
      .sort((a, b) => {
        if (b.progress !== a.progress) return b.progress - a.progress
        return b.current - a.current
      })
      .slice(0, 3)
  }, [savings])

  const getWalletName = (walletId) => {
    const wallet = walletBalances.find(w => w.id === walletId)
    return wallet ? wallet.name : 'Unknown'
  }

  const expenseCoverage = totalIncome > 0
    ? Math.min((totalExpenses / totalIncome) * 100, 999)
    : 0

  const topCategory = expensesByCategory
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total)[0]

  return (
    <div className="mobile-content">
      <section className="atelier-hero card">
        <div className="atelier-hero-copy">
          <span className="eyebrow">Private Ledger</span>
          <h2 className="atelier-hero-title">{monthName}</h2>
          <p className="atelier-hero-text">
            A composed view of cash position, spending pace, and account liquidity.
          </p>
        </div>
        <div className="atelier-hero-metrics">
          <div className="atelier-metric-chip">
            <span>Expense Load</span>
            <strong>{expenseCoverage.toFixed(0)}%</strong>
          </div>
          <div className="atelier-metric-chip">
            <span>Top Category</span>
            <strong>{topCategory?.category || 'None yet'}</strong>
          </div>
        </div>
      </section>

      <div className="balance-grid">
        <div className="balance-card">
          <div className="balance-label"><WalletIcon size={14} /> Total Balance</div>
          <div className="balance-amount"><span className="currency-mark">₱</span>{totalBalance.toFixed(2)}</div>
          <div className="balance-change">{walletBalances.length} accounts</div>
        </div>

        <div className="balance-card income">
          <div className="balance-label"><IncomeIcon size={14} /> Income</div>
          <div className="balance-amount"><span className="currency-mark">₱</span>{totalIncome.toFixed(2)}</div>
          <div className="balance-change">{monthName}</div>
        </div>

        <div className="balance-card expense">
          <div className="balance-label"><ExpenseIcon size={14} /> Expenses</div>
          <div className="balance-amount"><span className="currency-mark">₱</span>{totalExpenses.toFixed(2)}</div>
          <div className="balance-change">{monthName}</div>
        </div>

        <div className="balance-card net">
          <div className="balance-label"><ChartIcon size={14} /> Net</div>
          <div className="balance-amount"><span className="currency-mark">₱</span>{netIncome.toFixed(2)}</div>
          <div className={`balance-change value-chip ${netIncome >= 0 ? 'positive' : 'negative'}`}>
            {netIncome >= 0 ? 'Surplus' : 'Deficit'}
          </div>
        </div>
      </div>

      {/* Accounts Overview */}
      {walletBalances.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><WalletIcon size={18} /> Accounts</h3>
            <span className="card-subtitle">{walletBalances.length} total</span>
          </div>
          <div className="account-grid">
            {walletBalances.slice(0, 6).map((wallet) => (
              <div
                key={wallet.id} 
                className={`account-card ${wallet.name.toLowerCase().includes('cash') ? 'cash' : wallet.name.toLowerCase().includes('bank') ? 'bank' : 'credit'}`}
              >
                <div className="account-card-meta">
                  <div className="account-name">{wallet.name}</div>
                  <div className="account-pill">{wallet.balance >= 0 ? 'Liquid' : 'Overdrawn'}</div>
                </div>
                <div className="account-balance"><span className="currency-mark">₱</span>{parseFloat(wallet.balance || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><ActivityIcon size={18} /> Recent Activity</h3>
            <span className="card-subtitle">Last 5</span>
          </div>
          <div className="transaction-list">
            {recentTransactions.map((transaction, index) => (
              <div key={`${transaction.type}-${transaction.id || index}`} className="transaction-item">
                <div className={`transaction-icon ${transaction.type}`}>
                  {transaction.type === 'income' ? <IncomeIcon size={20} /> : transaction.type === 'expense' ? <ExpenseIcon size={20} /> : <ActivityIcon size={20} />}
                </div>
                <div className="transaction-details">
                  <div className="transaction-title">
                    {transaction.type === 'income' 
                      ? transaction.source 
                      : transaction.type === 'expense' 
                      ? transaction.description 
                      : `${getWalletName(transaction.fromWalletId)} → ${getWalletName(transaction.toWalletId)}`
                    }
                  </div>
                  <div className="transaction-subtitle">
                    {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {transaction.category && ` • ${transaction.category}`}
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                  <span className="currency-mark">₱</span>{parseFloat(transaction.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {savings.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><TrendUpIcon size={18} /> Savings Goals</h3>
            <span className="card-subtitle"><span className="currency-mark">₱</span>{totalSavings.toFixed(2)} reserved</span>
          </div>
          <div className="savings-goals-list">
            {featuredSavingsGoals.map((goal) => (
              <div key={goal.id} className="savings-goal-card">
                <div className="savings-goal-header">
                  <div>
                    <div className="savings-goal-name">{goal.goal}</div>
                    <div className="savings-goal-meta">
                      <span className="currency-mark">₱</span>{goal.current.toFixed(2)} of <span className="currency-mark">₱</span>{goal.target.toFixed(2)}
                    </div>
                  </div>
                  <div className="savings-goal-percent">{goal.progress.toFixed(0)}%</div>
                </div>
                <div className="savings-goal-track">
                  <div className="savings-goal-fill" style={{ width: `${goal.progress}%` }} />
                </div>
                <div className="savings-goal-footer">
                  <span>{goal.targetDate ? `Target ${new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Open timeline'}</span>
                  <span><span className="currency-mark">₱</span>{Math.max(goal.target - goal.current, 0).toFixed(2)} left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending by Category */}
      {expensesByCategory.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><ChartIcon size={18} /> Spending by Category</h3>
            <span className="card-subtitle">{monthName}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expensesByCategory.slice(0, 5).map((cat, index) => (
              <div key={index} className="category-row">
                <div className="category-row-meta">
                  <span className="category-row-title">
                    {cat.category || 'Uncategorized'}
                  </span>
                  <span className="category-row-amount">
                    <span className="currency-mark">₱</span>{cat.total.toFixed(2)} ({cat.percentage}%)
                  </span>
                </div>
                <div className="category-track">
                  <div
                    className="category-fill"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentTransactions.length === 0 && walletBalances.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><WalletIcon size={56} /></div>
          <div className="empty-state-title">Welcome to Pitaka!</div>
          <div className="empty-state-description">
            Get started by adding a wallet and recording your first transaction
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
