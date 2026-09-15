import { useMemo } from 'react'
import {
  ActivityIcon,
  ChartIcon,
  ExpenseIcon,
  IncomeIcon,
  TrendUpIcon,
  WalletIcon
} from './Icons'
import { DEFAULT_CURRENCY, formatCurrency, formatCurrencySummary, getWalletCurrency, summarizeByCurrency } from '../utils/currency'
import { getLocalDateInputValue } from '../utils/date'
import { buildFinanceInsights } from '../utils/financeInsights'
import { buildSavingsPlan } from '../utils/savingsPlan'

function Dashboard({
  totalSavings,
  walletBalances,
  savings,
  filteredIncomes,
  filteredExpenses,
  transfers,
  subscriptions = [],
  recurringIncomes = [],
  netWorthSnapshots = [],
  categoryBudgets = [],
  selectedMonth,
  selectedYear,
  isPro = false,
  preset,
  presets = [],
  onPresetChange
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
  const primaryCurrency = walletSummary.length === 1 ? walletSummary[0].currency : incomeSummary[0]?.currency || expenseSummary[0]?.currency || DEFAULT_CURRENCY

  const featuredSavingsGoals = useMemo(() => {
    return [...(savings || [])]
      .map((goal) => {
        const plan = buildSavingsPlan(goal)

        return {
          ...goal,
          ...plan
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
        const amount = parseFloat(subscription.amount || 0)
        const currency = subscription.currency || getWalletCurrency(wallet) || DEFAULT_CURRENCY
        const walletBalance = Number(wallet?.balance || 0)

        return {
          id: subscription.id,
          name: subscription.name || 'Recurring bill',
          dueDate,
          dueLabel: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayDiff,
          amountLabel: formatCurrency(amount, currency),
          amount,
          currency,
          walletName: wallet?.name || 'No wallet',
          hasFundingRisk: Boolean(wallet && getWalletCurrency(wallet) === currency && walletBalance < amount)
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.dayDiff - b.dayDiff || new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
  }, [subscriptions, walletBalances])

  const netWorthRows = useMemo(() => (
    [...netWorthSnapshots]
      .filter((snapshot) => Number.isFinite(Number(snapshot.total)))
      .sort((a, b) => String(a.monthKey || '').localeCompare(String(b.monthKey || '')))
      .slice(-6)
  ), [netWorthSnapshots])

  const budgetAlerts = useMemo(() => (
    categoryBudgets
      .filter((budget) => budget.hasBudget && ['warning', 'over'].includes(budget.status))
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 3)
  ), [categoryBudgets])
  const netWorthChange = netWorthRows.length >= 2
    ? Number(netWorthRows[netWorthRows.length - 1].total || 0) - Number(netWorthRows[netWorthRows.length - 2].total || 0)
    : null

  const cashflowForecast = useMemo(() => {
    const cash = walletSummary.length === 1 ? Number(walletSummary[0].total || 0) : null
    if (cash == null) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = getLocalDateInputValue(today)
    const horizons = [30, 60, 90]

    return horizons.map((days) => {
      const end = new Date(today)
      end.setDate(end.getDate() + days)
      const endKey = getLocalDateInputValue(end)
      const scheduledIncome = recurringIncomes
        .filter((income) => income.isActive !== false)
        .filter((income) => {
          const due = income.nextDueDate || income.nextRunDate || income.startDate
          return due && due >= todayKey && due <= endKey
        })
        .reduce((sum, income) => sum + Number(income.amount || 0), 0)
      const scheduledBills = upcomingBills
        .filter((bill) => bill.dueDate >= todayKey && bill.dueDate <= endKey)
        .reduce((sum, bill) => sum + Number(bill.amount || 0), 0)

      return {
        days,
        total: cash + scheduledIncome - scheduledBills
      }
    })
  }, [recurringIncomes, upcomingBills, walletSummary])

  const getWalletName = (walletId) => {
    const wallet = walletBalances.find((entry) => entry.id === walletId)
    return wallet ? wallet.name : 'Unknown'
  }

  const getTransferLabel = (transfer) => {
    const sourceName = getWalletName(transfer.fromWalletId)
    if (transfer.toSavingsId) {
      return `${sourceName} → ${transfer.savingsGoalName || 'Savings Goal'}`
    }
    return `${sourceName} → ${getWalletName(transfer.toWalletId)}`
  }

  const financeInsights = useMemo(() => {
    const comparable = (
      walletSummary.length <= 1 &&
      incomeSummary.length <= 1 &&
      expenseSummary.length <= 1 &&
      savingsSummary.length <= 1 &&
      [walletSummary[0]?.currency, incomeSummary[0]?.currency, expenseSummary[0]?.currency, savingsSummary[0]?.currency]
        .filter(Boolean)
        .every((currency) => currency === primaryCurrency)
    )

    if (!comparable) return null

    const upcomingBillsTotal = upcomingBills
      .filter((bill) => bill.currency === primaryCurrency)
      .reduce((sum, bill) => sum + Number(bill.amount || 0), 0)

    return buildFinanceInsights({
      cash: Number(walletSummary[0]?.total || 0),
      income: Number(incomeSummary[0]?.total || 0),
      expenses: Number(expenseSummary[0]?.total || 0),
      savings: Number(savingsSummary[0]?.total || 0),
      upcomingBills: upcomingBillsTotal
    })
  }, [expenseSummary, incomeSummary, primaryCurrency, savingsSummary, upcomingBills, walletSummary])

  const getAccountPillLabel = (wallet) => {
    if (wallet.accountType === 'credit') {
      return wallet.balance >= 0 ? 'Available' : 'Card balance'
    }

    if (wallet.accountType === 'ewallet') return 'E-Wallet'
    if (wallet.accountType === 'bank') return 'Bank'
    if (wallet.accountType === 'savings') return 'Savings'
    if (wallet.accountType === 'investment') return 'Investments'
    if (wallet.accountType === 'cash') return 'Cash'
    if (wallet.accountType === 'other') return 'Other'

    return wallet.balance >= 0 ? 'Available' : 'Overdrawn'
  }

  const getAccountCardClassName = (wallet) => {
    const toneClass = wallet.colorTheme && wallet.colorTheme !== 'auto'
      ? `account-card--tone-${wallet.colorTheme}`
      : (
          wallet.accountType === 'bank'
            ? 'bank'
            : wallet.accountType === 'credit'
              ? 'credit'
              : wallet.accountType === 'ewallet'
                ? 'ewallet'
                : wallet.accountType === 'savings'
                  ? 'savings'
                  : wallet.accountType === 'investment'
                    ? 'investment'
                    : wallet.accountType === 'other'
                      ? 'other'
                      : 'cash'
        )

    return `account-card ${toneClass}`
  }

  const getCreditPayoffHint = (wallet) => {
    if (wallet.accountType !== 'credit') return ''

    const balance = Math.max(Number(wallet.balance || 0) * -1, 0)
    if (balance <= 0) return 'No card debt'

    const plannedPayment = Number(wallet.creditMinimumPayment || 0)
    const monthlyPayment = plannedPayment > 0 ? plannedPayment : Math.max(balance * 0.1, 500)
    const monthlyRate = Math.max(Number(wallet.creditApr || 0), 0) / 100 / 12
    let months = 0
    let projectedBalance = balance

    while (projectedBalance > 0.01 && months < 600) {
      const interest = projectedBalance * monthlyRate
      if (monthlyPayment <= interest) return 'Payment too low to project payoff'
      projectedBalance = projectedBalance + interest - monthlyPayment
      months++
    }

    return `${months} mo payoff at ${formatCurrency(monthlyPayment, getWalletCurrency(wallet))}/mo`
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
            role="img"
            aria-label={`Breakdown chart. Total ${totalLabel}.`}
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
      label: index === 4 ? 'W5+' : `W${index + 1}`,
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
    const labels = ['1-8', '9-16', '17-24', '25+']

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
      <article className="balance-card income">
        <div className="balance-label"><IncomeIcon size={16} /> Income</div>
        <div className="balance-amount balance-amount--string">{totalIncomeLabel}</div>
        <div className="balance-change">Received this month</div>
      </article>

      <article className="balance-card expense">
        <div className="balance-label"><ExpenseIcon size={16} /> Expenses</div>
        <div className="balance-amount balance-amount--string">{totalExpensesLabel}</div>
        <div className="balance-change">Spent this month</div>
      </article>

      <article className="balance-card net">
        <div className="balance-label"><ChartIcon size={16} /> Net Position</div>
        <div className="balance-amount balance-amount--string">{netIncomeLabel}</div>
        <div className={`balance-change value-chip ${focusedNetIncome >= 0 ? 'positive' : 'negative'}`}>{netLabel}</div>
      </article>

      <article className="balance-card reserved">
        <div className="balance-label"><TrendUpIcon size={16} /> Reserved</div>
        <div className="balance-amount balance-amount--string">{totalSavingsLabel}</div>
        <div className="balance-change">{savings.length} funded goal{savings.length === 1 ? '' : 's'}</div>
      </article>
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
                      : getTransferLabel(transaction)}
                </div>
                <div className="transaction-subtitle">
                  {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {transaction.category && ` • ${transaction.category}`}
                  {transaction.type === 'transfer' && transaction.notes && ` • ${transaction.notes}`}
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
        <h3 className="card-title"><WalletIcon size={18} /> Accounts</h3>
        <span className="card-subtitle">{walletBalances.length} total</span>
      </div>
      {walletBalances.length > 0 ? (
        <div className="account-grid dashboard-account-grid">
          {walletBalances.map((wallet) => (
            <div
              key={wallet.id}
              className={getAccountCardClassName(wallet)}
            >
              <div className="account-card-meta">
                <div className="account-name" title={wallet.name}>{wallet.name}</div>
                <div className="account-pill">{getAccountPillLabel(wallet)}</div>
              </div>
              <div className="account-balance">{formatCurrency(parseFloat(wallet.balance || 0), getWalletCurrency(wallet))}</div>
              {getCreditPayoffHint(wallet) && (
                <div className="transaction-subtitle">{getCreditPayoffHint(wallet)}</div>
              )}
            </div>
          ))}
        </div>
      ) : renderWidgetEmptyState('Add a wallet to start tracking account balances.')}
    </div>
  )

  const cashflowChartCard = (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title"><ChartIcon size={18} /> Cashflow Over Time</h3>
        <span className="card-subtitle">{monthName}</span>
      </div>
      {cashflowTrendRows.some((row) => row.income > 0 || row.expenses > 0) ? (
        <div className="dashboard-cashflow-trend" role="list" aria-label={`Weekly income and expenses for ${monthName}`}>
          {cashflowTrendRows.map((row) => (
            <div
              key={row.id}
              className="dashboard-cashflow-trend-column"
              role="listitem"
              aria-label={`${row.label}: income ${formatCurrency(row.income, incomeSummary[0]?.currency || DEFAULT_CURRENCY)}, expenses ${formatCurrency(row.expenses, expenseSummary[0]?.currency || DEFAULT_CURRENCY)}, net ${formatCurrency(row.net, incomeSummary[0]?.currency || expenseSummary[0]?.currency || DEFAULT_CURRENCY)}`}
            >
              <div className="dashboard-cashflow-trend-stage">
                {row.income > 0 ? (
                  <div
                    className="dashboard-cashflow-trend-bar dashboard-cashflow-trend-bar--income"
                    style={{ height: `${row.incomeHeight}%` }}
                    title={`Income: ${formatCurrency(row.income, incomeSummary[0]?.currency || DEFAULT_CURRENCY)}`}
                    aria-hidden="true"
                  />
                ) : null}
                {row.expenses > 0 ? (
                  <div
                    className="dashboard-cashflow-trend-bar dashboard-cashflow-trend-bar--expense"
                    style={{ height: `${row.expenseHeight}%` }}
                    title={`Expenses: ${formatCurrency(row.expenses, expenseSummary[0]?.currency || DEFAULT_CURRENCY)}`}
                    aria-hidden="true"
                  />
                ) : null}
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
        <h3 className="card-title"><IncomeIcon size={18} /> Income by Source</h3>
        <span className="card-subtitle">{monthName}</span>
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
        <h3 className="card-title"><ExpenseIcon size={18} /> Weekly Spending Trend</h3>
        <span className="card-subtitle">Distribution across {monthName}</span>
      </div>
      {weeklySpendingRows.some((row) => row.amount > 0) ? (
        <div className="dashboard-column-chart" role="list" aria-label={`Weekly spending for ${monthName}`}>
          {weeklySpendingRows.map((row) => (
            <div key={row.id} className="dashboard-column-chart-item" role="listitem" aria-label={`${row.label}: ${formatCurrency(row.amount, expenseSummary[0]?.currency || DEFAULT_CURRENCY)}`}>
              <div className="dashboard-column-chart-stage">
                {row.amount > 0 ? (
                  <div
                    className="dashboard-column-chart-bar"
                    style={{ height: `${row.height}%` }}
                    aria-hidden="true"
                  />
                ) : null}
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
        <h3 className="card-title"><ExpenseIcon size={18} /> Expense Trend</h3>
        <span className="card-subtitle">{monthName}</span>
      </div>
      {expenseTrendRows.some((row) => row.amount > 0) ? (
        <div className="dashboard-column-chart dashboard-column-chart--four-up" role="list" aria-label={`Expense trend for ${monthName}`}>
          {expenseTrendRows.map((row) => (
            <div key={row.id} className="dashboard-column-chart-item" role="listitem" aria-label={`Days ${row.label}: ${formatCurrency(row.amount, expenseSummary[0]?.currency || DEFAULT_CURRENCY)}`}>
              <div className="dashboard-column-chart-stage">
                {row.amount > 0 ? (
                  <div
                    className="dashboard-column-chart-bar"
                    style={{ height: `${row.height}%` }}
                    aria-hidden="true"
                  />
                ) : null}
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
      <div className="card-header">
        <h3 className="card-title"><WalletIcon size={18} /> Account Allocation</h3>
        <span className="card-subtitle">Share of positive balances</span>
      </div>
      {accountAllocationRows.length > 0 ? (
        <div className="dashboard-breakdown-layout">
          <div className="dashboard-breakdown-chart-wrap">
            <div
              className="dashboard-donut-chart dashboard-breakdown-donut"
              role="img"
              aria-label={`Account allocation chart. Total ${totalBalanceLabel}.`}
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
        <h3 className="card-title"><TrendUpIcon size={18} /> Savings Goals</h3>
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
              <div className="savings-goal-plan">
                {goal.monthlyNeeded == null
                  ? 'Add a target date to see the monthly pace.'
                  : `${formatCurrency(goal.monthlyNeeded, goal.currency || DEFAULT_CURRENCY)} / month for ${goal.monthsLeft} month${goal.monthsLeft === 1 ? '' : 's'}`}
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
        <h3 className="card-title"><ExpenseIcon size={18} /> Upcoming Bills</h3>
        <span className="card-subtitle">Next subscription charges on deck</span>
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
                  {bill.hasFundingRisk ? ' • Funding risk' : ''}
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

  const netWorthHistoryCard = (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title"><TrendUpIcon size={18} /> Net Worth History</h3>
        <span className="card-subtitle">Monthly trend</span>
      </div>
      {netWorthRows.length >= 2 ? (
        <div className="dashboard-bar-chart" role="list" aria-label="Net worth by month">
          {netWorthRows.map((snapshot) => {
            const maxTotal = Math.max(...netWorthRows.map((row) => Math.abs(Number(row.total || 0))), 1)
            const height = `${Math.max((Math.abs(Number(snapshot.total || 0)) / maxTotal) * 100, 6)}%`
            return (
              <div key={snapshot.id || snapshot.monthKey} className="dashboard-bar-item" role="listitem" aria-label={`${snapshot.monthKey || 'Current snapshot'}: ${formatCurrency(snapshot.total, snapshot.currency || DEFAULT_CURRENCY)}`}>
                <div className="dashboard-bar-track">
                  <div className="dashboard-bar-fill income" style={{ height }} aria-hidden="true" />
                </div>
                <span>{snapshot.monthKey ? new Date(`${snapshot.monthKey}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' }) : 'Now'}</span>
                <strong>{formatCurrency(snapshot.total, snapshot.currency || DEFAULT_CURRENCY, { maximumFractionDigits: 0 })}</strong>
              </div>
            )
          })}
        </div>
      ) : netWorthRows.length === 1 ? (
        <div className="dashboard-plan-list">
          <div className="atelier-metric-chip dashboard-rail-chip">
            <span>{netWorthRows[0].monthKey ? new Date(`${netWorthRows[0].monthKey}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Current snapshot'}</span>
            <strong>{formatCurrency(netWorthRows[0].total, netWorthRows[0].currency || DEFAULT_CURRENCY)}</strong>
          </div>
        </div>
      ) : renderWidgetEmptyState('Net worth history will appear after the first monthly snapshot is saved.')}
    </div>
  )

  const monthlyCloseoutCard = (
    <div className="card dashboard-plan-card dashboard-closeout-card">
      <div className="card-header">
        <h3 className="card-title"><ChartIcon size={18} /> Monthly Closeout</h3>
        <span className="card-subtitle">{monthName}</span>
      </div>
      <div className="dashboard-plan-list">
        <div className="atelier-metric-chip dashboard-rail-chip">
          <span>Net Position</span>
          <strong>{netIncomeLabel}</strong>
        </div>
        <div className="atelier-metric-chip dashboard-rail-chip">
          <span>Top Spending Category</span>
          <strong>{topCategory ? `${topCategory.category} (${topCategory.percentage}%)` : 'None yet'}</strong>
        </div>
        <div className="atelier-metric-chip dashboard-rail-chip">
          <span>Budgets Over Limit</span>
          <strong>{categoryBudgets.filter((budget) => budget.status === 'over').length}</strong>
        </div>
        <div className="atelier-metric-chip dashboard-rail-chip">
          <span>Net Worth Movement</span>
          <strong>
            {netWorthChange == null
              ? 'Baseline only'
              : formatCurrency(netWorthChange, netWorthRows[netWorthRows.length - 1]?.currency || DEFAULT_CURRENCY)}
          </strong>
        </div>
      </div>
    </div>
  )

  const planAheadCard = (
    <div className="card dashboard-plan-card">
      <div className="card-header">
        <h3 className="card-title"><TrendUpIcon size={18} /> Plan Ahead</h3>
        <span className="card-subtitle">Forecast and financial health</span>
      </div>
      {financeInsights ? (
        <div className="dashboard-plan-grid">
          <div className="dashboard-plan-score">
            <span className="dashboard-kicker">Health Score</span>
            <strong>{financeInsights.score}</strong>
            <span className={`value-chip ${financeInsights.score >= 60 ? 'positive' : 'negative'}`}>{financeInsights.status}</span>
          </div>
          <div className="dashboard-plan-list">
            <div className="atelier-metric-chip dashboard-rail-chip">
              <span>Projected Month-End</span>
              <strong>{formatCurrency(financeInsights.projectedMonthEnd, primaryCurrency)}</strong>
            </div>
            <div className="atelier-metric-chip dashboard-rail-chip">
              <span>Cash Runway</span>
              <strong>{financeInsights.runwayDays == null ? 'No spend yet' : `${financeInsights.runwayDays} days`}</strong>
            </div>
            <div className="atelier-metric-chip dashboard-rail-chip">
              <span>Scheduled Bills vs Income</span>
              <strong>{financeInsights.billLoad.toFixed(0)}%</strong>
            </div>
            {cashflowForecast.map((forecast) => (
              <div key={forecast.days} className="atelier-metric-chip dashboard-rail-chip">
                <span>{forecast.days}-Day Cash</span>
                <strong>{formatCurrency(forecast.total, primaryCurrency)}</strong>
              </div>
            ))}
            {budgetAlerts.map((budget) => (
              <div key={budget.categoryId} className="atelier-metric-chip dashboard-rail-chip">
                <span>{budget.categoryName} Budget</span>
                <strong>{budget.utilization.toFixed(0)}%</strong>
              </div>
            ))}
          </div>
        </div>
      ) : renderWidgetEmptyState('Use one currency this month to unlock forecast and health scoring.')}
    </div>
  )

  const sectionNodes = {
    'plan-ahead': planAheadCard,
    'monthly-closeout': monthlyCloseoutCard,
    'net-worth-history': netWorthHistoryCard,
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
  const dashboardSections = (preset?.widgetOrder || [])
    .map((sectionId) => ({ id: sectionId, node: sectionNodes[sectionId] }))
    .filter((section) => Boolean(section.node))
  return (
    <div className="mobile-content">
      <div className={`dashboard-layout dashboard-layout--${preset?.id || 'overview'}`}>
        <nav className="dashboard-preset-switcher" aria-label="Dashboard view">
          <div className="dashboard-preset-switcher-copy">
            <span>Dashboard View</span>
            <strong>{presets.find((option) => option.id === preset?.id)?.description}</strong>
          </div>
          <div className="dashboard-preset-segments" role="group" aria-label="Choose dashboard view">
            {presets.map((option) => (
              <button
                key={option.id}
                type="button"
                className={preset?.id === option.id ? 'active' : ''}
                onClick={() => onPresetChange?.(option.id)}
                aria-pressed={preset?.id === option.id}
              >
                {option.name}
              </button>
            ))}
          </div>
        </nav>

        <section className="atelier-hero card dashboard-hero">
            <div className="dashboard-hero-main">
              <div className="atelier-hero-copy">
                <span className="eyebrow">Your monthly ledger</span>
                <h2 className="atelier-hero-title">{monthName}</h2>
              </div>

              <div className="dashboard-hero-total">
                <span className="dashboard-kicker">Portfolio Balance</span>
                <div className="dashboard-total-amount">{totalBalanceLabel}</div>
                <div className="dashboard-total-meta">{walletBalances.length} linked account{walletBalances.length === 1 ? '' : 's'}</div>
              </div>
            </div>

            <div className="dashboard-hero-rail">
              <div className="atelier-metric-chip dashboard-rail-chip">
                <span>Spending vs Income</span>
                <strong>{comparableIncomeAndExpense ? `${expenseCoverage.toFixed(0)}%` : hasMixedIncomeCurrencies || hasMixedExpenseCurrencies ? 'Mixed' : '0%'}</strong>
              </div>
              <div className="atelier-metric-chip dashboard-rail-chip">
                <span>Top Category</span>
                <strong>{hasMixedExpenseCurrencies ? 'Mixed currencies' : topCategory?.category || 'None yet'}</strong>
              </div>
              <div className="atelier-metric-chip dashboard-rail-chip">
                <span>Savings vs Spending</span>
                <strong>{comparableExpenseAndSavings ? `${savingsCoverage.toFixed(0)}%` : hasMixedExpenseCurrencies || hasMixedSavingsCurrencies ? 'Mixed' : '0%'}</strong>
              </div>
            </div>
        </section>

        {metricCards}

        {dashboardSections.length > 0 && (
          <section className="dashboard-desktop-editor">
            <section className="dashboard-desktop-columns">
              {dashboardSections.map((section) => (
                <article key={section.id} className={`dashboard-desktop-tile dashboard-desktop-tile--${section.id}`}>
                  {section.node}
                </article>
              ))}
            </section>
          </section>
        )}

        {dashboardSections.length > 0 && (
          <section className="dashboard-content-grid dashboard-mobile-layout">
            <div className="dashboard-mobile-stack">
              {dashboardSections.map((section) => (
                <div key={section.id} className="dashboard-mobile-widget">
                  {section.node}
                </div>
              ))}
            </div>
          </section>
        )}

        {recentTransactions.length === 0 && walletBalances.length === 0 && dashboardSections.length === 0 && (
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
