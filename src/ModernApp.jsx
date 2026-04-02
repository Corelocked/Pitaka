import { Suspense, lazy, useContext, useEffect, useState } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { FirebaseContext } from './contexts/FirebaseContext'
import { useConfirm } from './contexts/useConfirm'
import { useBudget } from './hooks/useBudget'
import { useDashboardWidgets } from './hooks/useDashboardWidgets'
import Dashboard from './components/Dashboard'
import TransfersTable from './components/TransfersTable'
import {
  ActivityIcon,
  CategoryIcon,
  ChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ExpenseIcon,
  HomeIcon,
  IncomeIcon,
  LogoutIcon,
  SettingsIcon,
  TemplateIcon,
  TransferIcon,
  TrendUpIcon,
  UploadIcon,
  WalletIcon
} from './components/Icons'
import { exportToExcel, importFromExcel, downloadImportTemplate } from './utils/excelUtils'
import { createProCheckoutSession } from './services/billingService'
import { DEFAULT_CURRENCY, formatCurrency, formatCurrencySummary, summarizeByCurrency } from './utils/currency'

const Auth = lazy(() => import('./components/Auth'))
const Landing = lazy(() => import('./components/Landing'))
const Blog = lazy(() => import('./components/Blog'))
const IncomeForm = lazy(() => import('./components/IncomeForm'))
const ExpenseForm = lazy(() => import('./components/ExpenseForm'))
const TransferForm = lazy(() => import('./components/TransferForm'))
const WalletForm = lazy(() => import('./components/WalletForm'))
const CategoryForm = lazy(() => import('./components/CategoryForm'))
const SubscriptionForm = lazy(() => import('./components/SubscriptionForm'))
const SavingsForm = lazy(() => import('./components/SavingsForm'))
const AddToSavingsForm = lazy(() => import('./components/AddToSavingsForm'))
const IncomeTable = lazy(() => import('./components/IncomeTable'))
const ExpenseTable = lazy(() => import('./components/ExpenseTable'))
const WalletsTable = lazy(() => import('./components/WalletsTable'))
const CategoryTable = lazy(() => import('./components/CategoryTable'))
const SubscriptionsTable = lazy(() => import('./components/SubscriptionsTable'))
const InvestmentForm = lazy(() => import('./components/InvestmentForm'))
const InvestmentsTable = lazy(() => import('./components/InvestmentsTable'))

const DASHBOARD_LAYOUTS = [
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-like pacing with big lead visuals, balanced pairs, and a calm closing rail.'
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense but orderly scanning layout that keeps the most practical cards within quick reach.'
  },
  {
    id: 'planner',
    name: 'Planner',
    description: 'Goal-first composition that surfaces savings, pressure points, and planning signals before activity.'
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Your personalized dashboard arrangement, visibility choices, and reorder decisions.'
  }
]

const DASHBOARD_WIDGET_LIBRARY = [
  {
    id: 'recent-activity',
    name: 'Recent Activity',
    description: 'Shows the latest income, expense, and transfer movements.'
  },
  {
    id: 'spending',
    name: 'Spending by Category',
    description: 'Highlights category pressure for the current month.'
  },
  {
    id: 'accounts',
    name: 'Accounts',
    description: 'Displays wallet balances and account health at a glance.'
  },
  {
    id: 'savings',
    name: 'Savings Goals',
    description: 'Keeps progress toward reserved goals in view.'
  },
  {
    id: 'cashflow-chart',
    name: 'Cashflow Snapshot',
    description: 'Compares income, expenses, and net position in one visual.'
  },
  {
    id: 'income-source-chart',
    name: 'Income by Source',
    description: 'Breaks down income sources for the current month.'
  },
  {
    id: 'weekly-spending-chart',
    name: 'Weekly Spending Trend',
    description: 'Shows how spending is distributed across the month.'
  },
  {
    id: 'expense-trend-chart',
    name: 'Expense Trend',
    description: 'Tracks expense flow across the current month.'
  },
  {
    id: 'account-allocation-chart',
    name: 'Account Allocation',
    description: 'Breaks down where total balance is currently sitting.'
  },
  {
    id: 'upcoming-bills',
    name: 'Upcoming Bills',
    description: 'Shows the next subscription charges due soon and lets you confirm each bill before it becomes an expense.',
    requiresPro: true
  }
]

const DASHBOARD_LAYOUT_SECTION_DEFAULTS = {
  editorial: {
    mainOrder: ['cashflow-chart', 'spending', 'income-source-chart', 'accounts', 'recent-activity'],
    sideOrder: ['savings', 'upcoming-bills', 'weekly-spending-chart', 'expense-trend-chart', 'account-allocation-chart'],
    desktopTileSizes: {
      'cashflow-chart': 'large',
      spending: 'medium',
      'income-source-chart': 'medium',
      accounts: 'medium',
      'recent-activity': 'medium',
      savings: 'large',
      'upcoming-bills': 'medium',
      'weekly-spending-chart': 'small',
      'expense-trend-chart': 'small',
      'account-allocation-chart': 'small'
    }
  },
  compact: {
    mainOrder: ['recent-activity', 'accounts', 'spending', 'cashflow-chart', 'income-source-chart'],
    sideOrder: ['upcoming-bills', 'weekly-spending-chart', 'expense-trend-chart', 'account-allocation-chart', 'savings'],
    desktopTileSizes: {
      'recent-activity': 'large',
      accounts: 'medium',
      spending: 'medium',
      'cashflow-chart': 'medium',
      'income-source-chart': 'medium',
      'upcoming-bills': 'medium',
      'weekly-spending-chart': 'small',
      'expense-trend-chart': 'small',
      'account-allocation-chart': 'small',
      savings: 'medium'
    }
  },
  planner: {
    mainOrder: ['savings', 'spending', 'cashflow-chart', 'accounts', 'recent-activity'],
    sideOrder: ['upcoming-bills', 'weekly-spending-chart', 'expense-trend-chart', 'account-allocation-chart', 'income-source-chart'],
    desktopTileSizes: {
      savings: 'large',
      spending: 'medium',
      'cashflow-chart': 'medium',
      accounts: 'medium',
      'recent-activity': 'medium',
      'upcoming-bills': 'medium',
      'weekly-spending-chart': 'small',
      'expense-trend-chart': 'small',
      'account-allocation-chart': 'small',
      'income-source-chart': 'large'
    }
  }
}

const DASHBOARD_WIDGET_IDS = DASHBOARD_WIDGET_LIBRARY.map((widget) => widget.id)
const DASHBOARD_DESKTOP_TILE_SIZES = ['small', 'medium', 'large']
const BUILT_IN_DASHBOARD_LAYOUT_IDS = DASHBOARD_LAYOUTS.filter((layout) => layout.id !== 'custom').map((layout) => layout.id)

const getCompletedDashboardSections = (layoutId = 'editorial') => {
  const defaults = DASHBOARD_LAYOUT_SECTION_DEFAULTS[layoutId] || DASHBOARD_LAYOUT_SECTION_DEFAULTS.editorial
  const used = new Set()
  const normalize = (list = []) => list.filter((id) => {
    if (!DASHBOARD_WIDGET_IDS.includes(id) || used.has(id)) return false
    used.add(id)
    return true
  })

  const mainOrder = normalize(defaults.mainOrder)
  const sideOrder = normalize(defaults.sideOrder)

  DASHBOARD_WIDGET_IDS.forEach((id) => {
    if (!used.has(id)) {
      sideOrder.push(id)
      used.add(id)
    }
  })

  const desktopTileSizes = DASHBOARD_WIDGET_IDS.reduce((accumulator, id) => {
    const size = defaults.desktopTileSizes?.[id]
    accumulator[id] = DASHBOARD_DESKTOP_TILE_SIZES.includes(size) ? size : 'medium'
    return accumulator
  }, {})

  return { mainOrder, sideOrder, desktopTileSizes }
}

const getDefaultDesktopTileOrder = (layoutId = 'editorial') => {
  const defaults = getCompletedDashboardSections(layoutId)
  return [...defaults.mainOrder, ...defaults.sideOrder]
}

const getDefaultMobileWidgetOrder = (layoutId = 'editorial') => {
  const defaults = getCompletedDashboardSections(layoutId)
  return [...defaults.mainOrder, ...defaults.sideOrder]
}

const createDashboardCustomization = (layoutId = 'editorial') => {
  const resolvedLayoutId = BUILT_IN_DASHBOARD_LAYOUT_IDS.includes(layoutId) ? layoutId : 'editorial'
  const defaults = getCompletedDashboardSections(resolvedLayoutId)
  const desktopTileOrder = getDefaultDesktopTileOrder(resolvedLayoutId)
  const mobileWidgetOrder = getDefaultMobileWidgetOrder(resolvedLayoutId)

  return {
    layoutStyle: resolvedLayoutId,
    showHero: true,
    showMetrics: true,
    mainOrder: [...defaults.mainOrder],
    sideOrder: [...defaults.sideOrder],
    hiddenSectionIds: [],
    mobileWidgetOrder,
    desktopTileOrder,
    desktopTileSizes: { ...defaults.desktopTileSizes }
  }
}

