import { useState, useEffect, useCallback, useMemo } from 'react'
import { useFirebase } from './useFirebase'
import { incomeService, expenseService, savingsService, categoryService, walletService, transferService, investmentService } from '../services/firebaseService'

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
  const [timePeriod, setTimePeriod] = useState('monthly') // 'monthly' or 'yearly'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [transfers, setTransfers] = useState([])
  const [investments, setInvestments] = useState([])
  const [syncState, setSyncState] = useState({
    hasPendingWrites: false,
    isFromCache: false
  })

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

      const metadataState = {}
      const updateSyncState = (key, metadata) => {
        metadataState[key] = metadata

        if (!isMounted) return

        const values = Object.values(metadataState)
        setSyncState({
          hasPendingWrites: values.some((entry) => entry?.hasPendingWrites),
          isFromCache: values.length > 0 && values.every((entry) => entry?.fromCache)
        })
      }

      try {
        // Subscribe to incomes
        const unsubscribeIncomes = incomeService.subscribeToIncomes(
          user.uid,
          (incomesData) => {
            if (isMounted) {
              setIncomes(incomesData)
            }
          },
          (metadata) => updateSyncState('incomes', metadata)
        )

        // Subscribe to expenses
        const unsubscribeExpenses = expenseService.subscribeToExpenses(
          user.uid,
          (expensesData) => {
            if (isMounted) {
              setExpenses(expensesData)
            }
          },
          (metadata) => updateSyncState('expenses', metadata)
        )

        // Subscribe to savings
        const unsubscribeSavings = savingsService.subscribeToSavings(
          user.uid,
          (savingsData) => {
            if (isMounted) {
              setSavings(savingsData)
            }
          },
          (metadata) => updateSyncState('savings', metadata)
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
            },
            (metadata) => updateSyncState('categories', metadata)
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
            },
            (metadata) => updateSyncState('wallets', metadata)
          )
        } catch (err) {
          console.log('Error setting up wallets subscription:', err)
          unsubscribeWallets = () => {}
          if (isMounted) {
            setWallets([])
          }
        }

        // Subscribe to transfers
        let unsubscribeTransfers
        try {
          unsubscribeTransfers = transferService.subscribeToTransfers(
            user.uid,
            (transfersData) => {
              if (isMounted) setTransfers(transfersData || [])
            },
            (metadata) => updateSyncState('transfers', metadata)
          )
        } catch (err) {
          console.log('Error setting up transfers subscription:', err)
          unsubscribeTransfers = () => {}
          if (isMounted) setTransfers([])
        }

        // Subscribe to investments
        let unsubscribeInvestments
        try {
          unsubscribeInvestments = investmentService.subscribeToInvestments(
            user.uid,
            (investmentsData) => {
              if (isMounted) setInvestments(investmentsData || [])
            },
            (metadata) => updateSyncState('investments', metadata)
          )
        } catch (err) {
          console.log('Error setting up investments subscription:', err)
          unsubscribeInvestments = () => {}
          if (isMounted) setInvestments([])
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
          unsubscribeTransfers && typeof unsubscribeTransfers === 'function' && unsubscribeTransfers()
          unsubscribeInvestments && typeof unsubscribeInvestments === 'function' && unsubscribeInvestments()
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
      // This effect intentionally clears local budget state after sign-out so stale user data
      // never flashes in the next session.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIncomes([])
      setExpenses([])
      setSavings([])
      setCategories([])
      setEditingIncome(null)
      setEditingExpense(null)
      setEditingSavings(null)
      setEditingCategory(null)
      setError(null)
      setSyncState({
        hasPendingWrites: false,
        isFromCache: false
      })
    }
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

  const addToSavingsGoal = useCallback(async (savingsId, amount) => {
    const goal = savings.find((entry) => entry.id === savingsId)

    if (!goal) {
      throw new Error('Savings goal not found')
    }

    try {
      setError(null)
      await savingsService.updateSavings(savingsId, {
        currentAmount: parseFloat(goal.currentAmount || 0) + parseFloat(amount || 0)
      })
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [savings])

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
      currency: wallet.currency,
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
    console.log('useBudget: deleteCategory called with id:', id)
    try {
      setError(null)
      await categoryService.deleteCategory(id)
      console.log('useBudget: deleteCategory succeeded for id:', id)
    } catch (err) {
      setError(err.message)
      console.error('useBudget: deleteCategory error for id:', id, err)
      throw err
    }
  }, [])

  const editCategory = useCallback((category) => {
    setEditingCategory(category)
  }, [])

  const updateCategory = useCallback(async (updatedCategory) => {
    console.log('useBudget: updateCategory called with:', updatedCategory)
    try {
      setError(null)
      const { id, ...updates } = updatedCategory
      await categoryService.updateCategory(id, updates)
      setEditingCategory(null)
      console.log('useBudget: updateCategory succeeded for id:', id)
    } catch (err) {
      setError(err.message)
      console.error('useBudget: updateCategory error for id:', updatedCategory?.id, err)
      throw err
    }
  }, [])

  // Transfer operations
  const addTransfer = useCallback(async (transfer) => {
    if (!user) return

    try {
      setError(null)
      await transferService.addTransfer(transfer, user.uid)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  const updateTransfer = useCallback(async (transferId, updates) => {
    try {
      setError(null)
      await transferService.updateTransfer(transferId, updates)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const deleteTransfer = useCallback(async (transferId) => {
    try {
      setError(null)
      await transferService.deleteTransfer(transferId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Investment operations
  const addInvestment = useCallback(async (investment) => {
    if (!user) return

    try {
      setError(null)
      await investmentService.addInvestment(investment, user.uid)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  const updateInvestment = useCallback(async (investmentId, updates) => {
    try {
      setError(null)
      await investmentService.updateInvestment(investmentId, updates)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const deleteInvestment = useCallback(async (investmentId) => {
    try {
      setError(null)
      await investmentService.deleteInvestment(investmentId)
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
  const totalInvestments = investments.reduce((sum, inv) => sum + (parseFloat(inv.currentValue) || parseFloat(inv.purchasePrice) || 0), 0)
  const netIncome = totalIncome - totalExpenses

  // Build a list of categories to display in the dashboard chart.
  // Include all created categories (from `categories`) plus any category names
  // that appear only on expenses (to avoid dropping ad-hoc names). This
  // ensures categories with zero spending still appear with total 0.
  const expenseCategoryNames = [
    ...(categories || []).map(c => c.name),
    ...expenses.map(exp => exp.category).filter(Boolean)
  ]
  const expenseCategories = [...new Set(expenseCategoryNames)]

  const expensesByCategory = expenseCategories.map(categoryName => {
    const name = categoryName || 'Uncategorized'
    const categoryExpenses = filteredExpenses.filter(exp => (exp.category || '') === (categoryName || ''))
    const total = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
    const percentage = totalExpenses > 0 ? (total / totalExpenses * 100).toFixed(1) : 0
    return { category: name, total, percentage }
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
    // Apply transfers: subtract from source, add to destination
    transfers.forEach(t => {
      if (t.fromWalletId) {
        map[t.fromWalletId] = (map[t.fromWalletId] || 0) - parseFloat(t.amount || 0)
      }
      if (t.toWalletId) {
        map[t.toWalletId] = (map[t.toWalletId] || 0) + parseFloat(t.amount || 0)
      }
    })
    return wallets.map(w => ({ ...w, balance: map[w.id] || 0 }))
  }, [wallets, incomes, expenses, transfers])

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

  return {
    // State
    incomes,
    expenses,
    savings,
    categories,
    wallets,
    transfers,
    investments,
    walletBalances,
    selectedMonth,
    selectedYear,
    editingIncome,
    editingExpense,
    editingSavings,
    editingCategory,
    editingWallet,
    timePeriod,
    filteredIncomes,
    filteredExpenses,
    totalIncome,
    totalExpenses,
    totalSavings,
    totalInvestments,
    netIncome,
    expensesByCategory,
    loading,
    error,
    syncState,

    // Actions
    setSelectedMonth,
    setSelectedYear,
    setTimePeriod,
    addIncome,
    addExpense,
    addSavings,
    addCategory,
    addWallet,
    addTransfer,
    addInvestment,
    deleteIncome,
    deleteExpense,
    deleteSavings,
    deleteCategory,
    deleteWallet,
    deleteTransfer,
    deleteInvestment,
    editIncome,
    updateIncome,
    editExpense,
    updateExpense,
    editSavings,
    updateSavings,
    addToSavingsGoal,
    editCategory,
    updateCategory,
    editWallet,
    updateWallet,
    updateTransfer,
    updateInvestment,
    exportToCSV
  }
}
