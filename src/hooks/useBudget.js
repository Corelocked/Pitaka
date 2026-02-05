import { useState, useEffect, useCallback, useMemo } from 'react'
import { useFirebase } from './useFirebase'
import { incomeService, expenseService, savingsService, categoryService, walletService } from '../services/firebaseService'

export function useBudget() {
  const { user, loading: authLoading } = useFirebase()
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [savings, setSavings] = useState([])
  const [categories, setCategories] = useState([])
  const [wallets, setWallets] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingIncome, setEditingIncome] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)
  const [editingSavings, setEditingSavings] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingWallet, setEditingWallet] = useState(null)
  const [viewMode, setViewMode] = useState('dashboard') // 'dashboard' or 'breakdown'
  const [timePeriod, setTimePeriod] = useState('monthly') // 'monthly' or 'yearly'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Subscribe to Firebase data when user is authenticated
  useEffect(() => {
    if (!user || authLoading) {
      console.log('useBudget: Not loading data - user:', !!user, 'authLoading:', authLoading)
      return
    }

    console.log('useBudget: Starting to load data for user:', user.uid)

    let isMounted = true

    const setupSubscriptions = async () => {
      if (!isMounted) return

      setLoading(true)
      setError(null)

      try {
        // Subscribe to incomes
        const unsubscribeIncomes = incomeService.subscribeToIncomes(
          user.uid,
          (incomesData) => {
            if (isMounted) {
              setIncomes(incomesData)
            }
          }
        )

        // Subscribe to expenses
        const unsubscribeExpenses = expenseService.subscribeToExpenses(
          user.uid,
          (expensesData) => {
            if (isMounted) {
              setExpenses(expensesData)
            }
          }
        )

        // Subscribe to savings
        const unsubscribeSavings = savingsService.subscribeToSavings(
          user.uid,
          (savingsData) => {
            if (isMounted) {
              setSavings(savingsData)
            }
          }
        )

        // Subscribe to categories
        let unsubscribeCategories
        try {
          unsubscribeCategories = categoryService.subscribeToCategories(
            user.uid,
            (categoriesData) => {
              if (isMounted) {
                setCategories(categoriesData || [])
              }
            }
          )
        } catch (err) {
          console.log('Error setting up categories subscription:', err)
          unsubscribeCategories = () => {}
          if (isMounted) {
            setCategories([])
          }
        }

        // Subscribe to wallets
        let unsubscribeWallets
        try {
          unsubscribeWallets = walletService.subscribeToWallets(
            user.uid,
            (walletsData) => {
              if (isMounted) {
                setWallets(walletsData || [])
              }
            }
          )
        } catch (err) {
          console.log('Error setting up wallets subscription:', err)
          unsubscribeWallets = () => {}
          if (isMounted) {
            setWallets([])
          }
        }

        // Set loading to false after subscriptions are set up
        // Add a small delay to ensure subscriptions have time to connect
        const loadingTimeout = setTimeout(() => {
          console.log('useBudget: Setting loading to false')
          if (isMounted) {
            setLoading(false)
          }
        }, 2000) // Increased timeout to 2 seconds

        return () => {
          clearTimeout(loadingTimeout)
          unsubscribeIncomes()
          unsubscribeExpenses()
          unsubscribeSavings()
          unsubscribeCategories()
          unsubscribeWallets()
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    const cleanup = setupSubscriptions()

    return () => {
      isMounted = false
      cleanup?.then?.(fn => fn?.())
    }
  }, [user, authLoading])

  // Default category seeding disabled — creating starter categories automatically was removed per user preference.
  // If you want to re-enable this behavior later, restore the seeding logic or provide an opt-in UI.
  // No categories will be added automatically.


  // Clear data when user becomes unauthenticated
  useEffect(() => {
    if (!user && !authLoading) {
      setIncomes([])
      setExpenses([])
      setSavings([])
      setCategories([])
      setEditingIncome(null)
      setEditingExpense(null)
      setEditingSavings(null)
      setEditingCategory(null)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const addIncome = useCallback(async (income) => {
    if (!user) {
      throw new Error('Please sign in to add income')
    }

    try {
      setError(null)
      await incomeService.addIncome(income, user.uid)
    } catch (err) {
      console.error('Add income error:', err)
      setError(err.message)
      throw err
    }
  }, [user])

  const addExpense = useCallback(async (expense) => {
    if (!user) return

    try {
      setError(null)
      await expenseService.addExpense(expense, user.uid)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  const deleteIncome = useCallback(async (id) => {
    try {
      setError(null)
      await incomeService.deleteIncome(id)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const deleteExpense = useCallback(async (id) => {
    try {
      setError(null)
      await expenseService.deleteExpense(id)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const editIncome = useCallback((income) => {
    setEditingIncome(income)
  }, [])

  const updateIncome = useCallback(async (updatedIncome) => {
    try {
      setError(null)
      const { id, ...updates } = updatedIncome
      await incomeService.updateIncome(id, updates)
      setEditingIncome(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const editExpense = useCallback((expense) => {
    setEditingExpense(expense)
  }, [])

  const updateExpense = useCallback(async (updatedExpense) => {
    try {
      setError(null)
      const { id, ...updates } = updatedExpense
      await expenseService.updateExpense(id, updates)
      setEditingExpense(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const addSavings = useCallback(async (savingsGoal) => {
    if (!user) return

    try {
      setError(null)
      await savingsService.addSavings(savingsGoal, user.uid)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  const deleteSavings = useCallback(async (id) => {
    try {
      setError(null)
      await savingsService.deleteSavings(id)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const editSavings = useCallback((savingsGoal) => {
    setEditingSavings(savingsGoal)
  }, [])

  const updateSavings = useCallback(async (updatedSavings) => {
    try {
      setError(null)
      const { id, ...updates } = updatedSavings
      await savingsService.updateSavings(id, updates)
      setEditingSavings(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const addCategory = useCallback(async (category) => {
    if (!user) return

    try {
      setError(null)
      await categoryService.addCategory(category, user.uid)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  const addWallet = useCallback(async (wallet) => {
    if (!user) return

    // Optimistic UI: add a temporary wallet locally so the dropdown updates immediately
    const tempId = `temp-${Date.now()}`
    const tempWallet = {
      id: tempId,
      name: wallet.name,
      description: wallet.description || '',
      startingBalance: wallet.startingBalance || 0,
      userId: user.uid,
      createdAt: new Date()
    }

    setWallets(prev => [tempWallet, ...prev])

    try {
      setError(null)
      const id = await walletService.addWallet(wallet, user.uid)
      // backend subscription will replace the list; as a safeguard, remove temp if still present
      setWallets(prev => prev.filter(w => w.id !== tempId))
      return id
    } catch (err) {
      // rollback optimistic update
      setWallets(prev => prev.filter(w => w.id !== tempId))
      setError(err.message)
      throw err
    }
  }, [user])

  const deleteWallet = useCallback(async (id) => {
    try {
      setError(null)
      await walletService.deleteWallet(id)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const editWallet = useCallback((wallet) => {
    setEditingWallet(wallet)
  }, [])

  const updateWallet = useCallback(async (updatedWallet) => {
    try {
      setError(null)
      const { id, ...updates } = updatedWallet
      await walletService.updateWallet(id, updates)
      // clear editing state
      setEditingWallet(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const deleteCategory = useCallback(async (id) => {
    try {
      setError(null)
      await categoryService.deleteCategory(id)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const editCategory = useCallback((category) => {
    setEditingCategory(category)
  }, [])

  const updateCategory = useCallback(async (updatedCategory) => {
    try {
      setError(null)
      const { id, ...updates } = updatedCategory
      await categoryService.updateCategory(id, updates)
      setEditingCategory(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const filteredIncomes = incomes.filter(inc => {
    const date = new Date(inc.date)
    return timePeriod === 'yearly' ? date.getFullYear() === selectedYear : (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear)
  })

  const filteredExpenses = expenses.filter(exp => {
    const date = new Date(exp.date)
    return timePeriod === 'yearly' ? date.getFullYear() === selectedYear : (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear)
  })

  const totalIncome = filteredIncomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
  const totalSavings = savings.reduce((sum, saving) => sum + parseFloat(saving.currentAmount), 0)
  const netIncome = totalIncome - totalExpenses

  const expenseCategories = [...new Set(expenses.map(exp => exp.category))]

  const expensesByCategory = expenseCategories.map(category => {
    const categoryExpenses = filteredExpenses.filter(exp => exp.category === category)
    const total = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    const percentage = totalExpenses > 0 ? (total / totalExpenses * 100).toFixed(1) : 0
    return { category, total, percentage }
  })

  // Wallet balances calculated from linked incomes/expenses plus startingBalance
  const walletBalances = useMemo(() => {
    const map = {}
    wallets.forEach(w => { map[w.id] = parseFloat(w.startingBalance || 0) })
    incomes.forEach(i => {
      if (!i.walletId) return
      map[i.walletId] = (map[i.walletId] || 0) + parseFloat(i.amount || 0)
    })
    expenses.forEach(e => {
      if (!e.walletId) return
      map[e.walletId] = (map[e.walletId] || 0) - parseFloat(e.amount || 0)
    })
    return wallets.map(w => ({ ...w, balance: map[w.id] || 0 }))
  }, [wallets, incomes, expenses])

  const exportToCSV = () => {
    const walletName = (id) => wallets.find(w => w.id === id)?.name || ''

    const csvContent = [
      ['Type', 'Description/Source', 'Category', 'Wallet', 'Amount', 'Date'].join(','),
      ...filteredIncomes.map(inc => ['Income', inc.source, '', walletName(inc.walletId), inc.amount, inc.date].join(',')),
      ...filteredExpenses.map(exp => ['Expense', exp.description, exp.category, walletName(exp.walletId), exp.amount, exp.date].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `budget-${selectedYear}-${selectedMonth + 1}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Debug logs to help trace why incomes may not appear in filtered lists / totals
  useEffect(() => {
    console.log('useBudget debug:', {
      user: user?.uid,
      incomesCount: incomes.length,
      expensesCount: expenses.length,
      walletsCount: wallets.length,
      walletIds: wallets.map(w => w.id),
      selectedMonth,
      selectedYear,
      timePeriod,
      filteredIncomesCount: filteredIncomes.length,
      filteredExpensesCount: filteredExpenses.length,
      totalIncome,
      totalExpenses
    })
  }, [user, incomes, expenses, wallets, selectedMonth, selectedYear, timePeriod, totalIncome, totalExpenses])

  return {
    // State
    incomes,
    expenses,
    savings,
    categories,
    wallets,
    walletBalances,
    selectedMonth,
    selectedYear,
    editingIncome,
    editingExpense,
    editingSavings,
    editingCategory,
    editingWallet,
    viewMode,
    timePeriod,
    filteredIncomes,
    filteredExpenses,
    totalIncome,
    totalExpenses,
    totalSavings,
    netIncome,
    expensesByCategory,
    loading,
    error,

    // Actions
    setSelectedMonth,
    setSelectedYear,
    setViewMode,
    setTimePeriod,
    addIncome,
    addExpense,
    addSavings,
    addCategory,
    addWallet,
    deleteIncome,
    deleteExpense,
    deleteSavings,
    deleteCategory,
    deleteWallet,
    editIncome,
    updateIncome,
    editExpense,
    updateExpense,
    editSavings,
    updateSavings,
    editCategory,
    updateCategory,
    editWallet,
    updateWallet,
    exportToCSV
  }
}