const sanitizeDashboardCustomization = (layoutId, customization) => {
  const defaults = createDashboardCustomization(layoutId)

  if (!customization || typeof customization !== 'object') {
    return defaults
  }

  const seen = new Set()
  const normalizeOrder = (value, fallback) => {
    if (!Array.isArray(value)) return [...fallback]

    const filtered = value.filter((id) => {
      if (!DASHBOARD_WIDGET_IDS.includes(id) || seen.has(id)) return false
      seen.add(id)
      return true
    })

    fallback.forEach((id) => {
      if (!seen.has(id)) {
        filtered.push(id)
        seen.add(id)
      }
    })

    return filtered
  }

  const mainOrder = normalizeOrder(customization.mainOrder, defaults.mainOrder)
  const sideOrder = normalizeOrder(customization.sideOrder, defaults.sideOrder)
  const hiddenSectionIds = Array.isArray(customization.hiddenSectionIds)
    ? customization.hiddenSectionIds.filter((id, index, list) => (
      DASHBOARD_WIDGET_IDS.includes(id) &&
      list.indexOf(id) === index
    ))
    : []
  const desktopTileOrder = Array.isArray(customization.desktopTileOrder)
    ? (() => {
      const seenDesktop = new Set()
      const filtered = customization.desktopTileOrder.filter((id) => {
        if (!DASHBOARD_WIDGET_IDS.includes(id) || seenDesktop.has(id)) return false
        seenDesktop.add(id)
        return true
      })
      DASHBOARD_WIDGET_IDS.forEach((id) => {
        if (!seenDesktop.has(id)) filtered.push(id)
      })
      return filtered
    })()
    : getDefaultDesktopTileOrder(layoutId)
  const mobileWidgetOrder = Array.isArray(customization.mobileWidgetOrder)
    ? (() => {
      const seenMobile = new Set()
      const filtered = customization.mobileWidgetOrder.filter((id) => {
        if (!DASHBOARD_WIDGET_IDS.includes(id) || seenMobile.has(id)) return false
        seenMobile.add(id)
        return true
      })
      DASHBOARD_WIDGET_IDS.forEach((id) => {
        if (!seenMobile.has(id)) filtered.push(id)
      })
      return filtered
    })()
    : getDefaultMobileWidgetOrder(layoutId)
  const desktopTileSizes = DASHBOARD_WIDGET_IDS.reduce((accumulator, id) => {
    const size = customization.desktopTileSizes?.[id]
    accumulator[id] = DASHBOARD_DESKTOP_TILE_SIZES.includes(size) ? size : 'medium'
    return accumulator
  }, {})

  return {
    layoutStyle: BUILT_IN_DASHBOARD_LAYOUT_IDS.includes(customization.layoutStyle) ? customization.layoutStyle : defaults.layoutStyle,
    showHero: customization.showHero !== false,
    showMetrics: customization.showMetrics !== false,
    mainOrder,
    sideOrder,
    hiddenSectionIds,
    mobileWidgetOrder,
    desktopTileOrder,
    desktopTileSizes
  }
}

const THEME_OPTIONS = [
  {
    id: 'light',
    name: 'Light',
    description: 'Warm atelier palette with bright paper surfaces and emerald accents.'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Low-glare workspace with deep surfaces and softened contrast for evening use.'
  }
]

const PRO_PRICE_AMOUNT = Number(import.meta.env.VITE_PITAKA_PRO_PRICE_AMOUNT || 50000)
const PRO_PRICE_CURRENCY = String(import.meta.env.VITE_PITAKA_PRO_PRICE_CURRENCY || 'PHP').toUpperCase()
const PRO_PAYMENT_METHOD_LABEL = String(import.meta.env.VITE_PITAKA_PRO_PAYMENT_METHOD_LABEL || 'QRPh')
const APP_DISTRIBUTION_INVITE_URL = String(
  import.meta.env.VITE_PITAKA_ANDROID_APP_LINK || 'https://appdistribution.firebase.dev/i/38bbfb06c25cca98'
)

function SectionFallback({ label = 'Loading section...' }) {
  return (
    <div className="card page-hero-card" aria-live="polite">
      <div className="card-header">
        <div>
          <h3 className="card-title">{label}</h3>
          <p className="card-subtitle">Preparing the next view.</p>
        </div>
      </div>
    </div>
  )
}

