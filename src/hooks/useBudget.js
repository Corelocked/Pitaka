import { useState, useEffect, useCallback } from 'react'
import { useFirebase } from './useFirebase'
import { incomeService, expenseService, savingsService, categoryService } from '../services/firebaseService'

export function useBudget() {
  const { user, loading: authLoading } = useFirebase()
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [savings, setSavings] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingIncome, setEditingIncome] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)
  const [editingSavings, setEditingSavings] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
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

  const exportToCSV = () => {
    const csvContent = [
      ['Type', 'Description/Source', 'Category', 'Amount', 'Date'].join(','),
      ...filteredIncomes.map(inc => ['Income', inc.source, '', inc.amount, inc.date].join(',')),
      ...filteredExpenses.map(exp => ['Expense', exp.description, exp.category, exp.amount, exp.date].join(','))
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
      selectedMonth,
      selectedYear,
      timePeriod,
      filteredIncomesCount: filteredIncomes.length,
      filteredExpensesCount: filteredExpenses.length,
      totalIncome,
      totalExpenses
    })
  }, [user, incomes, expenses, selectedMonth, selectedYear, timePeriod, totalIncome, totalExpenses])

  return {
    // State
    incomes,
    expenses,
    savings,
    categories,
    selectedMonth,
    selectedYear,
    editingIncome,
    editingExpense,
    editingSavings,
    editingCategory,
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
    exportToCSV
  }
}