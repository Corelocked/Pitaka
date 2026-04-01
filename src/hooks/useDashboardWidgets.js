import { useEffect } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { DEFAULT_CURRENCY, formatCurrency, formatCurrencySummary, getWalletCurrency, summarizeByCurrency } from '../utils/currency'

const DashboardWidgets = registerPlugin('DashboardWidgets')

function createEmptyRow(message = 'No data yet') {
  return {
    label: message,
    value: '',
    hint: ''
  }
}

function buildChart(items = [], getName, getAmount, getCurrency, walletBalances = []) {
  const normalized = items
    .map((item) => ({
      name: getName(item),
      amount: Number(getAmount(item) || 0),
      currency: getCurrency(item, walletBalances)
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const total = normalized.reduce((sum, item) => sum + item.amount, 0)
  const palette = ['#3F7B5D', '#D08B4C', '#7B8FC9', '#BE6A78', '#6F9D93']

  return {
    segments: normalized.slice(0, 5).map((item, index) => ({
      label: item.name,
      value: item.amount,
      share: total > 0 ? item.amount / total : 0,
      color: palette[index % palette.length]
    })),
    total
  }
}

function formatMonthLabel(selectedMonth, selectedYear) {
  return new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
}

function buildTransactionRows({ filteredIncomes, filteredExpenses, transfers, selectedMonth, selectedYear, walletBalances }) {
  const getWalletName = (walletId) => walletBalances.find((wallet) => wallet.id === walletId)?.name || 'Unknown account'

  return [
    ...filteredIncomes.map((income) => ({
      id: `income-${income.id || income.date}-${income.amount}`,
      date: income.date,
      label: income.source || 'Income',
      value: `+${formatCurrency(income.amount || 0, income.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === income.walletId)) || DEFAULT_CURRENCY)}`,
      hint: getWalletName(income.walletId)
    })),
    ...filteredExpenses.map((expense) => ({
      id: `expense-${expense.id || expense.date}-${expense.amount}`,
      date: expense.date,
      label: expense.description || expense.category || 'Expense',
      value: `-${formatCurrency(expense.amount || 0, expense.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === expense.walletId)) || DEFAULT_CURRENCY)}`,
      hint: `${expense.category || 'Uncategorized'} • ${getWalletName(expense.walletId)}`
    })),
    ...transfers
      .filter((transfer) => {
        const date = new Date(transfer.date)
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      })
      .map((transfer) => ({
        id: `transfer-${transfer.id || transfer.date}-${transfer.amount}`,
        date: transfer.date,
        label: transfer.toSavingsId
          ? `${getWalletName(transfer.fromWalletId)} to ${transfer.savingsGoalName || 'Savings'}`
          : `${getWalletName(transfer.fromWalletId)} to ${getWalletName(transfer.toWalletId)}`,
        value: formatCurrency(transfer.amount || 0, transfer.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === transfer.fromWalletId)) || DEFAULT_CURRENCY),
        hint: 'Transfer'
      }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)
}

function buildSnapshot({
  selectedMonth,
  selectedYear,
  filteredIncomes,
  filteredExpenses,
  transfers,
  walletBalances,
  savings,
  expensesByCategory
}) {
  const monthLabel = formatMonthLabel(selectedMonth, selectedYear)
  const incomeSummary = summarizeByCurrency(
    filteredIncomes,
    (income) => income.amount || 0,
    (income) => income.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === income.walletId)) || DEFAULT_CURRENCY
  )
  const expenseSummary = summarizeByCurrency(
    filteredExpenses,
    (expense) => expense.amount || 0,
    (expense) => expense.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === expense.walletId)) || DEFAULT_CURRENCY
  )
  const walletSummary = summarizeByCurrency(
    walletBalances,
    (wallet) => wallet.balance || 0,
    (wallet) => getWalletCurrency(wallet)
  )
  const savingsSummary = summarizeByCurrency(
    savings,
    (goal) => goal.currentAmount || 0,
    (goal) => goal.currency || DEFAULT_CURRENCY
  )

  const incomeChart = buildChart(
    (() => {
      const grouped = new Map()
      filteredIncomes.forEach((income) => {
        const key = income.source || 'Other'
        const existing = grouped.get(key) || []
        existing.push(income)
        grouped.set(key, existing)
      })
      return Array.from(grouped.entries()).map(([name, entries]) => ({ name, entries }))
    })(),
    (item) => item.name,
    (item) => item.entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    (item, wallets) => item.entries[0]?.currency || getWalletCurrency(wallets.find((wallet) => wallet.id === item.entries[0]?.walletId)) || DEFAULT_CURRENCY,
    walletBalances
  )

  const expenseChart = buildChart(
    expensesByCategory.filter((category) => Number(category.total || 0) > 0),
    (item) => item.category || 'Uncategorized',
    (item) => item.total || 0,
    () => expenseSummary[0]?.currency || DEFAULT_CURRENCY,
    walletBalances
  )

  const walletChart = buildChart(
    walletBalances
      .map((wallet) => ({ ...wallet, amount: Math.max(Number(wallet.balance || 0), 0) }))
      .filter((wallet) => wallet.amount > 0),
    (item) => item.name,
    (item) => item.amount,
    (item) => getWalletCurrency(item),
    walletBalances
  )

  const incomeRows = (() => {
    const grouped = new Map()
    filteredIncomes.forEach((income) => {
      const key = income.source || 'Other'
      const entries = grouped.get(key) || []
      entries.push(income)
      grouped.set(key, entries)
    })

    return Array.from(grouped.entries())
      .map(([name, entries]) => ({
        label: name,
        amount: entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        value: formatCurrencySummary(
          summarizeByCurrency(
            entries,
            (entry) => entry.amount || 0,
            (entry) => entry.currency || getWalletCurrency(walletBalances.find((wallet) => wallet.id === entry.walletId)) || DEFAULT_CURRENCY
          )
        ),
        hint: `${entries.length} item${entries.length === 1 ? '' : 's'}`
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map(({ label, value, hint }) => ({ label, value, hint }))
  })()

  const expenseRows = expensesByCategory
    .filter((category) => Number(category.total || 0) > 0)
    .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))
    .slice(0, 3)
    .map((category) => ({
      label: category.category || 'Uncategorized',
      value: expenseSummary.length === 1
        ? formatCurrency(category.total || 0, expenseSummary[0].currency || DEFAULT_CURRENCY)
        : `${Number(category.percentage || 0).toFixed(0)}%`,
      hint: `${Number(category.percentage || 0).toFixed(0)}% of expenses`
    }))

  const positiveWallets = walletBalances
    .map((wallet) => ({
      ...wallet,
      amount: Math.max(Number(wallet.balance || 0), 0)
    }))
    .filter((wallet) => wallet.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const totalPositiveWalletBalance = positiveWallets.reduce((sum, wallet) => sum + wallet.amount, 0)
  const allocationRows = positiveWallets.slice(0, 3).map((wallet) => ({
    label: wallet.name,
    value: formatCurrency(wallet.amount, getWalletCurrency(wallet)),
    hint: totalPositiveWalletBalance > 0 ? `${((wallet.amount / totalPositiveWalletBalance) * 100).toFixed(0)}% allocated` : ''
  }))

  const savingsRows = [...(savings || [])]
    .map((goal) => {
      const current = Number(goal.currentAmount || 0)
      const target = Number(goal.targetAmount || 0)
      const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0
      const remaining = Math.max(target - current, 0)
      return {
        id: goal.id || goal.goal || `goal-${current}-${target}`,
        label: goal.goal || 'Savings goal',
        value: formatCurrency(current, goal.currency || DEFAULT_CURRENCY),
        currentLabel: formatCurrency(current, goal.currency || DEFAULT_CURRENCY),
        targetLabel: target > 0 ? formatCurrency(target, goal.currency || DEFAULT_CURRENCY) : 'Open target',
        reservedLabel: `${formatCurrency(current, goal.currency || DEFAULT_CURRENCY)} reserved`,
        remainingLabel: target > 0 ? `${formatCurrency(remaining, goal.currency || DEFAULT_CURRENCY)} left` : '',
        targetDateLabel: goal.targetDate
          ? `Target ${new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'Open timeline',
        percentLabel: `${progress.toFixed(0)}%`,
        progress,
        hint: target > 0
          ? `${progress.toFixed(0)}% of ${formatCurrency(target, goal.currency || DEFAULT_CURRENCY)}`
          : 'Open target'
      }
    })
    .sort((a, b) => b.progress - a.progress)

  const recentRows = buildTransactionRows({
    filteredIncomes,
    filteredExpenses,
    transfers,
    selectedMonth,
    selectedYear,
    walletBalances
  })

  return {
    monthLabel,
    updatedLabel: `Updated ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
    income: {
      title: 'Income',
      subtitle: `${monthLabel} inflows`,
      metric: formatCurrencySummary(incomeSummary),
      meta: `${filteredIncomes.length} income entr${filteredIncomes.length === 1 ? 'y' : 'ies'}`,
      chart: incomeChart,
      rows: incomeRows.length ? incomeRows : [createEmptyRow('No income this month')]
    },
    expense: {
      title: 'Expenses',
      subtitle: `${monthLabel} spending`,
      metric: formatCurrencySummary(expenseSummary),
      meta: `${filteredExpenses.length} expense entr${filteredExpenses.length === 1 ? 'y' : 'ies'}`,
      chart: expenseChart,
      rows: expenseRows.length ? expenseRows : [createEmptyRow('No expenses this month')]
    },
    recentTransactions: {
      title: 'Recent Transactions',
      subtitle: monthLabel,
      metric: `${recentRows.length} shown`,
      meta: 'Latest posted activity',
      rows: recentRows.length ? recentRows : [createEmptyRow('No recent transactions')]
    },
    accountAllocations: {
      title: 'Balance',
      subtitle: 'Balance distribution',
      metric: formatCurrencySummary(walletSummary),
      meta: `${walletBalances.length} account${walletBalances.length === 1 ? '' : 's'}`,
      chart: walletChart,
      rows: allocationRows.length ? allocationRows : [createEmptyRow('Add an account to see balances')]
    },
    savingsGoals: {
      title: 'Savings Goals',
      subtitle: 'Reserved funds',
      metric: formatCurrencySummary(savingsSummary),
      meta: `${savings.length} goal${savings.length === 1 ? '' : 's'}`,
      rows: savingsRows.length ? savingsRows : [{
        ...createEmptyRow('Create a savings goal'),
        id: 'empty',
        currentLabel: '',
        targetLabel: '',
        reservedLabel: '',
        remainingLabel: '',
        targetDateLabel: '',
        percentLabel: '',
        progress: 0
      }]
    }
  }
}

export function useDashboardWidgets({
  isAuthenticated,
  selectedMonth,
  selectedYear,
  filteredIncomes,
  filteredExpenses,
  transfers,
  walletBalances,
  savings,
  expensesByCategory
}) {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') {
      return
    }

    if (!isAuthenticated) {
      DashboardWidgets.clearSnapshot().catch(() => {})
      return
    }

    const snapshot = buildSnapshot({
      selectedMonth,
      selectedYear,
      filteredIncomes,
      filteredExpenses,
      transfers,
      walletBalances,
      savings,
      expensesByCategory
    })

    DashboardWidgets.saveSnapshot({ snapshot: JSON.stringify(snapshot) }).catch(() => {})
  }, [
    isAuthenticated,
    selectedMonth,
    selectedYear,
    filteredIncomes,
    filteredExpenses,
    transfers,
    walletBalances,
    savings,
    expensesByCategory
  ])
}