function ModernApp() {
  const { isAuthenticated, loading: authLoading, logout, user, userProfile, isPro } = useContext(FirebaseContext)
  const confirm = useConfirm()
  const isNativeMobileApp = Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android'
  const [publicPath, setPublicPath] = useState(() => {
    if (typeof window === 'undefined') return '/'
    return window.location.pathname || '/'
  })
  const [currentView, setCurrentView] = useState('dashboard')
  const shouldLoadSubscriptions = isPro && ['dashboard', 'subscriptions'].includes(currentView)
  const shouldLoadInvestments = isPro && ['wealth', 'investments', 'settings'].includes(currentView)
  const {
    selectedMonth,
    selectedYear,
    editingIncome,
    editingExpense,
    editingSavings,
    editingCategory,
    editingSubscription,
    totalIncome,
    totalExpenses,
    totalSavings,
    netIncome,
    expensesByCategory,
    filteredIncomes,
    filteredExpenses,
    categories,
    subscriptions,
    loading: budgetLoading,
    error,
    syncState,
    setSelectedMonth,
    setSelectedYear,
    addIncome,
    addExpense,
    addSavings,
    addCategory,
    addSubscription,
    deleteIncome,
    deleteExpense,
    deleteSavings,
    deleteCategory,
    deleteSubscription,
    editIncome,
    updateIncome,
    editExpense,
    updateExpense,
    editSavings,
    updateSavings,
    editCategory,
    editSubscription,
    updateCategory,
    updateSubscription,
    addToSavingsGoal,
    walletBalances,
    addWallet,
    deleteWallet,
    updateWallet,
    addTransfer,
    deleteTransfer,
    transfers,
    investments,
    savings,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    incomes,
    expenses,
    wallets
  } = useBudget({
    enableInvestments: shouldLoadInvestments,
    enableSubscriptions: shouldLoadSubscriptions
  })

  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [bottomSheetContent, setBottomSheetContent] = useState(null)
  const [isDesktopDashboardEditMode, setIsDesktopDashboardEditMode] = useState(false)
  const [isMobileDashboardEditMode, setIsMobileDashboardEditMode] = useState(false)
  const [isOnline, setIsOnline] = useState(() => (
    typeof navigator === 'undefined' ? true : navigator.onLine
  ))
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null)
  const [billingStatus, setBillingStatus] = useState(null)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  })
  const [dashboardLayoutPreferences, setDashboardLayoutPreferences] = useState(() => {
    if (typeof window === 'undefined') return {}

    try {
      const raw = window.localStorage.getItem('pitaka.dashboardLayouts')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [themePreferences, setThemePreferences] = useState(() => {
    if (typeof window === 'undefined') return {}

    try {
      const raw = window.localStorage.getItem('pitaka.themePreferences')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [dashboardCustomizationPreferences, setDashboardCustomizationPreferences] = useState(() => {
    if (typeof window === 'undefined') return {}

    try {
      const raw = window.localStorage.getItem('pitaka.dashboardCustomizationPreferences')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  const dashboardLayout = user?.uid && dashboardLayoutPreferences[user.uid]
    ? dashboardLayoutPreferences[user.uid]
    : 'editorial'
  const savedCustomDashboardCustomization = user?.uid ? dashboardCustomizationPreferences[user.uid] : null
  const effectiveDashboardLayout = dashboardLayout === 'custom'
    ? sanitizeDashboardCustomization(
        savedCustomDashboardCustomization?.layoutStyle || 'editorial',
        savedCustomDashboardCustomization
      )
    : createDashboardCustomization(dashboardLayout)
  const themePreference = user?.uid && themePreferences[user.uid]
    ? themePreferences[user.uid]
    : 'light'
  const dashboardCustomization = effectiveDashboardLayout
  const dashboardLayoutStyle = dashboardLayout === 'custom'
    ? dashboardCustomization.layoutStyle || 'editorial'
    : dashboardLayout
  const availableDashboardWidgets = DASHBOARD_WIDGET_LIBRARY.filter((widget) => !widget.requiresPro || isPro)

  const storePendingQuickAction = (action) => {
    if (typeof window === 'undefined' || !action) return
    window.localStorage.setItem('pitaka.pendingQuickAction', action)
  }

  const consumePendingQuickAction = () => {
    if (typeof window === 'undefined') return null
    const action = window.localStorage.getItem('pitaka.pendingQuickAction')
    if (action) {
      window.localStorage.removeItem('pitaka.pendingQuickAction')
    }
    return action
  }

  const handleQuickAction = (action) => {
    if (!action) return

    if (!isAuthenticated) {
      storePendingQuickAction(action)
      return
    }

    setCurrentView('dashboard')

    switch (action) {
      case 'income':
        openBottomSheet('addIncome')
        break
      case 'expense':
        openBottomSheet('addExpense')
        break
      case 'transfer':
        openBottomSheet('addTransfer')
        break
      case 'goal':
        openBottomSheet('addSavings')
        break
      case 'subscription':
        if (isPro) {
          openSubscriptionSheet()
        } else {
          setCurrentView('pro')
        }
        break
      default:
        break
    }
  }

  useDashboardWidgets({
    isAuthenticated,
    selectedMonth,
    selectedYear,
    filteredIncomes,
    filteredExpenses,
    transfers,
    walletBalances,
    savings,
    expensesByCategory
  })

  const persistDashboardCustomization = (nextCustomization) => {
    if (!user?.uid) return

    const baseLayoutStyle = dashboardLayout === 'custom'
      ? dashboardLayoutStyle
      : dashboardLayout
    const sanitizedCustomization = sanitizeDashboardCustomization(baseLayoutStyle, {
      ...nextCustomization,
      layoutStyle: nextCustomization.layoutStyle || baseLayoutStyle
    })
    const nextCustomizationPreferences = {
      ...dashboardCustomizationPreferences,
      [user.uid]: sanitizedCustomization
    }
    const nextLayoutPreferences = {
      ...dashboardLayoutPreferences,
      [user.uid]: 'custom'
    }

    setDashboardCustomizationPreferences(nextCustomizationPreferences)
    setDashboardLayoutPreferences(nextLayoutPreferences)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pitaka.dashboardCustomizationPreferences', JSON.stringify(nextCustomizationPreferences))
      window.localStorage.setItem('pitaka.dashboardLayouts', JSON.stringify(nextLayoutPreferences))
    }
  }

  const updateDashboardLayout = (layoutId) => {
    if (!user?.uid) return

    const nextLayoutPreferences = {
      ...dashboardLayoutPreferences,
      [user.uid]: layoutId
    }

    setDashboardLayoutPreferences(nextLayoutPreferences)

    if (layoutId === 'custom' && !savedCustomDashboardCustomization) {
      const nextCustomizationPreferences = {
        ...dashboardCustomizationPreferences,
        [user.uid]: sanitizeDashboardCustomization(dashboardLayoutStyle, {
          ...dashboardCustomization,
          layoutStyle: dashboardLayoutStyle
        })
      }

      setDashboardCustomizationPreferences(nextCustomizationPreferences)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('pitaka.dashboardCustomizationPreferences', JSON.stringify(nextCustomizationPreferences))
      }
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pitaka.dashboardLayouts', JSON.stringify(nextLayoutPreferences))
    }
  }

  const updateThemePreference = (themeId) => {
    if (!user?.uid) return

    const nextPreferences = {
      ...themePreferences,
      [user.uid]: themeId
    }

    setThemePreferences(nextPreferences)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pitaka.themePreferences', JSON.stringify(nextPreferences))
    }
  }

  const toggleDashboardArea = (areaKey) => {
    persistDashboardCustomization({
      ...dashboardCustomization,
      [areaKey]: !dashboardCustomization[areaKey]
    })
  }

  const moveDashboardWidget = (sectionId, column, direction) => {
    const key = column === 'side' ? 'sideOrder' : 'mainOrder'
    const order = [...dashboardCustomization[key]]
    const currentIndex = order.indexOf(sectionId)
    if (currentIndex === -1) return

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (nextIndex < 0 || nextIndex >= order.length) return

    ;[order[currentIndex], order[nextIndex]] = [order[nextIndex], order[currentIndex]]

    persistDashboardCustomization({
      ...dashboardCustomization,
      [key]: order
    })
  }

  const moveDashboardWidgetToColumn = (sectionId, targetColumn) => {
    const sourceColumn = dashboardCustomization.mainOrder.includes(sectionId) ? 'mainOrder' : 'sideOrder'
    const destinationColumn = targetColumn === 'side' ? 'sideOrder' : 'mainOrder'

    if (sourceColumn === destinationColumn) return

    persistDashboardCustomization({
      ...dashboardCustomization,
      [sourceColumn]: dashboardCustomization[sourceColumn].filter((id) => id !== sectionId),
      [destinationColumn]: [...dashboardCustomization[destinationColumn], sectionId]
    })
  }

  const toggleDashboardWidgetVisibility = (sectionId) => {
    const isHidden = dashboardCustomization.hiddenSectionIds.includes(sectionId)

    persistDashboardCustomization({
      ...dashboardCustomization,
      hiddenSectionIds: isHidden
        ? dashboardCustomization.hiddenSectionIds.filter((id) => id !== sectionId)
        : [...dashboardCustomization.hiddenSectionIds, sectionId]
    })
  }

  const resetDashboardCustomization = () => {
    persistDashboardCustomization(createDashboardCustomization(dashboardLayoutStyle))
  }

  const deleteMany = async (rows, deleteHandler) => {
    if (!Array.isArray(rows) || rows.length === 0 || typeof deleteHandler !== 'function') return
    await Promise.all(rows.map((row) => deleteHandler(row.id)))
  }

  const moveDashboardDesktopTile = (draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return

    const nextOrder = [...dashboardCustomization.desktopTileOrder]
    const draggedIndex = nextOrder.indexOf(draggedId)
    const targetIndex = nextOrder.indexOf(targetId)
    if (draggedIndex === -1 || targetIndex === -1) return

    nextOrder.splice(draggedIndex, 1)
    nextOrder.splice(targetIndex, 0, draggedId)

    persistDashboardCustomization({
      ...dashboardCustomization,
      desktopTileOrder: nextOrder
    })
  }

  const updateDashboardDesktopTileSize = (tileId, size) => {
    if (!DASHBOARD_WIDGET_IDS.includes(tileId) || !DASHBOARD_DESKTOP_TILE_SIZES.includes(size)) return

    persistDashboardCustomization({
      ...dashboardCustomization,
      desktopTileSizes: {
        ...dashboardCustomization.desktopTileSizes,
        [tileId]: size
      }
    })
  }

  const moveMobileDashboardWidget = (draggedId, targetId, placement = 'before') => {
    if (!draggedId || !targetId || draggedId === targetId) return

    const nextOrder = [...dashboardCustomization.mobileWidgetOrder]
    const draggedIndex = nextOrder.indexOf(draggedId)
    const targetIndex = nextOrder.indexOf(targetId)
    if (draggedIndex === -1 || targetIndex === -1) return

    nextOrder.splice(draggedIndex, 1)

    const adjustedTargetIndex = nextOrder.indexOf(targetId)
    if (adjustedTargetIndex === -1) return

    const insertionIndex = placement === 'after'
      ? adjustedTargetIndex + 1
      : adjustedTargetIndex

    nextOrder.splice(insertionIndex, 0, draggedId)

    persistDashboardCustomization({
      ...dashboardCustomization,
      mobileWidgetOrder: nextOrder
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredInstallPrompt(event)
    }
    const handleInstalled = () => {
      setIsInstalled(true)
      setDeferredInstallPrompt(null)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.body.dataset.theme = themePreference
    document.documentElement.style.colorScheme = themePreference
  }, [themePreference])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const view = params.get('view')
    const billing = params.get('billing')
    const quickAction = params.get('quickAction')

    if (view === 'pro') {
      setCurrentView('pro')
    }

    if (billing === 'success') {
      setBillingStatus('success')
    } else if (billing === 'cancelled') {
      setBillingStatus('cancelled')
    }

    if (quickAction) {
      handleQuickAction(quickAction)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleLocationChange = () => {
      setPublicPath(window.location.pathname || '/')
    }

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

  const openPublicRoute = (nextPath) => {
    if (typeof window === 'undefined') return
    window.history.pushState(null, '', nextPath)
    setPublicPath(nextPath)
  }

  useEffect(() => {
    let removeListener = null

    CapacitorApp.getLaunchUrl()
      .then((result) => {
        const url = result?.url
        if (!url) return
        try {
          const parsed = new URL(url)
          handleQuickAction(parsed.searchParams.get('quickAction'))
        } catch {
          // ignore malformed deep links
        }
      })
      .catch(() => {})

    CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      if (!url) return
      try {
        const parsed = new URL(url)
        handleQuickAction(parsed.searchParams.get('quickAction'))
      } catch {
        // ignore malformed deep links
      }
    }).then((listener) => {
      removeListener = listener
    }).catch(() => {})

    return () => {
      removeListener?.remove?.()
    }
  }, [isAuthenticated, isPro])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    const pendingAction = consumePendingQuickAction()
    if (pendingAction) {
      handleQuickAction(pendingAction)
    }
  }, [isAuthenticated, authLoading, isPro])

  const installApp = async () => {
    if (!deferredInstallPrompt) return

    deferredInstallPrompt.prompt()
    const choice = await deferredInstallPrompt.userChoice

    if (choice?.outcome === 'accepted') {
      setDeferredInstallPrompt(null)
    }
  }

  const startProCheckout = async () => {
    if (!user?.uid || !user?.email) {
      throw new Error('Please sign in with an email-backed account first')
    }

    setIsStartingCheckout(true)

    try {
      const session = await createProCheckoutSession({
        userId: user.uid,
        email: user.email,
        name: user.displayName || user.email
      })

      if (!session.checkoutUrl) {
        throw new Error('Missing PayMongo checkout URL')
      }

      window.location.href = session.checkoutUrl
    } finally {
      setIsStartingCheckout(false)
    }
  }

  // Open bottom sheet with specific content
  const openBottomSheet = (content) => {
    setBottomSheetContent(content)
    setShowBottomSheet(true)
  }

  const closeBottomSheet = () => {
    setShowBottomSheet(false)
    setTimeout(() => setBottomSheetContent(null), 300)
  }

  const openCategorySheet = (category = null) => {
    editCategory(category)
    openBottomSheet('addCategory')
  }

  const openSubscriptionSheet = (subscription = null) => {
    editSubscription(subscription)
    openBottomSheet('addSubscription')
  }

  const featuredSavings = [...savings]
    .map((goal) => {
      const currentAmount = parseFloat(goal.currentAmount || 0)
      const targetAmount = parseFloat(goal.targetAmount || 0)
      const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0

      return {
        ...goal,
        currentAmount,
        targetAmount,
        currency: goal.currency || DEFAULT_CURRENCY,
        progress
      }
    })
    .sort((a, b) => {
      if (b.progress !== a.progress) return b.progress - a.progress
      return b.currentAmount - a.currentAmount
    })

  const currentPeriodLabel = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  const currentPeriodTransfers = transfers.filter((transfer) => {
    const date = new Date(transfer.date)
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
  })

  const dashboardWidgetAvailability = {
    'recent-activity': filteredIncomes.length > 0 || filteredExpenses.length > 0 || currentPeriodTransfers.length > 0,
    spending: expensesByCategory.length > 0,
    accounts: walletBalances.length > 0,
    savings: savings.length > 0,
    'cashflow-chart': totalIncome > 0 || totalExpenses > 0 || netIncome !== 0,
    'income-source-chart': filteredIncomes.length > 0,
    'weekly-spending-chart': filteredExpenses.length > 0,
    'expense-trend-chart': filteredExpenses.length > 0,
    'account-allocation-chart': walletBalances.some((wallet) => parseFloat(wallet.balance || 0) > 0)
  }

  const topCategory = [...expensesByCategory]
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total)[0]

  const walletBalanceSummary = formatCurrencySummary(
    summarizeByCurrency(walletBalances, (wallet) => wallet.balance || 0, (wallet) => wallet.currency || DEFAULT_CURRENCY)
  )

  const totalSavingsSummary = formatCurrencySummary(
    summarizeByCurrency(savings, (goal) => goal.currentAmount || 0, (goal) => goal.currency || DEFAULT_CURRENCY)
  )

  const proPriceLabel = formatCurrency(PRO_PRICE_AMOUNT / 100, PRO_PRICE_CURRENCY)

  const openAndroidAppInvite = () => {
    if (typeof window === 'undefined') return
    window.open(APP_DISTRIBUTION_INVITE_URL, '_blank', 'noopener,noreferrer')
  }

  const copyAndroidAppInvite = async () => {
    if (typeof window === 'undefined' || !window.navigator?.clipboard) return false
    try {
      await window.navigator.clipboard.writeText(APP_DISTRIBUTION_INVITE_URL)
      return true
    } catch {
      return false
    }
  }

  const investmentValueSummary = formatCurrencySummary(
    summarizeByCurrency(
      investments,
      (investment) => {
        const quantity = parseFloat(investment.quantity || 0)
        const unitValue = parseFloat(investment.currentValue) || parseFloat(investment.purchasePrice) || 0
        return quantity * unitValue
      },
      (investment) => investment.currency || DEFAULT_CURRENCY
    )
  )

  const normalizeImportValue = (value) => String(value ?? '').trim().toLowerCase()
  const normalizeImportAmount = (value) => Number(parseFloat(value || 0).toFixed(2))
  const getWalletNameById = (walletId) => walletBalances.find((wallet) => wallet.id === walletId)?.name || ''

  const walletExists = (wallet) => walletBalances.some((existingWallet) => (
    normalizeImportValue(existingWallet.name) === normalizeImportValue(wallet.name) &&
    normalizeImportValue(existingWallet.accountType || 'cash') === normalizeImportValue(wallet.accountType || 'cash') &&
    normalizeImportAmount(existingWallet.startingBalance || existingWallet.balance || 0) === normalizeImportAmount(wallet.startingBalance || 0) &&
    normalizeImportValue(existingWallet.description) === normalizeImportValue(wallet.description)
  ))

  const categoryExists = (category) => categories.some((existingCategory) => (
    normalizeImportValue(existingCategory.name) === normalizeImportValue(category.name)
  ))

  const incomeExists = (income) => incomes.some((existingIncome) => (
    normalizeImportValue(existingIncome.date) === normalizeImportValue(income.date) &&
    normalizeImportValue(existingIncome.source) === normalizeImportValue(income.source) &&
    normalizeImportAmount(existingIncome.amount) === normalizeImportAmount(income.amount) &&
    normalizeImportValue(getWalletNameById(existingIncome.walletId)) === normalizeImportValue(income.walletName) &&
    normalizeImportValue(existingIncome.notes) === normalizeImportValue(income.notes)
  ))

  const expenseExists = (expense) => expenses.some((existingExpense) => (
    normalizeImportValue(existingExpense.date) === normalizeImportValue(expense.date) &&
    normalizeImportValue(existingExpense.description) === normalizeImportValue(expense.description) &&
    normalizeImportAmount(existingExpense.amount) === normalizeImportAmount(expense.amount) &&
    normalizeImportValue(existingExpense.category) === normalizeImportValue(expense.category) &&
    normalizeImportValue(getWalletNameById(existingExpense.walletId)) === normalizeImportValue(expense.walletName) &&
    normalizeImportValue(existingExpense.notes) === normalizeImportValue(expense.notes)
  ))

  const transferExists = (transfer) => transfers.some((existingTransfer) => (
    normalizeImportValue(existingTransfer.date) === normalizeImportValue(transfer.date) &&
    normalizeImportAmount(existingTransfer.amount) === normalizeImportAmount(transfer.amount) &&
    normalizeImportValue(getWalletNameById(existingTransfer.fromWalletId)) === normalizeImportValue(transfer.fromWalletName) &&
    normalizeImportValue(getWalletNameById(existingTransfer.toWalletId)) === normalizeImportValue(transfer.toWalletName) &&
    normalizeImportValue(existingTransfer.notes) === normalizeImportValue(transfer.notes)
  ))

  const investmentExists = (investment) => investments.some((existingInvestment) => (
    normalizeImportValue(existingInvestment.name) === normalizeImportValue(investment.name) &&
    normalizeImportValue(existingInvestment.investmentType) === normalizeImportValue(investment.investmentType) &&
    normalizeImportValue(existingInvestment.ticker) === normalizeImportValue(investment.ticker) &&
    normalizeImportAmount(existingInvestment.quantity) === normalizeImportAmount(investment.quantity) &&
    normalizeImportAmount(existingInvestment.purchasePrice) === normalizeImportAmount(investment.purchasePrice) &&
    normalizeImportValue(existingInvestment.purchaseDate) === normalizeImportValue(investment.purchaseDate)
  ))

  const renderPageIntro = ({ eyebrow, title, description, stats = [] }) => (
    <section className="page-intro card">
      <div className="page-intro-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="page-intro-title">{title}</h2>
        <p className="page-intro-text">{description}</p>
      </div>
      <div className="page-intro-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="page-intro-stat">
            <span className="page-intro-stat-label">{stat.label}</span>
            <strong className="page-intro-stat-value">{stat.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )

  // Desktop sidebar renderer
  const renderDesktopSidebar = () => (
    <div className="desktop-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-kicker">Financial Atelier</div>
        <div className="sidebar-title-row">
          <h1>Pitaka</h1>
          <div className={`sidebar-plan-badge ${isPro ? 'pro' : 'basic'}`}>{isPro ? 'Pro' : 'Basic'}</div>
        </div>
        <div className="sidebar-period">
          {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-scroll">
          <button
            className={`sidebar-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <div className="sidebar-nav-icon"><HomeIcon size={20} /></div>
            <div>Dashboard</div>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'transactions' ? 'active' : ''}`}
            onClick={() => setCurrentView('transactions')}
          >
            <div className="sidebar-nav-icon"><ActivityIcon size={20} /></div>
            <div>Transactions</div>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'accounts' ? 'active' : ''}`}
            onClick={() => setCurrentView('accounts')}
          >
            <div className="sidebar-nav-icon"><WalletIcon size={20} /></div>
            <div>Accounts</div>
          </button>
          <button
            className={`sidebar-nav-item ${['savings', 'investments', 'wealth'].includes(currentView) ? 'active' : ''}`}
            onClick={() => setCurrentView('wealth')}
          >
            <div className="sidebar-nav-icon"><TrendUpIcon size={20} /></div>
            <div>Wealth</div>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'categories' ? 'active' : ''}`}
            onClick={() => setCurrentView('categories')}
          >
            <div className="sidebar-nav-icon"><CategoryIcon size={20} /></div>
            <div>Categories</div>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setCurrentView('subscriptions')}
          >
            <div className="sidebar-nav-icon"><ExpenseIcon size={20} /></div>
            <div>Subscriptions</div>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'android-app' ? 'active' : ''}`}
            onClick={() => setCurrentView('android-app')}
          >
            <div className="sidebar-nav-icon"><DownloadIcon size={20} /></div>
            <div>Android App</div>
          </button>
          {!isPro && (
            <button
              className={`sidebar-nav-item ${currentView === 'pro' ? 'active' : ''}`}
              onClick={() => setCurrentView('pro')}
            >
              <div className="sidebar-nav-icon"><TrendUpIcon size={20} /></div>
              <div>Unlock Pro</div>
            </button>
          )}
          <button
            className={`sidebar-nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <div className="sidebar-nav-icon"><SettingsIcon size={20} /></div>
            <div>Settings</div>
          </button>

          {currentView === 'dashboard' && (
          <button
            type="button"
            className={`sidebar-nav-item ${isDesktopDashboardEditMode ? 'active' : ''}`}
            onClick={() => setIsDesktopDashboardEditMode((current) => !current)}
          >
            <div className="sidebar-nav-icon"><TemplateIcon size={20} /></div>
            <div>{isDesktopDashboardEditMode ? 'Done Editing' : 'Edit Dashboard'}</div>
          </button>

          )}

          {currentView === 'dashboard' && isDesktopDashboardEditMode && (
            <div className="sidebar-visualizer-list">
              <button
                type="button"
                className={`sidebar-visualizer-item ${dashboardCustomization.showHero ? 'active' : ''}`}
                onClick={() => toggleDashboardArea('showHero')}
              >
                <span>Hero Summary</span>
                <span>{dashboardCustomization.showHero ? 'Shown' : 'Hidden'}</span>
              </button>

              <button
                type="button"
                className={`sidebar-visualizer-item ${dashboardCustomization.showMetrics ? 'active' : ''}`}
                onClick={() => toggleDashboardArea('showMetrics')}
              >
                <span>Metric Cards</span>
                <span>{dashboardCustomization.showMetrics ? 'Shown' : 'Hidden'}</span>
              </button>

              {availableDashboardWidgets.map((widget) => {
                const isHidden = dashboardCustomization.hiddenSectionIds.includes(widget.id)
                return (
                  <button
                    key={widget.id}
                    type="button"
                    className={`sidebar-visualizer-item ${isHidden ? '' : 'active'}`}
                    onClick={() => toggleDashboardWidgetVisibility(widget.id)}
                  >
                    <span>{widget.name}</span>
                    <span>{isHidden ? 'Hidden' : 'Shown'}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">
                {user.displayName || 'User'}
              </p>
              <p className="sidebar-user-email">
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <LogoutIcon size={16} /> Logout
        </button>
      </div>
    </div>
  )

  // Show loading screen
  if (authLoading || budgetLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gradient-primary)',
        color: 'white',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading Pitaka...</div>
      </div>
    )
  }

  // Show auth screen only after Firebase has finished resolving the session
  if (!isAuthenticated) {
    const normalizedPublicPath = (publicPath || '/').replace(/\/+$/, '') || '/'
    const showPublicBlog = !isNativeMobileApp
      && (normalizedPublicPath === '/blogs' || normalizedPublicPath.startsWith('/blogs/'))

    return (
      <Suspense fallback={<SectionFallback label="Loading..." />}>
        {isNativeMobileApp
          ? <Auth />
          : showPublicBlog
            ? <Blog onBackToLanding={() => openPublicRoute('/')} />
            : <Landing />}
      </Suspense>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            netIncome={netIncome}
            totalSavings={totalSavings}
            walletBalances={walletBalances}
            savings={savings}
            filteredIncomes={filteredIncomes}
            filteredExpenses={filteredExpenses}
            transfers={transfers}
            subscriptions={subscriptions}
            isPro={isPro}
            expensesByCategory={expensesByCategory}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            layoutPreference={dashboardLayoutStyle}
            customization={dashboardCustomization}
            isMobileEditMode={isMobileDashboardEditMode}
            isDesktopEditMode={isDesktopDashboardEditMode}
            onMoveMobileWidget={moveMobileDashboardWidget}
            onMoveDesktopTile={moveDashboardDesktopTile}
            onResizeDesktopTile={updateDashboardDesktopTileSize}
          />
        )

      case 'transactions':
        return (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Activity Ledger',
              title: 'Transactions',
              description: `Review cash movement for ${currentPeriodLabel} across income, expenses, and transfers.`,
              stats: [
                { label: 'Income Rows', value: filteredIncomes.length },
                { label: 'Expense Rows', value: filteredExpenses.length },
                { label: 'Transfers', value: currentPeriodTransfers.length }
              ]
            })}

            <div className="page-section-grid page-section-grid--stacked">
              <div className={`card page-table-card ${filteredIncomes.length === 0 ? 'page-table-card--empty' : ''}`}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title"><IncomeIcon size={18} /> Income</h3>
                  </div>
                  <p className="card-subtitle">{filteredIncomes.length} entries in {currentPeriodLabel}</p>
                </div>
                <div className={`page-table-card-body ${filteredIncomes.length === 0 ? 'page-table-card-body--empty' : ''}`}>
                  <IncomeTable
                    incomes={filteredIncomes}
                    onEditIncome={(income) => {
                      editIncome(income)
                      openBottomSheet('addIncome')
                    }}
                    onDeleteIncome={deleteIncome}
                    wallets={walletBalances}
                    selectable
                    onBulkDelete={(rows) => deleteMany(rows, deleteIncome)}
                  />
                </div>
              </div>

              <div className={`card page-table-card ${filteredExpenses.length === 0 ? 'page-table-card--empty' : ''}`}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title"><ExpenseIcon size={18} /> Expenses</h3>
                  </div>
                  <p className="card-subtitle">{filteredExpenses.length} entries in {currentPeriodLabel}</p>
                </div>
                <div className={`page-table-card-body ${filteredExpenses.length === 0 ? 'page-table-card-body--empty' : ''}`}>
                  <ExpenseTable
                    expenses={filteredExpenses}
                    onEditExpense={(expense) => {
                      editExpense(expense)
                      openBottomSheet('addExpense')
                    }}
                    onDeleteExpense={deleteExpense}
                    wallets={walletBalances}
                    selectable
                    onBulkDelete={(rows) => deleteMany(rows, deleteExpense)}
                  />
                </div>
              </div>

              <div className="card page-table-card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title"><TransferIcon size={18} /> Transfers</h3>
                  </div>
                  <p className="card-subtitle">{currentPeriodTransfers.length} internal movements</p>
                </div>
                <TransfersTable
                  transfers={currentPeriodTransfers}
                  wallets={walletBalances}
                  onDelete={deleteTransfer}
                />
              </div>
            </div>
          </div>
        )

      case 'accounts':
        return (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Account Registry',
              title: 'Accounts',
              description: 'Manage every wallet, bank, and funding bucket from one place.',
              stats: [
                { label: 'Accounts', value: walletBalances.length },
                { label: 'Combined Balance', value: walletBalanceSummary }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><WalletIcon size={18} /> My Accounts</h3>
                  <p className="card-subtitle">Track balances, edit account details, and keep your sources organized.</p>
                </div>
                <button
                  onClick={() => openBottomSheet('addWallet')}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem', minHeight: 'auto' }}
                >
                  + Add Account
                </button>
              </div>
              <WalletsTable
                wallets={walletBalances}
                onEditWallet={(wallet) => openBottomSheet({ type: 'editWallet', wallet })}
                onDeleteWallet={async (id) => {
                  const ok = await confirm({
                    title: 'Delete Account',
                    description: 'Are you sure you want to delete this account? This action cannot be undone.',
                    confirmText: 'Delete',
                    cancelText: 'Cancel'
                  })
                  if (ok) deleteWallet(id)
                }}
                selectable
                onBulkDelete={(rows) => deleteMany(rows, deleteWallet)}
              />
            </div>
          </div>
        )

      case 'savings':
      case 'investments':
      case 'wealth':
        return (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Wealth Planning',
              title: 'Wealth',
              description: 'Manage savings goals and investment positions together so future plans and invested capital stay aligned.',
              stats: [
                { label: 'Active Goals', value: savings.length },
                { label: 'Reserved', value: totalSavingsSummary },
                { label: 'Investments', value: isPro ? investmentValueSummary : 'Pro only' }
              ]
            })}

            <div className="card savings-overview-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><TrendUpIcon size={18} /> Savings Goals</h3>
                  <p className="card-subtitle">{savings.length} active goal{savings.length === 1 ? '' : 's'}</p>
                </div>
                <div className="savings-actions">
                <button
                  onClick={() => openBottomSheet('addSavings')}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem', minHeight: 'auto' }}
                >
                  + New Goal
                </button>
                <button
                  onClick={() => openBottomSheet('addToSavings')}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem', minHeight: 'auto' }}
                  disabled={savings.length === 0}
                >
                  Add Funds
                </button>
                </div>
                <div className="savings-summary-amount">
                  {totalSavingsSummary}
                </div>
              </div>

            {featuredSavings.length > 0 ? (
              <div className="savings-goals-stack">
                {featuredSavings.map((goal) => (
                  <div key={goal.id} className="card savings-detail-card">
                    <div className="savings-detail-top">
                      <div>
                        <div className="savings-goal-name">{goal.goal}</div>
                        <div className="savings-goal-meta">
                          {formatCurrency(goal.currentAmount, goal.currency)} saved of {formatCurrency(goal.targetAmount, goal.currency)}
                        </div>
                      </div>
                      <div className="savings-goal-percent">{goal.progress.toFixed(0)}%</div>
                    </div>

                    <div className="savings-goal-track">
                      <div className="savings-goal-fill" style={{ width: `${goal.progress}%` }} />
                    </div>

                    <div className="savings-detail-bottom">
                      <div className="savings-goal-timeline">
                        {goal.targetDate
                          ? `Target date: ${new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                          : 'No target date set'}
                      </div>
                      <div className="savings-goal-remaining">
                        {formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0), goal.currency)} left
                      </div>
                    </div>

                    <div className="savings-card-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openBottomSheet({ type: 'fundSavings', savingsId: goal.id })}
                      >
                        Add Funds
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openBottomSheet({ type: 'editSavings', savings: goal })}
                      >
                        Edit Goal
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary savings-delete-btn"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete Savings Goal',
                            description: `Delete "${goal.goal}"? This action cannot be undone.`,
                            confirmText: 'Delete',
                            cancelText: 'Cancel'
                          })

                          if (ok) {
                            await deleteSavings(goal.id)
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon"><TrendUpIcon size={56} /></div>
                  <div className="empty-state-title">No savings goals yet</div>
                  <div className="empty-state-description">
                    Create a goal and start funding it to watch your progress build on the dashboard.
                  </div>
                  <button className="btn btn-primary" onClick={() => openBottomSheet('addSavings')}>
                    Create First Goal
                  </button>
                </div>
              </div>
            )}
            </div>
            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><ChartIcon size={18} /> Investments</h3>
                  <p className="card-subtitle">
                    {isPro
                      ? 'Record positions, refresh values, and keep your portfolio organized beside your goals.'
                      : 'Investment tracking is available on Pro. Upgrade to unlock portfolio monitoring and position management.'}
                  </p>
                </div>
                {isPro ? (
                  <button
                    onClick={() => openBottomSheet('addInvestment')}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.875rem', minHeight: 'auto' }}
                  >
                    + Add Investment
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentView('pro')}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.875rem', minHeight: 'auto' }}
                  >
                    Unlock Pro
                  </button>
                )}
              </div>
              {isPro ? (
                <InvestmentsTable
                  investments={investments}
                  onEdit={(investment) => openBottomSheet({ type: 'editInvestment', investment })}
                  onDelete={async (id) => {
                    const ok = await confirm({
                      title: 'Delete Investment',
                      description: 'Are you sure you want to delete this investment?',
                      confirmText: 'Delete',
                      cancelText: 'Cancel'
                    })
                    if (ok) deleteInvestment(id)
                  }}
                />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon"><ChartIcon size={56} /></div>
                  <div className="empty-state-title">Investment Tracking Is Pro Only</div>
                  <div className="empty-state-description">
                    Upgrade to Pro to record positions, monitor portfolio value, and manage investment performance.
                  </div>
                  <button className="btn btn-primary" onClick={() => setCurrentView('pro')}>
                    See Pro Features
                  </button>
                </div>
              )}
            </div>
          </div>
        )

      case 'categories':
        return (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Classification',
              title: 'Categories',
              description: 'Keep spending reports clean by maintaining the labels behind every expense.',
              stats: [
                { label: 'Categories', value: categories.length },
                { label: 'Top Spend Bucket', value: topCategory?.category || 'None yet' }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><CategoryIcon size={18} /> Categories</h3>
                  <p className="card-subtitle">Create and refine the buckets that power dashboard insights and expense tracking.</p>
                </div>
                <button
                  onClick={() => openCategorySheet()}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem', minHeight: 'auto' }}
                >
                  + Add Category
                </button>
              </div>
              <CategoryTable
                categories={categories}
                onEditCategory={openCategorySheet}
                onDeleteCategory={async (id) => {
                  const ok = await confirm({
                    title: 'Delete Category',
                    description: 'Are you sure? Expenses with this category will become uncategorized.',
                    confirmText: 'Delete',
                    cancelText: 'Cancel'
                  })
                  if (ok) {
                    await deleteCategory(id)
                  }
                }}
                selectable
                onBulkDelete={(rows) => deleteMany(rows, deleteCategory)}
              />
            </div>
          </div>
        )

      case 'subscriptions':
        return isPro ? (
          <div className="mobile-content page-shell">
              {renderPageIntro({
              eyebrow: 'Recurring Expenses',
              title: 'Subscriptions',
              description: 'Track recurring charges, monitor what is due next, and let each bill deduct automatically on schedule.',
              stats: [
                { label: 'Active Plans', value: subscriptions.length },
                { label: 'Category', value: 'Subscription' }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><ExpenseIcon size={18} /> Subscription Schedule</h3>
                  <p className="card-subtitle">Manage recurring bills and let each due date log itself automatically into your expenses.</p>
                </div>
                <button
                  onClick={() => openSubscriptionSheet()}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem', minHeight: 'auto' }}
                >
                  + Add Subscription
                </button>
              </div>
              <SubscriptionsTable
                subscriptions={subscriptions}
                wallets={walletBalances}
                onEditSubscription={openSubscriptionSheet}
                onDeleteSubscription={deleteSubscription}
                selectable
                onBulkDelete={(rows) => deleteMany(rows, deleteSubscription)}
              />
            </div>
          </div>
        ) : (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Recurring Expenses',
              title: 'Subscriptions',
              description: 'Track recurring charges with upcoming-bill visibility and automatic deductions on their due dates.',
              stats: [
                { label: 'Current Plan', value: 'Basic' },
                { label: 'Feature Access', value: 'Pro only' }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><ExpenseIcon size={18} /> Pro Required</h3>
                  <p className="card-subtitle">Subscriptions, upcoming bill tracking, and automatic recurring deductions are available on Pitaka Pro.</p>
                </div>
              </div>
              <div className="form-buttons" style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setCurrentView('settings')}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => setCurrentView('pro')}
                >
                  View Pro Access
                </button>
              </div>
            </div>
          </div>
        )

      case 'pro':
        return (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Membership',
              title: 'Pitaka Pro',
              description: 'Unlock the Android app, automatic subscriptions, full currency support, and investment tracking from one upgrade page.',
              stats: [
                { label: 'Current Plan', value: isPro ? 'Pro' : 'Basic' },
                { label: 'Android Access', value: isPro ? 'Included' : 'Pro only' }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><TrendUpIcon size={18} /> Pitaka Pro</h3>
                  <p className="card-subtitle">
                    {isPro
                      ? 'Your account already has Pro access, including Android app distribution access, automatic subscription logging, investment tracking, and every supported currency.'
                      : 'Upgrade with PayMongo to unlock Android app access, automatic subscription logging, full currency access, investment tracking, and future premium features.'}
                  </p>
                </div>
                <div className={`sidebar-plan-badge ${isPro ? 'pro' : 'basic'}`}>
                  {isPro ? 'Pro Active' : 'Basic'}
                </div>
              </div>

              {billingStatus === 'success' && !isPro && (
                <div className="status-pill accent" style={{ marginTop: '1rem' }}>
                  Payment was submitted. We&apos;re waiting for PayMongo webhook confirmation before Pro is applied to your account.
                </div>
              )}

              {billingStatus === 'cancelled' && !isPro && (
                <div className="status-pill warning" style={{ marginTop: '1rem' }}>
                  Checkout was cancelled before payment completed.
                </div>
              )}

              <section className="plan-comparison-card">
                <div className="card-header">
                  <div>
                    <h4 className="card-title"><ChartIcon size={18} /> Basic vs Pro</h4>
                  </div>
                </div>

                <div className="plan-comparison-grid">
                  <div className={`plan-tier-card ${!isPro ? 'is-active' : ''}`}>
                    <div className="plan-tier-header">
                      <span className="plan-tier-name">Basic</span>
                      <span className="plan-tier-badge">Current for free users</span>
                    </div>
                    <div className="plan-checklist">
                      <div className="plan-checklist-item is-included">Manual income, expense, savings, and transfer tracking</div>
                      <div className="plan-checklist-item is-included">Category and account management</div>
                      <div className="plan-checklist-item is-included">PHP and USD currency support</div>
                      <div className="plan-checklist-item is-locked">Android app download and Firebase App Distribution access</div>
                      <div className="plan-checklist-item is-locked">Automatic subscription logging with upcoming-bill visibility</div>
                      <div className="plan-checklist-item is-locked">Investment tracking</div>
                    </div>
                  </div>

                  <div className={`plan-tier-card plan-tier-card--pro ${isPro ? 'is-active' : ''}`}>
                    <div className="plan-tier-header">
                      <span className="plan-tier-name">Pro</span>
                      <span className="plan-tier-badge">One-time upgrade</span>
                    </div>
                    <div className="plan-checklist">
                      <div className="plan-checklist-item is-included">Everything in Basic</div>
                      <div className="plan-checklist-item is-included">Android app download through Firebase App Distribution</div>
                      <div className="plan-checklist-item is-included">Automatic subscription logging with upcoming-bill visibility</div>
                      <div className="plan-checklist-item is-included">Investment tracking alongside your budget</div>
                      <div className="plan-checklist-item is-included">All supported currencies across wallets, goals, and investments</div>
                      <div className="plan-checklist-item is-included">Future Pro-only features included</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="plan-comparison-card" style={{ marginTop: '1rem' }}>
                <div className="card-header">
                  <div>
                    <h4 className="card-title"><DownloadIcon size={18} /> Android App Perk</h4>
                    <p className="card-subtitle">
                      {isPro
                        ? 'Your Pro plan includes the Android app invite link and access to new mobile builds.'
                        : 'Go Pro to unlock the private Android app invite link and install Pitaka through Firebase App Distribution.'}
                    </p>
                  </div>
                </div>

                <div className="pro-purchase-meta">
                  <div className="pro-purchase-meta-card">
                    <span className="pro-purchase-meta-label">Distribution</span>
                    <strong>Firebase App Distribution</strong>
                  </div>
                  <div className="pro-purchase-meta-card">
                    <span className="pro-purchase-meta-label">Widgets</span>
                    <strong>Included on Android</strong>
                  </div>
                  <div className="pro-purchase-meta-card">
                    <span className="pro-purchase-meta-label">Access</span>
                    <strong>{isPro ? 'Ready now' : 'Unlock with Pro'}</strong>
                  </div>
                </div>

                <div className="form-buttons" style={{ display: 'flex', gap: '10px', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentView('android-app')}
                    style={{ flex: 1, minWidth: '220px' }}
                  >
                    {isPro ? 'Open Android App Page' : 'See Android App Perk'}
                  </button>
                  {!isPro && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={async () => {
                        try {
                          await startProCheckout()
                        } catch (checkoutError) {
                          alert(checkoutError.message || 'Failed to start PayMongo checkout.')
                        }
                      }}
                      disabled={isStartingCheckout}
                      style={{ flex: 1, minWidth: '220px' }}
                    >
                      {isStartingCheckout ? 'Opening PayMongo...' : 'Unlock Pro + Android'}
                    </button>
                  )}
                </div>
              </section>

              {!isPro && (
                <section className="pro-purchase-card">
                  <div className="pro-purchase-copy">
                    <span className="eyebrow">One-Time Upgrade</span>
                    <h4 className="pro-purchase-title">Buy Pitaka Pro</h4>
                    <p className="pro-purchase-text">
                      Get Android app access, automatic subscription logging, full currency support, investment tracking, and future Pro-only features through a one-time PayMongo checkout.
                    </p>
                    <div className="pro-purchase-price-row">
                      <div className="pro-purchase-price-block">
                        <div className="pro-purchase-price">{proPriceLabel}</div>
                        <div className="pro-purchase-price-note">One-time upgrade via {PRO_PAYMENT_METHOD_LABEL}</div>
                      </div>
                      <div className="pro-purchase-chip">Secure Checkout</div>
                    </div>
                    <div className="pro-purchase-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={async () => {
                          try {
                            await startProCheckout()
                          } catch (checkoutError) {
                            alert(checkoutError.message || 'Failed to start PayMongo checkout.')
                          }
                        }}
                        disabled={isStartingCheckout}
                      >
                        {isStartingCheckout ? 'Opening PayMongo...' : 'Buy Pro with PayMongo'}
                      </button>
                    </div>
                  </div>

                  <div className="pro-purchase-meta">
                    <div className="pro-purchase-meta-card">
                      <span className="pro-purchase-meta-label">Payment Method</span>
                      <strong>{PRO_PAYMENT_METHOD_LABEL}</strong>
                    </div>
                    <div className="pro-purchase-meta-card">
                      <span className="pro-purchase-meta-label">Upgrade Applies</span>
                      <strong>After webhook confirmation</strong>
                    </div>
                    <div className="pro-purchase-meta-card">
                      <span className="pro-purchase-meta-label">Account</span>
                      <strong>{user?.email || 'Signed-in user'}</strong>
                    </div>
                  </div>
                </section>
              )}

              {isPro && userProfile && (
                <div style={{ marginTop: '1rem' }} className="card-subtitle">
                  Pro tag stored on this user profile{userProfile.email ? ` for ${userProfile.email}` : ''}.
                </div>
              )}
            </div>
          </div>
        )

      case 'android-app':
        return (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Mobile Access',
              title: 'Pitaka Android App',
              description: 'Download the Android build through Firebase App Distribution. This perk is available to Pro members.',
              stats: [
                { label: 'Current Plan', value: isPro ? 'Pro' : 'Basic' },
                { label: 'Delivery', value: 'Firebase App Distribution' }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><DownloadIcon size={18} /> Android App Access</h3>
                  <p className="card-subtitle">
                    {isPro
                      ? 'Your Pro plan includes access to the Android build. Use the invite link below to join the tester flow and install Pitaka on your phone.'
                      : 'The Android app download is currently included with Pitaka Pro. Upgrade first, then use the invite link to install the app from Firebase App Distribution.'}
                  </p>
                </div>
                <div className={`sidebar-plan-badge ${isPro ? 'pro' : 'basic'}`}>
                  {isPro ? 'Pro Access' : 'Pro Only'}
                </div>
              </div>

              <div className="plan-comparison-grid" style={{ marginTop: '1rem' }}>
                <div className="plan-tier-card is-active">
                  <div className="plan-tier-header">
                    <span className="plan-tier-name">What you get</span>
                    <span className="plan-tier-badge">Android beta access</span>
                  </div>
                  <div className="plan-checklist">
                    <div className="plan-checklist-item is-included">Install Pitaka as a native Android app</div>
                    <div className="plan-checklist-item is-included">Use home screen widgets and quick actions</div>
                    <div className="plan-checklist-item is-included">Get new test builds through Firebase App Distribution</div>
                  </div>
                </div>

                <div className={`plan-tier-card plan-tier-card--pro ${isPro ? 'is-active' : ''}`}>
                  <div className="plan-tier-header">
                    <span className="plan-tier-name">Invite link</span>
                    <span className="plan-tier-badge">{isPro ? 'Ready to use' : 'Unlock with Pro'}</span>
                  </div>
                  <div className="card-subtitle" style={{ marginTop: '0.5rem', wordBreak: 'break-word' }}>
                    {isPro ? APP_DISTRIBUTION_INVITE_URL : 'Upgrade to Pro to unlock the private Android app invite link.'}
                  </div>
                </div>
              </div>

              <div className="form-buttons" style={{ display: 'flex', gap: '10px', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                {isPro ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={openAndroidAppInvite}
                      style={{ flex: 1, minWidth: '220px' }}
                    >
                      Open Download Link
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={async () => {
                        const copied = await copyAndroidAppInvite()
                        alert(copied ? 'Invite link copied.' : 'Could not copy the link automatically.')
                      }}
                      style={{ flex: 1, minWidth: '220px' }}
                    >
                      Copy Invite Link
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setCurrentView('pro')}
                      style={{ flex: 1, minWidth: '220px' }}
                    >
                      Unlock with Pro
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setCurrentView('settings')}
                      style={{ flex: 1, minWidth: '220px' }}
                    >
                      Back to Settings
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Controls & Tools',
              title: 'More',
              description: 'Adjust your workspace layout, theme, and data tools from one place.',
              stats: [
                { label: 'Theme', value: THEME_OPTIONS.find((theme) => theme.id === themePreference)?.name || 'Light' },
                { label: 'Layout', value: DASHBOARD_LAYOUTS.find((layout) => layout.id === dashboardLayout)?.name || 'Editorial' }
              ]
            })}

            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><HomeIcon size={18} /> Dashboard Layout</h3>
                  <p className="card-subtitle">Choose a starting preset. Selecting one also resets your widget arrangement to match it.</p>
                </div>
              </div>

              <div className="layout-preference-list">
                {DASHBOARD_LAYOUTS.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    className={`layout-preference-card ${dashboardLayout === layout.id ? 'active' : ''}`}
                    onClick={() => updateDashboardLayout(layout.id)}
                  >
                    <div className="layout-preference-top">
                      <span className="layout-preference-name">{layout.name}</span>
                      <span className="layout-preference-state">{dashboardLayout === layout.id ? 'Selected' : 'Choose'}</span>
                    </div>
                    <div className="layout-preference-description">{layout.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><SettingsIcon size={18} /> Appearance</h3>
                  <p className="card-subtitle">Pick the surface theme that feels best for your workspace.</p>
                </div>
              </div>

              <div className="layout-preference-list layout-preference-list--two-up">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className={`layout-preference-card ${themePreference === theme.id ? 'active' : ''}`}
                    onClick={() => updateThemePreference(theme.id)}
                  >
                    <div className="layout-preference-top">
                      <span className="layout-preference-name">{theme.name}</span>
                      <span className="layout-preference-state">{themePreference === theme.id ? 'Selected' : 'Choose'}</span>
                    </div>
                    <div className="layout-preference-description">{theme.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card page-hero-card">
              <h3 className="card-title"><SettingsIcon size={18} /> Settings & Tools</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={() => setCurrentView(isPro ? 'subscriptions' : 'pro')}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <ExpenseIcon size={16} /> {isPro ? 'Manage Subscriptions' : 'Subscriptions (Pro)'}
                </button>

                <button
                  onClick={() => setCurrentView('categories')}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <CategoryIcon size={16} /> Manage Categories
                </button>

                <button
                  onClick={() => setCurrentView('android-app')}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <DownloadIcon size={16} /> {isPro ? 'Android App Download' : 'Android App (Pro)'}
                </button>

                <button
                  onClick={() => {
                    exportToExcel({
                      incomes,
                      expenses,
                      transfers,
                      investments,
                      wallets,
                      categories,
                      selectedMonth,
                      selectedYear
                    })
                  }}
                  className="btn btn-primary"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <DownloadIcon size={16} /> Export to Excel
                </button>

                <button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.csv,.xlsx'
                    input.onchange = async (e) => {
                      const file = e.target.files[0]
                      if (file) {
                        try {
                          const data = await importFromExcel(file)
                          openBottomSheet({ type: 'importData', data })
                        } catch (err) {
                          alert('Failed to import file: ' + err.message)
                        }
                      }
                    }
                    input.click()
                  }}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <UploadIcon size={16} /> Import from Excel
                </button>

                <button
                  onClick={downloadImportTemplate}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <TemplateIcon size={16} /> Download Import Template
                </button>
              </div>
            </div>

            {!isInstalled && deferredInstallPrompt && (
              <div className="card page-hero-card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title"><DownloadIcon size={18} /> Install App</h3>
                    <p className="card-subtitle">Add Pitaka to your home screen for faster launch and easier mobile access.</p>
                  </div>
                  <button
                    type="button"
                    onClick={installApp}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.875rem', minHeight: 'auto' }}
                  >
                    Install
                  </button>
                </div>
              </div>
            )}

          </div>
        )
      default:
        return null
    }
  }
  const renderBottomSheetContent = () => {
    if (!bottomSheetContent) {
      return null
    }

    switch (bottomSheetContent) {
      case 'addIncome':
        return (
          <IncomeForm
            onAddIncome={async (income) => {
              await addIncome(income)
              closeBottomSheet()
            }}
            editingIncome={editingIncome}
            onUpdateIncome={async (income) => {
              await updateIncome(income)
              closeBottomSheet()
            }}
            onCancelEdit={() => editIncome(null)}
            wallets={walletBalances}
          />
        )

      case 'addExpense':
        return (
          <ExpenseForm
            onAddExpense={async (expense) => {
              await addExpense(expense)
              closeBottomSheet()
            }}
            editingExpense={editingExpense}
            onUpdateExpense={async (expense) => {
              await updateExpense(expense)
              closeBottomSheet()
            }}
            onCancelEdit={() => editExpense(null)}
            categories={categories}
            wallets={walletBalances}
          />
        )

      case 'addTransfer':
        return (
          <TransferForm
            onAddTransfer={async (transfer) => {
              await addTransfer(transfer)
              closeBottomSheet()
            }}
            wallets={walletBalances}
          />
        )

      case 'addWallet':
        return (
          <WalletForm
            onAddWallet={async (wallet) => {
              await addWallet(wallet)
              closeBottomSheet()
            }}
          />
        )

      case 'addSavings':
        return (
          <SavingsForm
            onAddSavings={async (goal) => {
              await addSavings(goal)
              closeBottomSheet()
            }}
            editingSavings={editingSavings}
            onUpdateSavings={async (goal) => {
              await updateSavings(goal)
              closeBottomSheet()
            }}
            onCancelEdit={() => {
              editSavings(null)
              closeBottomSheet()
            }}
          />
        )

      case 'addToSavings':
        return (
          <div className="form-container">
            <h3 className="card-title"><TrendUpIcon size={18} /> Add Funds To Goal</h3>
            <AddToSavingsForm
              savings={savings}
              wallets={walletBalances}
              initialSelectedId={savings[0]?.id}
              onAddToSavings={async (savingsId, amount, options) => {
                await addToSavingsGoal(savingsId, amount, options)
                closeBottomSheet()
              }}
            />
          </div>
        )

      case 'addCategory':
        return (
          <CategoryForm
            onAddCategory={async (category) => {
              await addCategory(category)
              closeBottomSheet()
            }}
            editingCategory={editingCategory}
            onUpdateCategory={async (category) => {
              await updateCategory(category)
              closeBottomSheet()
            }}
            onCancelEdit={() => { editCategory(null); closeBottomSheet() }}
          />
        )

      case 'addSubscription':
        return isPro ? (
          <SubscriptionForm
            onAddSubscription={async (subscription) => {
              await addSubscription(subscription)
              closeBottomSheet()
            }}
            editingSubscription={editingSubscription}
            onUpdateSubscription={async (subscription) => {
              await updateSubscription(subscription)
              closeBottomSheet()
            }}
            onCancelEdit={() => {
              editSubscription(null)
              closeBottomSheet()
            }}
            wallets={walletBalances}
          />
        ) : (
          <div className="form-container">
            <h3 className="card-title"><ExpenseIcon size={18} /> Pro Required</h3>
            <p className="card-subtitle" style={{ marginTop: '0.75rem' }}>
              Automatic subscription logging and upcoming bill tracking are part of Pitaka Pro.
            </p>
            <div className="form-buttons" style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={closeBottomSheet}>
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  closeBottomSheet()
                  setCurrentView('pro')
                }}
              >
                View Pro Access
              </button>
            </div>
          </div>
        )

      case 'addInvestment':
        return isPro ? (
          <InvestmentForm
            onAddInvestment={async (investment) => {
              await addInvestment(investment)
              closeBottomSheet()
            }}
          />
        ) : (
          <div className="form-container">
            <h3 className="card-title"><TrendUpIcon size={18} /> Pro Required</h3>
            <p className="card-subtitle" style={{ marginTop: '0.75rem' }}>
              Investment tracking is part of Pitaka Pro. Add the Pro tag on this user in the database to enable investment access.
            </p>
            <div className="form-buttons" style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={closeBottomSheet}>
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  closeBottomSheet()
                  setCurrentView('pro')
                }}
              >
                View Pro Access
              </button>
            </div>
          </div>
        )

      case 'customizeMobileDashboard':
        return (
          <div className="form-container">
            <h3 className="card-title"><TemplateIcon size={18} /> Mobile Dashboard</h3>
            <p className="card-subtitle" style={{ marginTop: '0.75rem' }}>
              Show or hide visualizers and turn on long-press drag mode to reorder the mobile stack.
            </p>

            <div className="dashboard-mobile-controls">
              <button
                type="button"
                className={`layout-preference-card dashboard-toggle-card ${dashboardCustomization.showHero ? 'active' : ''}`}
                onClick={() => toggleDashboardArea('showHero')}
              >
                <div className="layout-preference-top">
                  <span className="layout-preference-name">Hero Summary</span>
                  <span className="layout-preference-state">{dashboardCustomization.showHero ? 'Shown' : 'Hidden'}</span>
                </div>
                <div className="layout-preference-description">Show or hide the large monthly overview banner at the top of the dashboard.</div>
              </button>

              <button
                type="button"
                className={`layout-preference-card dashboard-toggle-card ${dashboardCustomization.showMetrics ? 'active' : ''}`}
                onClick={() => toggleDashboardArea('showMetrics')}
              >
                <div className="layout-preference-top">
                  <span className="layout-preference-name">Metric Cards</span>
                  <span className="layout-preference-state">{dashboardCustomization.showMetrics ? 'Shown' : 'Hidden'}</span>
                </div>
                <div className="layout-preference-description">Show or hide the balance, income, expense, and net insight cards below the hero.</div>
              </button>

              <button
                type="button"
                className={`layout-preference-card dashboard-toggle-card ${isMobileDashboardEditMode ? 'active' : ''}`}
                onClick={() => setIsMobileDashboardEditMode((current) => !current)}
              >
                <div className="layout-preference-top">
                  <span className="layout-preference-name">Reorder Mode</span>
                  <span className="layout-preference-state">{isMobileDashboardEditMode ? 'On' : 'Off'}</span>
                </div>
                <div className="layout-preference-description">Long-press any dashboard card, then drag it higher or lower in the stack.</div>
              </button>
            </div>

            <div className="dashboard-mobile-visualizer-list">
              {availableDashboardWidgets.map((widget) => {
                const isHidden = dashboardCustomization.hiddenSectionIds.includes(widget.id)
                return (
                  <button
                    key={widget.id}
                    type="button"
                    className={`layout-preference-card dashboard-mobile-visualizer-card ${isHidden ? '' : 'active'}`}
                    onClick={() => toggleDashboardWidgetVisibility(widget.id)}
                  >
                    <div className="layout-preference-top">
                      <span className="layout-preference-name">{widget.name}</span>
                      <span className="layout-preference-state">{isHidden ? 'Hidden' : 'Shown'}</span>
                    </div>
                    <div className="layout-preference-description">{widget.description}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )

      default:
        if (bottomSheetContent?.type === 'editWallet') {
          return (
            <WalletForm
              editingWallet={bottomSheetContent.wallet}
              onUpdateWallet={async (wallet) => {
                await updateWallet(wallet)
                closeBottomSheet()
              }}
              onCancelEdit={closeBottomSheet}
            />
          )
        } else if (bottomSheetContent?.type === 'editSavings') {
          return (
            <SavingsForm
              editingSavings={bottomSheetContent.savings}
              onUpdateSavings={async (goal) => {
                await updateSavings(goal)
                closeBottomSheet()
              }}
              onCancelEdit={() => {
                editSavings(null)
                closeBottomSheet()
              }}
            />
          )
        } else if (bottomSheetContent?.type === 'fundSavings') {
          return (
            <div className="form-container">
              <h3 className="card-title"><TrendUpIcon size={18} /> Add Funds To Goal</h3>
              <AddToSavingsForm
                savings={savings}
                wallets={walletBalances}
                initialSelectedId={bottomSheetContent.savingsId}
                onAddToSavings={async (savingsId, amount, options) => {
                  await addToSavingsGoal(savingsId, amount, options)
                  closeBottomSheet()
                }}
              />
            </div>
          )
        } else if (bottomSheetContent?.type === 'editInvestment') {
          return isPro ? (
            <InvestmentForm
              editingInvestment={bottomSheetContent.investment}
              onUpdateInvestment={async (id, updates) => {
                await updateInvestment(id, updates)
                closeBottomSheet()
              }}
              onCancelEdit={closeBottomSheet}
            />
          ) : null
        } else if (bottomSheetContent?.type === 'importData') {
          return (
            <div className="form-container">
              <h3 className="card-title"><UploadIcon size={18} /> Import Data</h3>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Ready to import data from your file. Review the summary below:
                </p>
                <div style={{
                  background: 'var(--card-background)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Accounts:</span>
                    <strong>{bottomSheetContent.data.wallets?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Categories:</span>
                    <strong>{bottomSheetContent.data.categories?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Income Records:</span>
                    <strong>{bottomSheetContent.data.incomes?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Expense Records:</span>
                    <strong>{bottomSheetContent.data.expenses?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Transfers:</span>
                    <strong>{bottomSheetContent.data.transfers?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Investments:</span>
                    <strong>{bottomSheetContent.data.investments?.length || 0}</strong>
                  </div>
                </div>
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(31, 106, 57, 0.12)',
                  border: '1px solid rgba(31, 106, 57, 0.18)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  Tip: Accounts and categories will be imported first, followed by transactions. Existing data will not be affected.
                </div>
              </div>
              <div className="form-buttons" style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={closeBottomSheet}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const importData = bottomSheetContent.data
                      let successCount = 0
                      let errorCount = 0
                      let skippedCount = 0

                      // Import wallets first (needed for incomes/expenses/transfers)
                      if (importData.wallets?.length > 0) {
                        for (const wallet of importData.wallets) {
                          try {
                            if (walletExists(wallet)) {
                              skippedCount++
                              continue
                            }
                            await addWallet(wallet)
                            successCount++
                          } catch (err) {
                            console.error('Failed to import wallet:', err)
                            errorCount++
                          }
                        }
                      }

                      // Import categories (needed for expenses)
                      if (importData.categories?.length > 0) {
                        for (const category of importData.categories) {
                          try {
                            if (categoryExists(category)) {
                              skippedCount++
                              continue
                            }
                            await addCategory(category)
                            successCount++
                          } catch (err) {
                            console.error('Failed to import category:', err)
                            errorCount++
                          }
                        }
                      }

                      // Import incomes
                      if (importData.incomes?.length > 0) {
                        for (const income of importData.incomes) {
                          try {
                            if (incomeExists(income)) {
                              skippedCount++
                              continue
                            }
                            await addIncome(income)
                            successCount++
                          } catch (err) {
                            console.error('Failed to import income:', err)
                            errorCount++
                          }
                        }
                      }

                      // Import expenses
                      if (importData.expenses?.length > 0) {
                        for (const expense of importData.expenses) {
                          try {
                            if (expenseExists(expense)) {
                              skippedCount++
                              continue
                            }
                            await addExpense(expense)
                            successCount++
                          } catch (err) {
                            console.error('Failed to import expense:', err)
                            errorCount++
                          }
                        }
                      }

                      // Import transfers
                      if (importData.transfers?.length > 0) {
                        for (const transfer of importData.transfers) {
                          try {
                            if (transferExists(transfer)) {
                              skippedCount++
                              continue
                            }
                            await addTransfer(transfer)
                            successCount++
                          } catch (err) {
                            console.error('Failed to import transfer:', err)
                            errorCount++
                          }
                        }
                      }

                      // Import investments
                      if (importData.investments?.length > 0) {
                        for (const investment of importData.investments) {
                          try {
                            if (investmentExists(investment)) {
                              skippedCount++
                              continue
                            }
                            await addInvestment(investment)
                            successCount++
                          } catch (err) {
                            console.error('Failed to import investment:', err)
                            errorCount++
                          }
                        }
                      }

                      // Show result message
                      if (errorCount === 0) {
                        alert(`Import finished.\nImported: ${successCount}\nSkipped duplicates: ${skippedCount}`)
                      } else {
                        alert(`Import completed with some errors:\nImported: ${successCount}\nSkipped duplicates: ${skippedCount}\nFailed: ${errorCount}`)
                      }
                      closeBottomSheet()
                    } catch (err) {
                      alert('Failed to import data: ' + err.message)
                    }
                  }}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  Import Now
                </button>
              </div>
            </div>
          )
        }
        return null
    }
  }

  return (
    <div className="mobile-app">
      {/* Desktop Sidebar Navigation */}
      {renderDesktopSidebar()}

      {/* Main Content Wrapper for Desktop */}
      <div className="desktop-main-wrapper">
        {/* Header */}
        <div className="mobile-header">
          <div className="mobile-header-content">
            <div className="header-title-block">
              <span className="eyebrow">Private Banking View</span>
              <h1>Pitaka</h1>
              <div className="header-period">
                {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
            </div>
            <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => {
                const d = new Date(selectedYear, selectedMonth - 1)
                setSelectedMonth(d.getMonth())
                setSelectedYear(d.getFullYear())
              }}
              title="Previous month"
            >
              <ChevronLeftIcon size={18} />
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                const d = new Date(selectedYear, selectedMonth + 1)
                setSelectedMonth(d.getMonth())
                setSelectedYear(d.getFullYear())
              }}
              title="Next month"
            >
              <ChevronRightIcon size={18} />
            </button>
            <button
              className="icon-btn"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Logout',
                  description: 'Are you sure you want to logout?',
                  confirmText: 'Logout',
                  cancelText: 'Cancel'
                })
                if (ok) logout()
              }}
              title="Logout"
            >
              <LogoutIcon size={18} />
            </button>
            {currentView === 'dashboard' && (
              <button
                className={`icon-btn mobile-dashboard-edit-btn ${isMobileDashboardEditMode ? 'active' : ''}`}
                onClick={() => openBottomSheet('customizeMobileDashboard')}
                title="Customize dashboard"
              >
                <TemplateIcon size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
          color: 'white',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: 500
        }}>
          ⚠️ {error}
        </div>
      )}

      {(!isOnline || syncState.hasPendingWrites) && (
        <div className="status-strip">
          {!isOnline && (
            <div className="status-pill warning">
              Offline mode: cached pages are available and changes will sync when connection returns.
            </div>
          )}

          {syncState.hasPendingWrites && (
            <div className="status-pill accent">
              Sync pending: local changes are queued and waiting for Firestore confirmation.
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions-wrap">
        <div className="quick-actions">
          <button
            className="quick-action-btn"
            onClick={() => openBottomSheet('addIncome')}
          >
            <IncomeIcon className="quick-action-icon" size={16} /> Record Income
          </button>
          <button
            className="quick-action-btn"
            onClick={() => openBottomSheet('addExpense')}
          >
            <ExpenseIcon className="quick-action-icon" size={16} /> Log Expense
          </button>
          <button
            className="quick-action-btn"
            onClick={() => openBottomSheet('addTransfer')}
          >
            <TransferIcon className="quick-action-icon" size={16} /> Move Funds
          </button>
          <button
            className="quick-action-btn"
            onClick={() => openBottomSheet('addSavings')}
          >
            <TrendUpIcon className="quick-action-icon" size={16} /> New Goal
          </button>
          <button
            className="quick-action-btn"
            onClick={() => {
              if (isPro) openSubscriptionSheet()
              else setCurrentView('pro')
            }}
          >
            <ExpenseIcon className="quick-action-icon" size={16} /> {isPro ? 'New Subscription' : 'Subscriptions Pro'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <Suspense fallback={<SectionFallback label="Loading view..." />}>
        {renderView()}
      </Suspense>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button
          className={`bottom-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          <div className="bottom-nav-icon"><HomeIcon size={22} /></div>
          <div>Home</div>
        </button>
        <button
          className={`bottom-nav-item ${currentView === 'transactions' ? 'active' : ''}`}
          onClick={() => setCurrentView('transactions')}
        >
          <div className="bottom-nav-icon"><ActivityIcon size={22} /></div>
          <div>Activity</div>
        </button>
        <button
          className={`bottom-nav-item ${currentView === 'accounts' ? 'active' : ''}`}
          onClick={() => setCurrentView('accounts')}
        >
          <div className="bottom-nav-icon"><WalletIcon size={22} /></div>
          <div>Accounts</div>
        </button>
        <button
          className={`bottom-nav-item ${['savings', 'investments', 'wealth'].includes(currentView) ? 'active' : ''}`}
          onClick={() => setCurrentView('wealth')}
        >
          <div className="bottom-nav-icon"><TrendUpIcon size={22} /></div>
          <div>Wealth</div>
        </button>
        <button
          className={`bottom-nav-item ${!isPro && currentView === 'pro' ? '' : ['settings', 'categories', 'subscriptions', 'android-app', ...(isPro ? ['pro'] : [])].includes(currentView) ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          <div className="bottom-nav-icon"><SettingsIcon size={22} /></div>
          <div>More</div>
        </button>
        {!isPro && (
          <button
            className={`bottom-nav-item ${currentView === 'pro' ? 'active' : ''}`}
            onClick={() => setCurrentView('pro')}
          >
            <div className="bottom-nav-icon"><TrendUpIcon size={22} /></div>
            <div>Pro</div>
          </button>
        )}
      </div>
      
      </div> {/* End desktop-main-wrapper */}

      {/* Bottom Sheet */}
      <div
        className={`bottom-sheet-backdrop ${showBottomSheet ? 'open' : ''}`}
        onClick={closeBottomSheet}
      />
      <div className={`bottom-sheet ${showBottomSheet ? 'open' : ''}`}>
        <div className="bottom-sheet-handle" />
        <Suspense fallback={<SectionFallback label="Loading tools..." />}>
          {renderBottomSheetContent()}
        </Suspense>
      </div>
    </div>
  )
}


export default ModernApp
