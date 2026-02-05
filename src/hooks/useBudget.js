import { useState, useEffect, useCallback } from 'react'
import { useFirebase } from './useFirebase'
import { incomeService, expenseService } from '../services/firebaseService'

export function useBudget() {
  const { user, loading: authLoading } = useFirebase()
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingIncome, setEditingIncome] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)
  const [viewMode, setViewMode] = useState('monthly') // 'monthly' or 'yearly'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Subscribe to Firebase data when user is authenticated
  useEffect(() => {
    if (!user || authLoading) {
      return
    }

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
              setLoading(false)
            }
          }
        )

        // Subscribe to expenses
        const unsubscribeExpenses = expenseService.subscribeToExpenses(
          user.uid,
          (expensesData) => {
            if (isMounted) {
              setExpenses(expensesData)
              setLoading(false)
            }
          }
        )

        return () => {
          unsubscribeIncomes()
          unsubscribeExpenses()
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

  const addIncome = useCallback(async (income) => {
    if (!user) return

    try {
      setError(null)
      await incomeService.addIncome(income, user.uid)
    } catch (err) {
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

  const filteredIncomes = incomes.filter(inc => {
    const date = new Date(inc.date)
    return viewMode === 'yearly' ? date.getFullYear() === selectedYear : (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear)
  })

  const filteredExpenses = expenses.filter(exp => {
    const date = new Date(exp.date)
    return viewMode === 'yearly' ? date.getFullYear() === selectedYear : (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear)
  })

  const totalIncome = filteredIncomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
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

  return {
    // State
    incomes,
    expenses,
    selectedMonth,
    selectedYear,
    editingIncome,
    editingExpense,
    viewMode,
    filteredIncomes,
    filteredExpenses,
    totalIncome,
    totalExpenses,
    netIncome,
    expensesByCategory,
    loading,
    error,

    // Actions
    setSelectedMonth,
    setSelectedYear,
    setViewMode,
    addIncome,
    addExpense,
    deleteIncome,
    deleteExpense,
    editIncome,
    updateIncome,
    editExpense,
    updateExpense,
    exportToCSV
  }
}