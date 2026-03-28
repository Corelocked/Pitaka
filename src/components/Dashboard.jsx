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
import { DEFAULT_CURRENCY, formatCurrency, formatCurrencySummary, getWalletCurrency, summarizeByCurrency } from '../utils/currency'

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
  selectedYear,
  layoutPreference = 'editorial'
}) {
  const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const recentTransactions = useMemo(() => {
    const transactions = [
      ...filteredIncomes.map((income) => ({ ...income, type: 'income', date: income.date })),
      ...filteredExpenses.map((expense) => ({ ...expense, type: 'expense', date: expense.date })),
      ...transfers
        .filter((transfer) => {
          const date = new Date(transfer.date)
          return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
        })
        .map((transfer) => ({ ...transfer, type: 'transfer', date: transfer.date }))
    ]

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  }, [filteredIncomes, filteredExpenses, transfers, selectedMonth, selectedYear])

  const walletSummary = useMemo(
    () => summarizeByCurrency(walletBalances, (wallet) => wallet.balance || 0, (wallet) => getWalletCurrency(wallet)),
    [walletBalances]
  )
  const incomeSummary = useMemo(
    () => summarizeByCurrency(filteredIncomes, (income) => income.amount || 0, (income) => income.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === income.walletId)) || DEFAULT_CURRENCY),
    [filteredIncomes, walletBalances]
  )
  const expenseSummary = useMemo(
    () => summarizeByCurrency(filteredExpenses, (expense) => expense.amount || 0, (expense) => expense.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === expense.walletId)) || DEFAULT_CURRENCY),
    [filteredExpenses, walletBalances]
  )
  const savingsSummary = useMemo(
    () => summarizeByCurrency(savings, (goal) => goal.currentAmount || 0, (goal) => goal.currency || DEFAULT_CURRENCY),
    [savings]
  )

  const totalBalanceLabel = formatCurrencySummary(walletSummary)
  const totalIncomeLabel = formatCurrencySummary(incomeSummary)
  const totalExpensesLabel = formatCurrencySummary(expenseSummary)
  const totalSavingsLabel = formatCurrencySummary(savingsSummary)
  const hasMixedExpenseCurrencies = expenseSummary.length > 1
  const hasMixedIncomeCurrencies = incomeSummary.length > 1
  const hasMixedSavingsCurrencies = savingsSummary.length > 1
  const comparableIncomeAndExpense = incomeSummary.length === 1 && expenseSummary.length === 1 && incomeSummary[0].currency === expenseSummary[0].currency
  const comparableExpenseAndSavings = expenseSummary.length === 1 && savingsSummary.length === 1 && expenseSummary[0].currency === savingsSummary[0].currency

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
    const wallet = walletBalances.find((entry) => entry.id === walletId)
    return wallet ? wallet.name : 'Unknown'
  }

  const expenseCoverage = totalIncome > 0
    ? Math.min((totalExpenses / totalIncome) * 100, 999)
    : 0

  const topCategory = expensesByCategory
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total)[0]

  const savingsCoverage = totalExpenses > 0
    ? Math.min((totalSavings / totalExpenses) * 100, 999)
    : 0

  const netLabel = netIncome >= 0 ? 'Surplus' : 'Deficit'
  const netSummary = useMemo(
    () => summarizeByCurrency(
      [...filteredIncomes, ...filteredExpenses],
      (entry) => {
        const amount = parseFloat(entry.amount || 0)
        return filteredIncomes.includes(entry) ? amount : -amount
      },
      (entry) => entry.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === entry.walletId)) || DEFAULT_CURRENCY
    ),
    [filteredIncomes, filteredExpenses, walletBalances]
  )
  const netIncomeLabel = formatCurrencySummary(netSummary)
  const spendingRows = useMemo(() => {
    if (!hasMixedExpenseCurrencies) {
      return expensesByCategory.slice(0, 5).map((category) => ({
        key: category.category || 'Uncategorized',
        name: category.category || 'Uncategorized',
        amountLabel: `${formatCurrency(category.total, expenseSummary[0]?.currency || DEFAULT_CURRENCY)} (${category.percentage}%)`,
        percentage: Number(category.percentage || 0),
        showTrack: true
      }))
    }

    const grouped = new Map()

    filteredExpenses.forEach((expense) => {
      const key = expense.category || 'Uncategorized'
      const current = grouped.get(key) || []
      current.push(expense)
      grouped.set(key, current)
    })

    return Array.from(grouped.entries())
      .map(([name, entries]) => ({
        key: name,
        name,
        amountLabel: formatCurrencySummary(
          summarizeByCurrency(
            entries,
            (expense) => expense.amount || 0,
            (expense) => expense.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === expense.walletId)) || DEFAULT_CURRENCY
          )
        ),
        percentage: 0,
        showTrack: false,
        count: entries.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [expensesByCategory, expenseSummary, filteredExpenses, hasMixedExpenseCurrencies, walletBalances])

  const metricCards = (
    <section className="balance-grid dashboard-metrics-grid">
      <div className="balance-card dashboard-balance-feature">
        <div className="balance-label"><WalletIcon size={14} /> Total Balance</div>
        <div className="balance-amount balance-amount--string">{totalBalanceLabel}</div>
        <div className="balance-change">{walletBalances.length} accounts</div>
      </div>

      <div className="dashboard-stat-column">
        <div className="balance-card income">
          <div className="balance-label"><IncomeIcon size={14} /> Income</div>
          <div className="balance-amount balance-amount--string">{totalIncomeLabel}</div>
          <div className="balance-change">{monthName}</div>
        </div>

        <div className="balance-card expense">
          <div className="balance-label"><ExpenseIcon size={14} /> Expenses</div>
          <div className="balance-amount balance-amount--string">{totalExpensesLabel}</div>
          <div className="balance-change">{monthName}</div>
        </div>
      </div>

      <div className="card dashboard-insight-panel">
        <div className="dashboard-insight-item">
          <span className="dashboard-kicker">Net Position</span>
            <div className="dashboard-insight-value">{netIncomeLabel}</div>
            <div className={`balance-change value-chip ${netIncome >= 0 ? 'positive' : 'negative'}`}>
              {netLabel}
          </div>
        </div>

        <div className="dashboard-insight-item">
          <span className="dashboard-kicker">Funds Reserved</span>
          <div className="dashboard-insight-value">
            {totalSavingsLabel}
          </div>
          <div className="dashboard-insight-note">
            {savings.length} active goal{savings.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </section>
  )

  const recentActivityCard = recentTransactions.length > 0 ? (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title"><ActivityIcon size={18} /> Recent Activity</h3>
        <span className="card-subtitle">Last 5 movements</span>
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
                    : `${getWalletName(transaction.fromWalletId)} → ${getWalletName(transaction.toWalletId)}`}
              </div>
              <div className="transaction-subtitle">
                {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {transaction.category && ` • ${transaction.category}`}
              </div>
            </div>
            <div className={`transaction-amount ${transaction.type}`}>
              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
              {formatCurrency(
                parseFloat(transaction.amount),
                transaction.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === transaction.walletId || wallet.id === transaction.fromWalletId)) || DEFAULT_CURRENCY
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null

  const spendingCard = expensesByCategory.length > 0 ? (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title"><ChartIcon size={18} /> Spending by Category</h3>
        <span className="card-subtitle">{monthName}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {spendingRows.map((category) => (
          <div key={category.key} className="category-row">
            <div className="category-row-meta">
              <span className="category-row-title">
                {category.name}
              </span>
              <span className="category-row-amount">
                {category.amountLabel}
              </span>
            </div>
            {category.showTrack && (
              <div className="category-track">
                <div
                  className="category-fill"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            )}
          </div>
        ))}
        {hasMixedExpenseCurrencies && (
          <div className="card-subtitle">
            Category comparison is shown as grouped currency totals because this period includes multiple currencies.
          </div>
        )}
      </div>
    </div>
  ) : null

  const accountsCard = walletBalances.length > 0 ? (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title"><WalletIcon size={18} /> Accounts</h3>
        <span className="card-subtitle">{walletBalances.length} total</span>
      </div>
      <div className="account-grid dashboard-account-grid">
        {walletBalances.slice(0, 6).map((wallet) => (
          <div
            key={wallet.id}
            className={`account-card ${wallet.name.toLowerCase().includes('cash') ? 'cash' : wallet.name.toLowerCase().includes('bank') ? 'bank' : 'credit'}`}
          >
            <div className="account-card-meta">
              <div className="account-name">{wallet.name}</div>
              <div className="account-pill">{wallet.balance >= 0 ? 'Liquid' : 'Overdrawn'}</div>
            </div>
            <div className="account-balance">{formatCurrency(parseFloat(wallet.balance || 0), getWalletCurrency(wallet))}</div>
          </div>
        ))}
      </div>
    </div>
  ) : null

  const savingsCard = savings.length > 0 ? (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title"><TrendUpIcon size={18} /> Savings Goals</h3>
        <span className="card-subtitle">{totalSavingsLabel} reserved</span>
      </div>
      <div className="savings-goals-list">
        {featuredSavingsGoals.map((goal) => (
          <div key={goal.id} className="savings-goal-card">
            <div className="savings-goal-header">
              <div>
                <div className="savings-goal-name">{goal.goal}</div>
                <div className="savings-goal-meta">
                  {formatCurrency(goal.current, goal.currency || DEFAULT_CURRENCY)} of {formatCurrency(goal.target, goal.currency || DEFAULT_CURRENCY)}
                </div>
              </div>
              <div className="savings-goal-percent">{goal.progress.toFixed(0)}%</div>
            </div>
            <div className="savings-goal-track">
              <div className="savings-goal-fill" style={{ width: `${goal.progress}%` }} />
            </div>
            <div className="savings-goal-footer">
              <span>{goal.targetDate ? `Target ${new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Open timeline'}</span>
              <span>{formatCurrency(Math.max(goal.target - goal.current, 0), goal.currency || DEFAULT_CURRENCY)} left</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null

  const layoutSections = {
    editorial: {
      main: [
        { id: 'recent-activity', node: recentActivityCard },
        { id: 'spending', node: spendingCard }
      ],
      side: [
        { id: 'accounts', node: accountsCard },
        { id: 'savings', node: savingsCard }
      ]
    },
    compact: {
      main: [
        { id: 'recent-activity', node: recentActivityCard },
        { id: 'accounts', node: accountsCard }
      ],
      side: [
        { id: 'spending', node: spendingCard },
        { id: 'savings', node: savingsCard }
      ]
    },
    planner: {
      main: [
        { id: 'savings', node: savingsCard },
        { id: 'spending', node: spendingCard }
      ],
      side: [
        { id: 'accounts', node: accountsCard },
        { id: 'recent-activity', node: recentActivityCard }
      ]
    }
  }

  const activeLayout = layoutSections[layoutPreference] || layoutSections.editorial

  return (
    <div className="mobile-content">
      <div className={`dashboard-layout dashboard-layout--${layoutPreference}`}>
        <section className="atelier-hero card dashboard-hero">
          <div className="dashboard-hero-main">
            <div className="atelier-hero-copy">
              <span className="eyebrow">Private Ledger</span>
              <h2 className="atelier-hero-title">{monthName}</h2>
              <p className="atelier-hero-text">
                A composed briefing on liquidity, spending pressure, and capital reserved for future goals.
              </p>
            </div>

            <div className="dashboard-hero-total">
              <span className="dashboard-kicker">Portfolio Balance</span>
              <div className="dashboard-total-amount">{totalBalanceLabel}</div>
              <div className="dashboard-total-meta">{walletBalances.length} accounts under watch</div>
            </div>
          </div>

          <div className="dashboard-hero-rail">
            <div className="atelier-metric-chip dashboard-rail-chip">
              <span>Expense Load</span>
              <strong>{comparableIncomeAndExpense ? `${expenseCoverage.toFixed(0)}%` : hasMixedIncomeCurrencies || hasMixedExpenseCurrencies ? 'Mixed' : '0%'}</strong>
            </div>
            <div className="atelier-metric-chip dashboard-rail-chip">
              <span>Top Category</span>
              <strong>{hasMixedExpenseCurrencies ? 'Mixed currencies' : topCategory?.category || 'None yet'}</strong>
            </div>
            <div className="atelier-metric-chip dashboard-rail-chip">
              <span>Savings Buffer</span>
              <strong>{comparableExpenseAndSavings ? `${savingsCoverage.toFixed(0)}%` : hasMixedExpenseCurrencies || hasMixedSavingsCurrencies ? 'Mixed' : '0%'}</strong>
            </div>
          </div>
        </section>

        {metricCards}

        <section className={`dashboard-content-grid dashboard-content-grid--${layoutPreference}`}>
          <div className="dashboard-main-column">
            {activeLayout.main
              .filter((section) => Boolean(section.node))
              .map((section) => (
                <div key={section.id}>
                  {section.node}
                </div>
              ))}
          </div>

          <aside className="dashboard-side-column">
            {activeLayout.side
              .filter((section) => Boolean(section.node))
              .map((section) => (
                <div key={section.id}>
                  {section.node}
                </div>
              ))}
          </aside>
        </section>

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
    </div>
  )
}

export default Dashboard
