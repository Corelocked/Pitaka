import { useEffect, useMemo, useRef, useState } from 'react'
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
import { getLocalDateInputValue } from '../utils/date'

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
  subscriptions = [],
  expensesByCategory,
  selectedMonth,
  selectedYear,
  isPro = false,
  layoutPreference = 'editorial',
  customization,
  isMobileEditMode = false,
  isDesktopEditMode = false,
  onMoveMobileWidget,
  onMoveDesktopTile,
  onResizeDesktopTile
}) {
  const [draggedTileId, setDraggedTileId] = useState(null)
  const [draggedMobileWidgetId, setDraggedMobileWidgetId] = useState(null)
  const [mobileDropTargetId, setMobileDropTargetId] = useState(null)
  const [mobileDropEdge, setMobileDropEdge] = useState('before')
  const [mobileDragPreview, setMobileDragPreview] = useState(null)
  const draggedMobileWidgetIdRef = useRef(null)
  const mobileAutoScrollFrameRef = useRef(null)
  const mobileAutoScrollVelocityRef = useRef(0)
  const mobileTouchPointRef = useRef({ x: 0, y: 0 })
  const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  useEffect(() => {
    draggedMobileWidgetIdRef.current = draggedMobileWidgetId
  }, [draggedMobileWidgetId])

  useEffect(() => {
    if (!draggedMobileWidgetId) return undefined

    const handleWindowTouchMove = (event) => {
      if (event.cancelable) {
        event.preventDefault()
      }
    }

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false })

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove)
    }
  }, [draggedMobileWidgetId])

  useEffect(() => {
    return () => {
      if (mobileAutoScrollFrameRef.current) {
        window.cancelAnimationFrame(mobileAutoScrollFrameRef.current)
      }
    }
  }, [])

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
  }, [filteredExpenses, filteredIncomes, transfers, selectedMonth, selectedYear])

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

  const upcomingBills = useMemo(() => {
    const normalizeDateKey = (dateValue) => {
      if (!dateValue) return null
      const date = new Date(`${dateValue}T00:00:00`)
      if (Number.isNaN(date.getTime())) return null
      return getLocalDateInputValue(date)
    }

    const addDays = (dateString, days) => {
      const date = new Date(`${dateString}T00:00:00`)
      if (Number.isNaN(date.getTime())) return null
      date.setDate(date.getDate() + days)
      return getLocalDateInputValue(date)
    }

    const addMonths = (dateString, months) => {
      const source = new Date(`${dateString}T00:00:00`)
      if (Number.isNaN(source.getTime())) return null

      const target = new Date(source)
      const day = target.getDate()
      target.setDate(1)
      target.setMonth(target.getMonth() + months)
      const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
      target.setDate(Math.min(day, lastDay))
      return getLocalDateInputValue(target)
    }

    const nextSubscriptionDate = (subscription, currentDate) => {
      switch (subscription.intervalType) {
        case 'weekly':
          return addDays(currentDate, 7)
        case 'yearly':
          return addMonths(currentDate, 12)
        case 'custom':
          return addDays(currentDate, Math.max(parseInt(subscription.customIntervalDays || 0, 10), 1))
        case 'monthly':
        default:
          return addMonths(currentDate, 1)
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = getLocalDateInputValue(today)

    return subscriptions
      .filter((subscription) => subscription?.id && subscription.isActive !== false)
      .map((subscription) => {
        let dueDate = normalizeDateKey(subscription.nextDueDate || subscription.nextRunDate || subscription.startDate)

        if (!dueDate) return null

        while (dueDate && dueDate < todayKey) {
          dueDate = nextSubscriptionDate(subscription, dueDate)
        }

        if (!dueDate) return null

        const due = new Date(dueDate)
        if (Number.isNaN(due.getTime())) return null

        const dayDiff = Math.round((due.getTime() - today.getTime()) / 86400000)
        const wallet = walletBalances.find((entry) => entry.id === subscription.walletId)

        return {
          id: subscription.id,
          name: subscription.name || 'Recurring bill',
          dueDate,
          dueLabel: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayDiff,
          amountLabel: formatCurrency(parseFloat(subscription.amount || 0), subscription.currency || getWalletCurrency(wallet) || DEFAULT_CURRENCY),
          walletName: wallet?.name || 'No wallet'
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.dayDiff - b.dayDiff || new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
  }, [subscriptions, walletBalances])

  const getWalletName = (walletId) => {
    const wallet = walletBalances.find((entry) => entry.id === walletId)
    return wallet ? wallet.name : 'Unknown'
  }

  const getAccountPillLabel = (wallet) => {
    if (wallet.accountType === 'credit') {
      return wallet.balance >= 0 ? 'Available' : 'Card balance'
    }

    if (wallet.accountType === 'bank') return 'Bank'
    if (wallet.accountType === 'savings') return 'Savings'
    if (wallet.accountType === 'investment') return 'Investments'
    if (wallet.accountType === 'cash') return 'Cash'
    if (wallet.accountType === 'other') return 'Other'

    return wallet.balance >= 0 ? 'Available' : 'Overdrawn'
  }

  const renderWidgetEmptyState = (message = 'No data available yet.') => (
    <div className="dashboard-widget-empty">
      <div className="dashboard-widget-empty-title">No data available</div>
      <div className="dashboard-widget-empty-text">{message}</div>
    </div>
  )
  const renderBreakdownChart = ({ items, totalLabel, emptyMessage }) => {
    if (!items.length) {
      return renderWidgetEmptyState(emptyMessage)
    }

    const segments = items.map((item, index, array) => {
      const start = array.slice(0, index).reduce((sum, entry) => sum + entry.share, 0)
      const end = start + item.share
      return `var(--chart-color-${(index % 5) + 1}) ${(start / 100) * 360}deg ${(end / 100) * 360}deg`
    }).join(', ')

    return (
      <div className="dashboard-breakdown-layout">
        <div className="dashboard-breakdown-chart-wrap">
          <div
            className="dashboard-donut-chart dashboard-breakdown-donut"
            style={{
              background: items.length === 1
                ? 'conic-gradient(var(--chart-color-1) 0deg 360deg)'
                : `conic-gradient(${segments})`
            }}
          >
            <div className="dashboard-donut-center">
              <span>Total</span>
              <strong>{totalLabel}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-chart-legend">
          {items.map((item, index) => (
            <div key={item.id || item.name} className="dashboard-chart-legend-item">
              <div className="dashboard-chart-legend-top">
                <span className={`dashboard-chart-dot dashboard-chart-dot--${(index % 5) + 1}`} />
                <span className="dashboard-chart-legend-name">{item.name}</span>
                <span className="dashboard-chart-legend-share">{item.share.toFixed(0)}%</span>
              </div>
              <div className="dashboard-chart-legend-value">{item.amountLabel}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const focusedTotalIncome = filteredIncomes.reduce((sum, income) => sum + parseFloat(income.amount || 0), 0)
  const focusedTotalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0)
  const focusedNetIncome = focusedTotalIncome - focusedTotalExpenses
  const expenseCoverage = focusedTotalIncome > 0
    ? Math.min((focusedTotalExpenses / focusedTotalIncome) * 100, 999)
    : 0

  const focusedExpensesByCategory = filteredExpenses.reduce((accumulator, expense) => {
    const key = expense.category || 'Uncategorized'
    accumulator.set(key, (accumulator.get(key) || 0) + parseFloat(expense.amount || 0))
    return accumulator
  }, new Map())
  const focusedCategoryRows = Array.from(focusedExpensesByCategory.entries())
    .map(([category, total]) => ({
      category,
      total,
      percentage: focusedTotalExpenses > 0 ? ((total / focusedTotalExpenses) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.total - a.total)
  const topCategory = focusedCategoryRows
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total)[0]

  const savingsCoverage = focusedTotalExpenses > 0
    ? Math.min((totalSavings / focusedTotalExpenses) * 100, 999)
    : 0

  const netLabel = focusedNetIncome >= 0 ? 'Surplus' : 'Deficit'
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
      return focusedCategoryRows.slice(0, 5).map((category) => ({
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
  }, [expenseSummary, focusedCategoryRows, filteredExpenses, hasMixedExpenseCurrencies, walletBalances])

  const cashflowTrendRows = useMemo(() => {
    const weeks = Array.from({ length: 5 }, (_, index) => ({
      id: `week-${index + 1}`,
      label: index === 4 ? 'Week 5+' : `Week ${index + 1}`,
      shortLabel: index === 4 ? 'W5+' : `W${index + 1}`,
      income: 0,
      expenses: 0
    }))

    filteredIncomes.forEach((income) => {
      const date = new Date(income.date)
      const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 7), 4)
      weeks[weekIndex].income += parseFloat(income.amount || 0)
    })

    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date)
      const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 7), 4)
      weeks[weekIndex].expenses += parseFloat(expense.amount || 0)
    })

    const maxAmount = Math.max(
      ...weeks.flatMap((week) => [week.income, week.expenses]),
      0
    )

    return weeks.map((week) => ({
      ...week,
      incomeHeight: maxAmount > 0 ? Math.max((week.income / maxAmount) * 100, week.income > 0 ? 14 : 0) : 0,
      expenseHeight: maxAmount > 0 ? Math.max((week.expenses / maxAmount) * 100, week.expenses > 0 ? 14 : 0) : 0,
      net: week.income - week.expenses
    }))
  }, [filteredExpenses, filteredIncomes])

  const weeklySpendingRows = useMemo(() => {
    const weeklyTotals = [0, 0, 0, 0, 0]

    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date)
      const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 7), 4)
      weeklyTotals[weekIndex] += parseFloat(expense.amount || 0)
    })

    const maxAmount = Math.max(...weeklyTotals, 0)

    return weeklyTotals.map((amount, index) => ({
      id: `week-${index + 1}`,
      label: index === 4 ? 'Week 5+' : `Week ${index + 1}`,
      amount,
      height: maxAmount > 0 ? Math.max((amount / maxAmount) * 100, amount > 0 ? 14 : 0) : 0
    }))
  }, [filteredExpenses])

  const incomeSourceRows = useMemo(() => {
    const grouped = new Map()

    filteredIncomes.forEach((income) => {
      const key = income.source || 'Other'
      const current = grouped.get(key) || []
      current.push(income)
      grouped.set(key, current)
    })

    const rows = Array.from(grouped.entries())
      .map(([name, entries]) => {
        const totals = summarizeByCurrency(
          entries,
          (income) => income.amount || 0,
          (income) => income.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === income.walletId)) || DEFAULT_CURRENCY
        )
        const primaryAmount = entries.reduce((sum, income) => sum + parseFloat(income.amount || 0), 0)

        return {
          id: name,
          name,
          amount: primaryAmount,
          amountLabel: formatCurrencySummary(totals)
        }
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0)

    return rows.map((row) => ({
      ...row,
      share: totalAmount > 0 ? (row.amount / totalAmount) * 100 : 0
    }))
  }, [filteredIncomes, walletBalances])

  const expenseTrendRows = useMemo(() => {
    const rows = [0, 0, 0, 0]

    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date)
      const day = date.getDate()
      const bucketIndex = Math.min(Math.floor((day - 1) / 8), 3)
      rows[bucketIndex] += parseFloat(expense.amount || 0)
    })

    const maxAmount = Math.max(...rows, 0)
    const labels = ['Days 1-8', 'Days 9-16', 'Days 17-24', 'Days 25+']

    return rows.map((amount, index) => ({
      id: labels[index],
      label: labels[index],
      amount,
      height: maxAmount > 0 ? Math.max((amount / maxAmount) * 100, amount > 0 ? 14 : 0) : 0
    }))
  }, [filteredExpenses])

  const accountAllocationRows = useMemo(() => {
    const positiveWallets = walletBalances
      .map((wallet) => ({
        ...wallet,
        amount: Math.max(parseFloat(wallet.balance || 0), 0)
      }))
      .filter((wallet) => wallet.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    const totalPositiveBalance = positiveWallets.reduce((sum, wallet) => sum + wallet.amount, 0)

    return positiveWallets.slice(0, 5).map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      amount: wallet.amount,
      amountLabel: formatCurrency(wallet.amount, getWalletCurrency(wallet)),
      share: totalPositiveBalance > 0 ? (wallet.amount / totalPositiveBalance) * 100 : 0
    }))
  }, [walletBalances])

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
            <div className={`balance-change value-chip ${focusedNetIncome >= 0 ? 'positive' : 'negative'}`}>
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

  const recentActivityCard = (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title"><ActivityIcon size={18} /> Recent Activity</h3>
        <span className="card-subtitle">Last 5 movements</span>
      </div>
      {recentTransactions.length > 0 ? (
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
      ) : renderWidgetEmptyState('Record income, expenses, or transfers to populate recent activity.')}
    </div>
  )

  const spendingCard = (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title"><ChartIcon size={18} /> Spending by Category</h3>
        <span className="card-subtitle">{monthName}</span>
      </div>
      {renderBreakdownChart({
        items: focusedCategoryRows.slice(0, 6).map((category) => ({
          id: category.category,
          name: category.category || 'Uncategorized',
          share: Number(category.percentage || 0),
          amountLabel: formatCurrency(category.total, expenseSummary[0]?.currency || DEFAULT_CURRENCY)
        })),
        totalLabel: totalExpensesLabel,
        emptyMessage: 'Add expense records to see category distribution.'
      })}
      {spendingRows.length > 0 && hasMixedExpenseCurrencies && (
        <div className="card-subtitle">
          Category comparison is shown as grouped currency totals because this period includes multiple currencies.
        </div>
      )}
    </div>
  )

  const accountsCard = (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title"><WalletIcon size={18} /> Accounts</h3>
        </div>
        <span className="card-subtitle">{walletBalances.length} total</span>
      </div>
      {walletBalances.length > 0 ? (
        <div className="account-grid dashboard-account-grid">
          {walletBalances.slice(0, 6).map((wallet) => (
            <div
              key={wallet.id}
              className={`account-card ${wallet.accountType === 'bank' ? 'bank' : wallet.accountType === 'credit' ? 'credit' : 'cash'}`}
            >
              <div className="account-card-meta">
                <div className="account-name">{wallet.name}</div>
                <div className="account-pill">{getAccountPillLabel(wallet)}</div>
              </div>
              <div className="account-balance">{formatCurrency(parseFloat(wallet.balance || 0), getWalletCurrency(wallet))}</div>
            </div>
          ))}
        </div>
      ) : renderWidgetEmptyState('Add a wallet to start tracking account balances.')}
    </div>
  )

  const cashflowChartCard = (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title"><ChartIcon size={18} /> Cashflow Over Time</h3>
          <span className="card-subtitle">{monthName}</span>
        </div>
      </div>
      {cashflowTrendRows.some((row) => row.income > 0 || row.expenses > 0) ? (
        <div className="dashboard-cashflow-trend">
          {cashflowTrendRows.map((row) => (
            <div key={row.id} className="dashboard-cashflow-trend-column">
              <div className="dashboard-cashflow-trend-stage">
                <div
                  className="dashboard-cashflow-trend-bar dashboard-cashflow-trend-bar--income"
                  style={{ height: `${row.incomeHeight}%` }}
                  title={`Income: ${formatCurrency(row.income, incomeSummary[0]?.currency || DEFAULT_CURRENCY)}`}
                />
                <div
                  className="dashboard-cashflow-trend-bar dashboard-cashflow-trend-bar--expense"
                  style={{ height: `${row.expenseHeight}%` }}
                  title={`Expenses: ${formatCurrency(row.expenses, expenseSummary[0]?.currency || DEFAULT_CURRENCY)}`}
                />
              </div>
              <div className="dashboard-cashflow-trend-meta">
                <span className="dashboard-cashflow-label">{row.label}</span>
                <span className="dashboard-cashflow-label-short">{row.shortLabel}</span>
                <span className={`dashboard-cashflow-value ${row.net >= 0 ? 'positive' : 'negative'}`}>
                  {row.net >= 0 ? '+' : ''}{formatCurrency(row.net, incomeSummary[0]?.currency || expenseSummary[0]?.currency || DEFAULT_CURRENCY)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : renderWidgetEmptyState('Record income or expenses to see weekly cashflow.')}
    </div>
  )

  const incomeSourceChartCard = (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title"><IncomeIcon size={18} /> Income by Source</h3>
          <span className="card-subtitle">{monthName}</span>
        </div>
      </div>
      {renderBreakdownChart({
        items: incomeSourceRows.map((row) => ({
          id: row.id,
          name: row.name,
          share: row.share,
          amountLabel: row.amountLabel
        })),
        totalLabel: totalIncomeLabel,
        emptyMessage: 'Add income records to compare sources.'
      })}
      {incomeSourceRows.length > 0 && hasMixedIncomeCurrencies && (
        <div className="card-subtitle">
          Income sources are summarized per source because this month includes multiple currencies.
        </div>
      )}
    </div>
  )

  const weeklySpendingChartCard = (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title"><ExpenseIcon size={18} /> Weekly Spending Trend</h3>
          <span className="card-subtitle">Distribution across {monthName}</span>
        </div>
      </div>
      {weeklySpendingRows.some((row) => row.amount > 0) ? (
        <div className="dashboard-column-chart">
          {weeklySpendingRows.map((row) => (
            <div key={row.id} className="dashboard-column-chart-item">
              <div className="dashboard-column-chart-stage">
                <div
                  className="dashboard-column-chart-bar"
                  style={{ height: `${row.height}%` }}
                />
              </div>
              <div className="dashboard-column-chart-label">{row.label}</div>
              <div className="dashboard-column-chart-value">
                {row.amount > 0 ? formatCurrency(row.amount, expenseSummary[0]?.currency || DEFAULT_CURRENCY) : '0'}
              </div>
            </div>
          ))}
        </div>
      ) : renderWidgetEmptyState('Add expenses to see how spending changes during the month.')}
      {weeklySpendingRows.some((row) => row.amount > 0) && hasMixedExpenseCurrencies && (
        <div className="card-subtitle">
          Weekly totals are shown using the primary expense currency when multiple currencies exist this month.
        </div>
      )}
    </div>
  )

  const expenseTrendChartCard = (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title"><ExpenseIcon size={18} /> Expense Trend</h3>
          <span className="card-subtitle">{monthName}</span>
        </div>
      </div>
      {expenseTrendRows.some((row) => row.amount > 0) ? (
        <div className="dashboard-column-chart dashboard-column-chart--four-up">
          {expenseTrendRows.map((row) => (
            <div key={row.id} className="dashboard-column-chart-item">
              <div className="dashboard-column-chart-stage">
                <div
                  className="dashboard-column-chart-bar"
                  style={{ height: `${row.height}%` }}
                />
              </div>
              <div className="dashboard-column-chart-label">{row.label}</div>
              <div className="dashboard-column-chart-value">
                {row.amount > 0 ? formatCurrency(row.amount, expenseSummary[0]?.currency || DEFAULT_CURRENCY) : '0'}
              </div>
            </div>
          ))}
        </div>
      ) : renderWidgetEmptyState('Add expenses to reveal the month-by-month trend.')}
      {expenseTrendRows.some((row) => row.amount > 0) && hasMixedExpenseCurrencies && (
        <div className="card-subtitle">
          Expense trend uses the primary expense currency for display when multiple currencies are present.
        </div>
      )}
    </div>
  )

  const accountAllocationChartCard = (
    <div className="card">
      <div className="card-header dashboard-card-header--stacked">
        <div>
          <h3 className="card-title"><WalletIcon size={18} /> Account Allocation</h3>
          <span className="card-subtitle">Share of positive balances</span>
        </div>
      </div>
      {accountAllocationRows.length > 0 ? (
        <div className="dashboard-breakdown-layout">
          <div className="dashboard-breakdown-chart-wrap">
            <div
              className="dashboard-donut-chart dashboard-breakdown-donut"
            style={{
              background: accountAllocationRows.length === 1
                ? 'conic-gradient(var(--chart-color-1) 0deg 360deg)'
                : `conic-gradient(${accountAllocationRows.map((row, index, array) => {
                  const start = array.slice(0, index).reduce((sum, entry) => sum + entry.share, 0)
                  const end = start + row.share
                  return `var(--chart-color-${index + 1}) ${(start / 100) * 360}deg ${(end / 100) * 360}deg`
                }).join(', ')})`
            }}
            >
              <div className="dashboard-donut-center">
                <span>Total</span>
                <strong>{totalBalanceLabel}</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-chart-legend">
            {accountAllocationRows.map((row, index) => (
              <div key={row.id} className="dashboard-chart-legend-item">
                <div className="dashboard-chart-legend-top">
                  <span className={`dashboard-chart-dot dashboard-chart-dot--${index + 1}`} />
                  <span className="dashboard-chart-legend-name">{row.name}</span>
                  <span className="dashboard-chart-legend-share">{row.share.toFixed(0)}%</span>
                </div>
                <div className="dashboard-chart-legend-value">{row.amountLabel}</div>
              </div>
            ))}
          </div>
        </div>
      ) : renderWidgetEmptyState('Add funded accounts to see allocation.')}
    </div>
  )

  const savingsCard = (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title"><TrendUpIcon size={18} /> Savings Goals</h3>
        </div>
        <span className="card-subtitle">{totalSavingsLabel} reserved</span>
      </div>
      {featuredSavingsGoals.length > 0 ? (
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
      ) : renderWidgetEmptyState('Create a savings goal to track progress here.')}
    </div>
  )

  const upcomingBillsCard = (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title"><ExpenseIcon size={18} /> Upcoming Bills</h3>
          <span className="card-subtitle">Next subscription charges on deck</span>
        </div>
      </div>
      {upcomingBills.length > 0 ? (
        <div className="transaction-list">
          {upcomingBills.map((bill) => (
            <div key={bill.id} className="transaction-item">
              <div className="transaction-icon expense">
                <ExpenseIcon size={20} />
              </div>
              <div className="transaction-details">
                <div className="transaction-title">{bill.name}</div>
                <div className="transaction-subtitle">
                  {bill.dayDiff === 0 ? 'Due today' : bill.dayDiff === 1 ? 'Due tomorrow' : `Due in ${bill.dayDiff} days`} • {bill.walletName}
                </div>
              </div>
              <div className="dashboard-bill-actions">
                <div className="transaction-amount expense">
                  <div>-{bill.amountLabel}</div>
                  <div className="transaction-subtitle">{bill.dueLabel}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : renderWidgetEmptyState('Add recurring subscriptions to preview the next bills due.')}
    </div>
  )

  const sectionNodes = {
    'recent-activity': recentActivityCard,
    spending: spendingCard,
    accounts: accountsCard,
    savings: savingsCard,
    ...(isPro ? { 'upcoming-bills': upcomingBillsCard } : {}),
    'cashflow-chart': cashflowChartCard,
    'income-source-chart': incomeSourceChartCard,
    'weekly-spending-chart': weeklySpendingChartCard,
    'expense-trend-chart': expenseTrendChartCard,
    'account-allocation-chart': accountAllocationChartCard
  }
  const sectionLabels = {
    'recent-activity': 'Recent Activity',
    spending: 'Spending Overview',
    accounts: 'Accounts',
    savings: 'Savings Goals',
    ...(isPro ? { 'upcoming-bills': 'Upcoming Bills' } : {}),
    'cashflow-chart': 'Cashflow Trend',
    'income-source-chart': 'Income Sources',
    'weekly-spending-chart': 'Weekly Spending',
    'expense-trend-chart': 'Expense Trend',
    'account-allocation-chart': 'Account Allocation'
  }
  const hiddenSectionIds = customization?.hiddenSectionIds || []
  const mainSections = (customization?.mainOrder || [])
    .filter((sectionId) => !hiddenSectionIds.includes(sectionId))
    .map((sectionId) => ({ id: sectionId, node: sectionNodes[sectionId] }))
    .filter((section) => Boolean(section.node))
  const sideSections = (customization?.sideOrder || [])
    .filter((sectionId) => !hiddenSectionIds.includes(sectionId))
    .map((sectionId) => ({ id: sectionId, node: sectionNodes[sectionId] }))
    .filter((section) => Boolean(section.node))
  const shouldShowHero = customization?.showHero !== false
  const shouldShowMetrics = customization?.showMetrics !== false
  const hasVisibleSections = mainSections.length > 0 || sideSections.length > 0
  const contentGridClassName = [
    'dashboard-content-grid',
    `dashboard-content-grid--${layoutPreference}`,
    mainSections.length === 0 ? 'dashboard-content-grid--main-empty' : '',
    sideSections.length === 0 ? 'dashboard-content-grid--side-empty' : '',
    mainSections.length > 0 && sideSections.length > 0 ? 'dashboard-content-grid--split' : 'dashboard-content-grid--single'
  ].filter(Boolean).join(' ')
  const mainColumnClassName = [
    'dashboard-main-column',
    sideSections.length === 0 ? 'dashboard-main-column--full' : ''
  ].filter(Boolean).join(' ')
  const sideColumnClassName = [
    'dashboard-side-column',
    mainSections.length === 0 ? 'dashboard-side-column--full' : ''
  ].filter(Boolean).join(' ')
  const mobileSections = (customization?.mobileWidgetOrder || [])
    .filter((sectionId) => !hiddenSectionIds.includes(sectionId))
    .map((sectionId) => ({ id: sectionId, label: sectionLabels[sectionId] || 'Dashboard Card', node: sectionNodes[sectionId] }))
    .filter((section) => Boolean(section.node))
  const desktopTileSections = (customization?.desktopTileOrder || [])
    .filter((sectionId) => !hiddenSectionIds.includes(sectionId))
    .map((sectionId) => ({
      id: sectionId,
      node: sectionNodes[sectionId],
      tileSize: customization?.desktopTileSizes?.[sectionId] || 'medium'
    }))
    .filter((section) => Boolean(section.node))
  const desktopTileLayout = useMemo(() => {
    const rows = []
    let currentRow = []
    let currentWidth = 0

    const getBaseSpan = (size) => {
      if (size === 'small') return 2
      if (size === 'large') return 6
      return 3
    }

    const pushRow = () => {
      if (currentRow.length === 0) return

      const normalizedRow = currentRow.map((item) => ({
        ...item,
        effectiveSize: item.tileSize
      }))

      if (
        normalizedRow.length === 2 &&
        normalizedRow.some((item) => item.tileSize === 'medium') &&
        normalizedRow.some((item) => item.tileSize === 'small')
      ) {
        normalizedRow.forEach((item) => {
          if (item.tileSize === 'small') {
            item.effectiveSize = 'small-fill'
          }
        })
      }

      rows.push(...normalizedRow)
      currentRow = []
      currentWidth = 0
    }

    desktopTileSections.forEach((section) => {
      const span = getBaseSpan(section.tileSize)
      if (currentWidth + span > 6) {
        pushRow()
      }

      currentRow.push(section)
      currentWidth += span

      if (currentWidth >= 6) {
        pushRow()
      }
    })

    pushRow()
    return rows
  }, [desktopTileSections])
  const clearMobileDragState = () => {
    if (mobileAutoScrollFrameRef.current) {
      window.cancelAnimationFrame(mobileAutoScrollFrameRef.current)
      mobileAutoScrollFrameRef.current = null
    }
    mobileAutoScrollVelocityRef.current = 0
    setDraggedMobileWidgetId(null)
    setMobileDropTargetId(null)
    setMobileDropEdge('before')
    setMobileDragPreview(null)
  }

  const stepMobileAutoScroll = () => {
    const velocity = mobileAutoScrollVelocityRef.current
    if (!velocity) {
      mobileAutoScrollFrameRef.current = null
      return
    }

    window.scrollBy(0, velocity)
    resolveMobileDropState(mobileTouchPointRef.current.x, mobileTouchPointRef.current.y)
    mobileAutoScrollFrameRef.current = window.requestAnimationFrame(stepMobileAutoScroll)
  }

  const updateMobileAutoScroll = (clientY) => {
    if (typeof window === 'undefined') return

    const edgeThreshold = Math.min(120, Math.max(window.innerHeight * 0.14, 72))
    const minVelocity = 6
    const maxVelocity = 30
    let nextVelocity = 0

    const getVelocity = (intensity) => {
      const easedIntensity = Math.min(1, Math.max(0, intensity)) ** 1.85
      return Math.round(minVelocity + (easedIntensity * (maxVelocity - minVelocity)))
    }

    if (clientY < edgeThreshold) {
      const intensity = 1 - (clientY / edgeThreshold)
      nextVelocity = -getVelocity(intensity)
    } else if (clientY > window.innerHeight - edgeThreshold) {
      const distanceFromBottom = window.innerHeight - clientY
      const intensity = 1 - (distanceFromBottom / edgeThreshold)
      nextVelocity = getVelocity(intensity)
    }

    mobileAutoScrollVelocityRef.current = nextVelocity

    if (nextVelocity && !mobileAutoScrollFrameRef.current) {
      mobileAutoScrollFrameRef.current = window.requestAnimationFrame(stepMobileAutoScroll)
    }
  }

  const resolveMobileDropState = (clientX, clientY) => {
    const dropTarget = document.elementFromPoint(clientX, clientY)?.closest('[data-mobile-widget-id]')
    const targetId = dropTarget?.getAttribute('data-mobile-widget-id')

    if (!targetId || targetId === draggedMobileWidgetIdRef.current) {
      setMobileDropTargetId(null)
      setMobileDropEdge('before')
      return
    }

    const rect = dropTarget.getBoundingClientRect()
    const edge = clientY >= rect.top + (rect.height / 2) ? 'after' : 'before'
    setMobileDropTargetId(targetId)
    setMobileDropEdge(edge)
  }

  const handleMobileTouchStart = (section) => (event) => {
    if (!isMobileEditMode) return

    const target = event.currentTarget
    const touch = event.touches[0]

    const timer = window.setTimeout(() => {
      setDraggedMobileWidgetId(section.id)
      target.dataset.mobileDragging = 'true'
      mobileTouchPointRef.current = { x: touch.clientX, y: touch.clientY }
      setMobileDragPreview({
        id: section.id,
        label: section.label,
        x: touch.clientX,
        y: touch.clientY
      })
    }, 320)

    target.dataset.mobileDragTimer = String(timer)
    target.dataset.mobileStartX = String(touch.clientX)
    target.dataset.mobileStartY = String(touch.clientY)
  }

  const handleMobileTouchMove = (event) => {
    if (!isMobileEditMode) return

    const target = event.currentTarget
    const timer = Number(target.dataset.mobileDragTimer || 0)
    const startX = Number(target.dataset.mobileStartX || 0)
    const startY = Number(target.dataset.mobileStartY || 0)
    const touch = event.touches[0]

    if (!draggedMobileWidgetId) {
      const moved = Math.abs(touch.clientX - startX) > 10 || Math.abs(touch.clientY - startY) > 10
      if (moved && timer) {
        window.clearTimeout(timer)
        target.dataset.mobileDragTimer = ''
      }
      return
    }

    setMobileDragPreview((current) => (
      current
        ? {
            ...current,
            x: touch.clientX,
            y: touch.clientY
          }
        : current
    ))
    mobileTouchPointRef.current = { x: touch.clientX, y: touch.clientY }
    resolveMobileDropState(touch.clientX, touch.clientY)
    updateMobileAutoScroll(touch.clientY)
  }
  const handleMobileTouchEnd = () => (event) => {
    const target = event.currentTarget
    const timer = Number(target.dataset.mobileDragTimer || 0)
    if (timer) {
      window.clearTimeout(timer)
      target.dataset.mobileDragTimer = ''
    }

    target.dataset.mobileDragging = ''

    if (!isMobileEditMode || !draggedMobileWidgetIdRef.current) {
      return
    }

    const touch = event.changedTouches[0]
    mobileTouchPointRef.current = { x: touch.clientX, y: touch.clientY }
    resolveMobileDropState(touch.clientX, touch.clientY)
    const targetId = mobileDropTargetId || document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-mobile-widget-id]')?.getAttribute('data-mobile-widget-id')
    if (targetId) {
      const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-mobile-widget-id]')
      const rect = dropTarget?.getBoundingClientRect()
      const edge = mobileDropTargetId === targetId
        ? mobileDropEdge
        : rect && touch.clientY >= rect.top + (rect.height / 2)
          ? 'after'
          : 'before'
      onMoveMobileWidget?.(draggedMobileWidgetIdRef.current, targetId, edge)
    }

    clearMobileDragState()
  }

  const handleMobileTouchCancel = () => (event) => {
    const target = event.currentTarget
    const timer = Number(target.dataset.mobileDragTimer || 0)
    if (timer) {
      window.clearTimeout(timer)
      target.dataset.mobileDragTimer = ''
    }

    target.dataset.mobileDragging = ''
    clearMobileDragState()
  }

  return (
    <div className="mobile-content">
      <div className={`dashboard-layout dashboard-layout--${layoutPreference}`}>
        {shouldShowHero && (
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
        )}

        {shouldShowMetrics && metricCards}

        {desktopTileLayout.length > 0 && (
          <section className="dashboard-desktop-editor">
            <section className={`dashboard-desktop-grid ${isDesktopEditMode ? 'is-editing' : ''}`}>
              {desktopTileLayout.map((section) => {
                const tileSize = section.tileSize
                const effectiveSize = section.effectiveSize || tileSize

                return (
                  <article
                    key={section.id}
                    className={`dashboard-desktop-tile dashboard-desktop-tile--${effectiveSize} ${draggedTileId === section.id ? 'is-dragging' : ''}`}
                    draggable={isDesktopEditMode}
                    onDragStart={() => setDraggedTileId(section.id)}
                    onDragEnd={() => setDraggedTileId(null)}
                    onDragOver={(event) => {
                      if (!isDesktopEditMode) return
                      event.preventDefault()
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (!isDesktopEditMode || !draggedTileId) return
                      onMoveDesktopTile?.(draggedTileId, section.id)
                      setDraggedTileId(null)
                    }}
                  >
                    {isDesktopEditMode && (
                      <div className="dashboard-tile-controls">
                        <div className="dashboard-tile-handle">Drag</div>
                        <div className="dashboard-tile-size-group">
                          {[
                            { id: 'small', label: 'S' },
                            { id: 'medium', label: 'M' },
                            { id: 'large', label: 'L' }
                          ].map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              className={`dashboard-tile-size-btn ${tileSize === option.id ? 'active' : ''}`}
                              onClick={() => onResizeDesktopTile?.(section.id, option.id)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {section.node}
                  </article>
                )
              })}
            </section>
          </section>
        )}

        {hasVisibleSections && (
          <section className={`${contentGridClassName} dashboard-mobile-layout`}>
            <div className={`dashboard-mobile-stack ${isMobileEditMode ? 'is-editing' : ''}`}>
              {mobileSections.map((section) => (
                <div
                  key={section.id}
                  data-mobile-widget-id={section.id}
                  className={`dashboard-mobile-widget ${draggedMobileWidgetId === section.id ? 'is-dragging' : ''} ${mobileDropTargetId === section.id ? `is-drop-target is-drop-target-${mobileDropEdge}` : ''}`}
                  onTouchStart={handleMobileTouchStart(section)}
                  onTouchMove={handleMobileTouchMove}
                  onTouchEnd={handleMobileTouchEnd()}
                  onTouchCancel={handleMobileTouchCancel()}
                >
                  {isMobileEditMode && (
                    <div className="dashboard-mobile-widget-handle">Hold and drag</div>
                  )}
                  {section.node}
                </div>
              ))}
            </div>
            {mobileDragPreview && (
              <div
                className="dashboard-mobile-drag-preview"
                aria-hidden="true"
                style={{
                  transform: `translate(${mobileDragPreview.x}px, ${mobileDragPreview.y}px)`
                }}
              >
                <span className="dashboard-mobile-drag-preview-kicker">Moving card</span>
                <strong>{mobileDragPreview.label}</strong>
                <span className="dashboard-mobile-drag-preview-meta">
                  {mobileDropTargetId ? `Drop ${mobileDropEdge === 'after' ? 'after' : 'before'} target` : 'Drag higher or lower to reorder'}
                </span>
              </div>
            )}
          </section>
        )}

        {recentTransactions.length === 0 && walletBalances.length === 0 && !hasVisibleSections && (
          <div className="empty-state">
            <div className="empty-state-icon"><WalletIcon size={56} /></div>
            <div className="empty-state-title">Welcome to Pitaka!</div>
            <div className="empty-state-description">
              Get started by adding a wallet and recording your first transaction
            </div>
          </div>
        )}

        {recentTransactions.length > 0 && walletBalances.length > 0 && !shouldShowHero && !shouldShowMetrics && !hasVisibleSections && (
          <div className="empty-state">
            <div className="empty-state-icon"><WalletIcon size={56} /></div>
            <div className="empty-state-title">Dashboard is fully hidden</div>
            <div className="empty-state-description">
              Open Settings and turn a section back on to rebuild your home view.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
