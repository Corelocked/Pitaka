import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useFirebase } from './useFirebase'
import { incomeService, expenseService, savingsService, categoryService, walletService, transferService, investmentService, subscriptionService } from '../services/firebaseService'

function formatLocalDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useBudget() {
  const { user, loading: authLoading, isPro } = useFirebase()
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [savings, setSavings] = useState([])
  const [categories, setCategories] = useState([])
  const [wallets, setWallets] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingIncome, setEditingIncome] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)
  const [editingSavings, setEditingSavings] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingWallet, setEditingWallet] = useState(null)
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [timePeriod, setTimePeriod] = useState('monthly') // 'monthly' or 'yearly'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [transfers, setTransfers] = useState([])
  const [investments, setInvestments] = useState([])
  const [syncState, setSyncState] = useState({
    hasPendingWrites: false,
    isFromCache: false
  })
  const processingSubscriptionsRef = useRef(new Set())

  const normalizeCategoryName = useCallback((value) => (
    String(value || '').trim().toLowerCase()
  ), [])

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
          console.error('Error setting up categories subscription:', err)
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
          console.error('Error setting up wallets subscription:', err)
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
          console.error('Error setting up transfers subscription:', err)
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
          console.error('Error setting up investments subscription:', err)
          unsubscribeInvestments = () => {}
          if (isMounted) setInvestments([])
        }

        let unsubscribeSubscriptions
        try {
          unsubscribeSubscriptions = subscriptionService.subscribeToSubscriptions(
            user.uid,
            (subscriptionsData) => {
              if (isMounted) setSubscriptions(subscriptionsData || [])
            },
            (metadata) => updateSyncState('subscriptions', metadata)
          )
        } catch (err) {
          console.error('Error setting up subscriptions subscription:', err)
          unsubscribeSubscriptions = () => {}
          if (isMounted) setSubscriptions([])
        }

        if (isMounted) {
          setLoading(false)
        }

        return () => {
          unsubscribeIncomes()
          unsubscribeExpenses()
          unsubscribeSavings()
          unsubscribeCategories()
          unsubscribeWallets()
          unsubscribeTransfers && typeof unsubscribeTransfers === 'function' && unsubscribeTransfers()
          unsubscribeInvestments && typeof unsubscribeInvestments === 'function' && unsubscribeInvestments()
          unsubscribeSubscriptions && typeof unsubscribeSubscriptions === 'function' && unsubscribeSubscriptions()
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
      setSubscriptions([])
      setEditingIncome(null)
      setEditingExpense(null)
      setEditingSavings(null)
      setEditingCategory(null)
      setEditingSubscription(null)
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
      const nextName = normalizeCategoryName(category?.name)

      if (!nextName) {
        throw new Error('Category name is required')
      }

      const alreadyExists = categories.some((existingCategory) => (
        normalizeCategoryName(existingCategory.name) === nextName
      ))

      if (alreadyExists) {
        throw new Error('A category with that name already exists')
      }

      await categoryService.addCategory(category, user.uid)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [categories, normalizeCategoryName, user])

  const ensureSubscriptionCategory = useCallback(async () => {
    const subscriptionCategoryName = 'subscription'
    const existingCategory = categories.some((category) => (
      normalizeCategoryName(category.name) === subscriptionCategoryName
    ))

    if (!existingCategory && user) {
      await categoryService.addCategory({
        name: 'Subscription',
        description: 'Recurring memberships and services'
      }, user.uid)
    }
  }, [categories, normalizeCategoryName, user])

  const addWallet = useCallback(async (wallet) => {
    if (!user) return

    // Optimistic UI: add a temporary wallet locally so the dropdown updates immediately
    const tempId = `temp-${Date.now()}`
    const tempWallet = {
      id: tempId,
      name: wallet.name,
      description: wallet.description || '',
      accountType: wallet.accountType || 'cash',
      startingBalance: wallet.startingBalance || 0,
      creditLimit: wallet.creditLimit || null,
      creditAlertPercent: wallet.creditAlertPercent || null,
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
    try {
      setError(null)
      const categoryToDelete = categories.find((category) => category.id === id)
      const categoryName = categoryToDelete?.name || ''
      const linkedExpenses = expenses.filter((expense) => expense.category === categoryName)

      if (linkedExpenses.length > 0) {
        await Promise.all(
          linkedExpenses.map((expense) => (
            expenseService.updateExpense(expense.id, { category: '' })
          ))
        )
      }

      await categoryService.deleteCategory(id)
      setEditingCategory((current) => (current?.id === id ? null : current))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [categories, expenses])

  const editCategory = useCallback((category) => {
    setEditingCategory(category)
  }, [])

  const updateCategory = useCallback(async (updatedCategory) => {
    try {
      setError(null)
      const nextName = normalizeCategoryName(updatedCategory?.name)

      if (!nextName) {
        throw new Error('Category name is required')
      }

      const alreadyExists = categories.some((category) => (
        category.id !== updatedCategory.id &&
        normalizeCategoryName(category.name) === nextName
      ))

      if (alreadyExists) {
        throw new Error('A category with that name already exists')
      }

      const previousCategory = categories.find((category) => category.id === updatedCategory.id)
      const { id, ...updates } = updatedCategory
      await categoryService.updateCategory(id, updates)

      const previousName = previousCategory?.name || ''
      const nextDisplayName = updatedCategory.name

      if (previousName && previousName !== nextDisplayName) {
        const linkedExpenses = expenses.filter((expense) => expense.category === previousName)

        if (linkedExpenses.length > 0) {
          await Promise.all(
            linkedExpenses.map((expense) => (
              expenseService.updateExpense(expense.id, { category: nextDisplayName })
            ))
          )
        }
      }

      setEditingCategory(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [categories, expenses, normalizeCategoryName])

  const normalizeDateKey = useCallback((dateValue) => {
    if (!dateValue) return null
    const date = new Date(`${dateValue}T00:00:00`)
    return formatLocalDateKey(date)
  }, [])

  const addDays = useCallback((dateValue, days) => {
    const nextDate = new Date(`${dateValue}T00:00:00`)
    nextDate.setDate(nextDate.getDate() + days)
    return formatLocalDateKey(nextDate)
  }, [])

  const addMonths = useCallback((dateValue, months) => {
    const baseDate = new Date(`${dateValue}T00:00:00`)
    const day = baseDate.getDate()
    const target = new Date(baseDate)
    target.setMonth(target.getMonth() + months, 1)
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
    target.setDate(Math.min(day, lastDay))
    return formatLocalDateKey(target)
  }, [])

  const nextSubscriptionDate = useCallback((subscription, currentDate) => {
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
  }, [addDays, addMonths])

  const getCurrentDueDate = useCallback((subscription, todayKey) => {
    const firstDate = normalizeDateKey(subscription.nextDueDate || subscription.nextRunDate || subscription.startDate)
    if (!firstDate) return null
    if (firstDate > todayKey) return null

    let dueDate = firstDate
    let nextDate = nextSubscriptionDate(subscription, dueDate)

    while (nextDate && nextDate <= todayKey) {
      dueDate = nextDate
      nextDate = nextSubscriptionDate(subscription, dueDate)
    }

    return dueDate
  }, [nextSubscriptionDate, normalizeDateKey])

  const getFirstFutureDueDate = useCallback((subscription, afterDateKey) => {
    const firstDate = normalizeDateKey(subscription.startDate)
    if (!firstDate) return null
    if (firstDate > afterDateKey) return firstDate

    let nextDueDate = firstDate
    while (nextDueDate && nextDueDate <= afterDateKey) {
      nextDueDate = nextSubscriptionDate(subscription, nextDueDate)
    }

    return nextDueDate
  }, [nextSubscriptionDate, normalizeDateKey])

  const addSubscription = useCallback(async (subscription) => {
    if (!user) return

    try {
      setError(null)
      if (!isPro) {
        throw new Error('Subscriptions are part of Pitaka Pro')
      }
      await ensureSubscriptionCategory()
      const nextDueDate = normalizeDateKey(subscription.startDate)

      await subscriptionService.addSubscription({
        ...subscription,
        category: 'Subscription',
        lastPostedDate: null,
        nextDueDate
      }, user.uid)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [ensureSubscriptionCategory, isPro, normalizeDateKey, user])

  const editSubscription = useCallback((subscription) => {
    setEditingSubscription(subscription)
  }, [])

  const updateSubscription = useCallback(async (updatedSubscription) => {
    try {
      setError(null)
      if (!isPro) {
        throw new Error('Subscriptions are part of Pitaka Pro')
      }
      await ensureSubscriptionCategory()
      const { id, ...updates } = updatedSubscription
      const scheduleChanged = (
        editingSubscription?.startDate !== updates.startDate ||
        editingSubscription?.intervalType !== updates.intervalType ||
        Number(editingSubscription?.customIntervalDays || 0) !== Number(updates.customIntervalDays || 0)
      )
      const nextDueDate = scheduleChanged
        ? normalizeDateKey(updates.startDate)
        : undefined
      await subscriptionService.updateSubscription(id, {
        ...updates,
        category: 'Subscription',
        ...(scheduleChanged
          ? {
              lastPostedDate: null,
              nextDueDate
            }
          : {})
      })
      setEditingSubscription(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [editingSubscription, ensureSubscriptionCategory, isPro, normalizeDateKey])

  const deleteSubscription = useCallback(async (id) => {
    try {
      setError(null)
      await subscriptionService.deleteSubscription(id)
      setEditingSubscription((current) => (current?.id === id ? null : current))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const postSubscriptionBill = useCallback(async (subscriptionId) => {
    if (!user) {
      throw new Error('Please sign in to post a bill')
    }

    const subscription = subscriptions.find((entry) => entry.id === subscriptionId)

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    const dueDate = normalizeDateKey(subscription.nextDueDate || subscription.nextRunDate || subscription.startDate)

    if (!dueDate) {
      throw new Error('Subscription is missing a valid due date')
    }

    const alreadyPosted = expenses.some((expense) => (
      expense.subscriptionId === subscriptionId &&
      normalizeDateKey(expense.date) === dueDate
    ))

    if (alreadyPosted) {
      throw new Error('This bill has already been posted')
    }

    try {
      setError(null)
      await ensureSubscriptionCategory()
      await expenseService.addExpense({
        description: subscription.name,
        category: 'Subscription',
        amount: parseFloat(subscription.amount || 0),
        date: dueDate,
        walletId: subscription.walletId || null,
        currency: subscription.currency || null,
        subscriptionId: subscription.id,
        isAutoGenerated: true,
        postingSource: 'auto-next-due'
      }, user.uid)

      await subscriptionService.updateSubscription(subscription.id, {
        lastPostedDate: dueDate,
        nextDueDate: nextSubscriptionDate(subscription, dueDate)
      })
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [ensureSubscriptionCategory, expenses, nextSubscriptionDate, normalizeDateKey, subscriptions, user])

  useEffect(() => {
    if (!user || !isPro || subscriptions.length === 0) {
      return
    }

    const todayKey = formatLocalDateKey(new Date())

    subscriptions.forEach((subscription) => {
      if (!subscription?.id || subscription.isActive === false) {
        return
      }

      if (processingSubscriptionsRef.current.has(subscription.id)) {
        return
      }

      const dueDate = getCurrentDueDate(subscription, todayKey)

      if (!dueDate) {
        return
      }

      const alreadyPosted = expenses.some((expense) => (
        expense.subscriptionId === subscription.id &&
        normalizeDateKey(expense.date) === dueDate
      ))

      if (alreadyPosted) {
        const nextDueDate = nextSubscriptionDate(subscription, dueDate)
        const storedNextDueDate = normalizeDateKey(subscription.nextDueDate || subscription.nextRunDate)

        if (nextDueDate && storedNextDueDate !== nextDueDate) {
          processingSubscriptionsRef.current.add(subscription.id)
          Promise.resolve()
            .then(() => (
              subscriptionService.updateSubscription(subscription.id, {
                lastPostedDate: dueDate,
                nextDueDate
              })
            ))
            .catch((err) => {
              console.error('Failed to advance already-posted subscription:', err)
              setError(err.message)
            })
            .finally(() => {
              processingSubscriptionsRef.current.delete(subscription.id)
            })
        }
        return
      }

      processingSubscriptionsRef.current.add(subscription.id)

      Promise.resolve()
        .then(async () => {
          await ensureSubscriptionCategory()
          await expenseService.addExpense({
            description: subscription.name,
            category: 'Subscription',
            amount: parseFloat(subscription.amount || 0),
            date: dueDate,
            walletId: subscription.walletId || null,
            currency: subscription.currency || null,
            subscriptionId: subscription.id,
            isAutoGenerated: true,
            postingSource: 'auto-next-due'
          }, user.uid)

          await subscriptionService.updateSubscription(subscription.id, {
            lastPostedDate: dueDate,
            nextDueDate: nextSubscriptionDate(subscription, dueDate)
          })
        })
        .catch((err) => {
          console.error('Failed to auto-process subscription:', err)
          setError(err.message)
        })
        .finally(() => {
          processingSubscriptionsRef.current.delete(subscription.id)
        })
    })
  }, [ensureSubscriptionCategory, expenses, getCurrentDueDate, isPro, nextSubscriptionDate, normalizeDateKey, subscriptions, user])

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

  const visibleExpenses = useMemo(() => (
    expenses.filter((expense) => (
      !expense?.subscriptionId ||
      expense?.postingSource === 'manual-post-bill' ||
      expense?.postingSource === 'auto-next-due'
    ))
  ), [expenses])

  const filteredIncomes = incomes.filter(inc => {
    const date = new Date(inc.date)
    return timePeriod === 'yearly' ? date.getFullYear() === selectedYear : (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear)
  })

  const filteredExpenses = visibleExpenses.filter(exp => {
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
    ...visibleExpenses.map(exp => exp.category).filter(Boolean)
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
    visibleExpenses.forEach(e => {
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
  }, [wallets, incomes, visibleExpenses, transfers])

  const creditCardSummaries = useMemo(() => {
    return walletBalances
      .filter((wallet) => wallet.accountType === 'credit')
      .map((wallet) => {
        const creditLimit = parseFloat(wallet.creditLimit || 0)
        const spent = Math.max(parseFloat(wallet.balance || 0) * -1, 0)
        const available = creditLimit > 0 ? creditLimit - spent : 0
        const utilization = creditLimit > 0 ? (spent / creditLimit) * 100 : 0
        const alertPercent = parseFloat(wallet.creditAlertPercent || 80)

        let status = 'ok'
        if (creditLimit > 0 && utilization >= 100) {
          status = 'maxed'
        } else if (creditLimit > 0 && utilization >= alertPercent) {
          status = 'warning'
        }

        return {
          ...wallet,
          creditLimit,
          spent,
          available,
          utilization,
          alertPercent,
          status
        }
      })
      .sort((a, b) => b.utilization - a.utilization)
  }, [walletBalances])

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
    expenses: visibleExpenses,
    savings,
    categories,
    wallets,
    subscriptions,
    transfers,
    investments,
    walletBalances,
    creditCardSummaries,
    selectedMonth,
    selectedYear,
    editingIncome,
    editingExpense,
    editingSavings,
    editingCategory,
    editingWallet,
    editingSubscription,
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
    addSubscription,
    postSubscriptionBill,
    addTransfer,
    addInvestment,
    deleteIncome,
    deleteExpense,
    deleteSavings,
    deleteCategory,
    deleteWallet,
    deleteSubscription,
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
    editSubscription,
    updateWallet,
    updateSubscription,
    updateTransfer,
    updateInvestment,
    exportToCSV
  }
}
