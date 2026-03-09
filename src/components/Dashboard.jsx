import { useMemo } from 'react'
import {
  ActivityIcon,
  ChartIcon,
  ExpenseIcon,
  IncomeIcon,
  WalletIcon
} from './Icons'
import '../MobileApp.css'

function Dashboard({ 
  totalIncome, 
  totalExpenses, 
  netIncome, 
  walletBalances,
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

  const getWalletName = (walletId) => {
    const wallet = walletBalances.find(w => w.id === walletId)
    return wallet ? wallet.name : 'Unknown'
  }

  return (
    <div className="mobile-content">
      {/* Balance Cards */}
      <div className="balance-grid">
        <div className="balance-card">
          <div className="balance-label"><WalletIcon size={14} /> Total Balance</div>
          <div className="balance-amount">₱{totalBalance.toFixed(2)}</div>
          <div className="balance-change">{walletBalances.length} accounts</div>
        </div>

        <div className="balance-card income">
          <div className="balance-label"><IncomeIcon size={14} /> Income</div>
          <div className="balance-amount">₱{totalIncome.toFixed(2)}</div>
          <div className="balance-change">{monthName}</div>
        </div>

        <div className="balance-card expense">
          <div className="balance-label"><ExpenseIcon size={14} /> Expenses</div>
          <div className="balance-amount">₱{totalExpenses.toFixed(2)}</div>
          <div className="balance-change">{monthName}</div>
        </div>

        <div className="balance-card net">
          <div className="balance-label"><ChartIcon size={14} /> Net</div>
          <div className="balance-amount">₱{netIncome.toFixed(2)}</div>
          <div className="balance-change">
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
                <div className="account-name">{wallet.name}</div>
                <div className="account-balance">₱{parseFloat(wallet.balance || 0).toFixed(2)}</div>
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
                  ₱{parseFloat(transaction.amount).toFixed(2)}
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
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {cat.category || 'Uncategorized'}
                  </span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>
                    ₱{cat.total.toFixed(2)} ({cat.percentage}%)
                  </span>
                </div>
                <div style={{ 
                  height: '8px', 
                  background: '#f1f5f9', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                    width: `${cat.percentage}%`,
                    transition: 'width 0.3s ease'
                  }} />
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
          <div className="empty-state-title">Welcome to Budget Book!</div>
          <div className="empty-state-description">
            Get started by adding a wallet and recording your first transaction
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
