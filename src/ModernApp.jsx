import { Suspense, lazy, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { FirebaseContext } from './contexts/FirebaseContext'
import { useConfirm } from './contexts/useConfirm'
import { useBudget } from './hooks/useBudget'
import { useDashboardWidgets } from './hooks/useDashboardWidgets'
import Dashboard from './components/Dashboard'
import AppNavigation from './components/AppNavigation'
import SettingsPreferences from './components/SettingsPreferences'
import Toast from './components/Toast'
import PlanHub from './components/PlanHub'
import GooglePlayProPurchase from './components/GooglePlayProPurchase'
import TransactionFeed from './components/TransactionFeed'
import { useDialogFocus } from './hooks/useDialogFocus'
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
import { suggestCategory } from './utils/categoryRules'
import { getLocalDateInputValue } from './utils/date'
import { reportAppError } from './utils/errorReporting'
import { getPrimaryDestination } from './utils/navigation'

const DeleteAccount = lazy(() => import('./components/DeleteAccount'))
const Auth = lazy(() => import('./components/Auth'))
const Landing = lazy(() => import('./components/Landing'))
const Blog = lazy(() => import('./components/Blog'))
const ContactForm = lazy(() => import('./components/ContactForm'))
const IncomeForm = lazy(() => import('./components/IncomeForm'))
const ExpenseForm = lazy(() => import('./components/ExpenseForm'))
const TransferForm = lazy(() => import('./components/TransferForm'))
const WalletForm = lazy(() => import('./components/WalletForm'))
const CategoryForm = lazy(() => import('./components/CategoryForm'))
const SubscriptionForm = lazy(() => import('./components/SubscriptionForm'))
const SavingsForm = lazy(() => import('./components/SavingsForm'))
const AddToSavingsForm = lazy(() => import('./components/AddToSavingsForm'))
const RecurringIncomeForm = lazy(() => import('./components/RecurringIncomeForm'))
const WalletsTable = lazy(() => import('./components/WalletsTable'))
const CategoryTable = lazy(() => import('./components/CategoryTable'))
const BudgetManager = lazy(() => import('./components/BudgetManager'))
const RecurringIncomesTable = lazy(() => import('./components/RecurringIncomesTable'))
const SubscriptionsTable = lazy(() => import('./components/SubscriptionsTable'))
const InvestmentForm = lazy(() => import('./components/InvestmentForm'))
const InvestmentsTable = lazy(() => import('./components/InvestmentsTable'))

const DASHBOARD_LAYOUTS = [
  {
    id: 'overview',
    name: 'Overview',
    description: 'Balances, recent activity, spending, and savings goals.',
    widgets: ['recent-activity', 'spending', 'accounts', 'savings']
  },
  {
    id: 'cashflow',
    name: 'Cash Flow',
    description: 'Income and spending trends, recent activity, and upcoming bills.',
    widgets: ['cashflow-chart', 'recent-activity', 'spending', 'upcoming-bills']
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Savings goals, account balances, and net worth over time.',
    widgets: ['savings', 'accounts', 'net-worth-history', 'plan-ahead']
  }
]

const DEFAULT_DASHBOARD_LAYOUT = 'overview'
const LEGACY_DASHBOARD_LAYOUTS = {
  editorial: 'overview',
  compact: 'cashflow',
  planner: 'growth',
  custom: 'overview'
}
const PUBLIC_AUTH_ROUTE_MODES = {
  '/login': 'login',
  '/signup': 'signup'
}
const PUBLIC_LANDING_SECTION_SLUGS = {
  '/about': 'about',
  '/features': 'features',
  '/pricing': 'pricing',
  '/contact': 'contact',
  '/help': 'help',
  '/privacy': 'privacy',
  '/terms': 'contact'
}
const AUTHENTICATED_VIEW_PATHS = {
  dashboard: '/dashboard',
  plan: '/plan',
  transactions: '/transactions',
  accounts: '/accounts',
  wealth: '/wealth',
  savings: '/savings',
  investments: '/investments',
  categories: '/categories',
  subscriptions: '/subscriptions',
  'recurring-income': '/recurring-income',
  'android-app': '/android-app',
  contact: '/contact',
  privacy: '/privacy',
  pro: '/pro',
  settings: '/settings',
  'delete-account': '/delete-account'
}
const AUTHENTICATED_PATH_VIEW_ALIASES = {
  '/': 'dashboard',
  '/app': 'dashboard',
  '/home': 'dashboard',
  '/dashboard': 'dashboard',
  '/plan': 'plan',
  '/privacy': 'privacy',
  '/transactions': 'transactions',
  '/accounts': 'accounts',
  '/wealth': 'wealth',
  '/savings': 'savings',
  '/investments': 'investments',
  '/categories': 'categories',
  '/subscriptions': 'subscriptions',
  '/recurring-income': 'recurring-income',
  '/android-app': 'android-app',
  '/contact': 'contact',
  '/pro': 'pro',
  '/settings': 'settings',
  '/delete-account': 'delete-account'
}

const VIEW_META = {
  dashboard: { title: 'Home', eyebrow: 'Your money, in place' },
  plan: { title: 'Plan', eyebrow: 'Today and tomorrow' },
  transactions: { title: 'Activity', eyebrow: 'Money in motion' },
  accounts: { title: 'Accounts', eyebrow: 'Where money lives' },
  wealth: { title: 'Savings goals', eyebrow: 'Make room for tomorrow' },
  savings: { title: 'Savings', eyebrow: 'Goals and reserves' },
  investments: { title: 'Investments', eyebrow: 'Long-term growth' },
  categories: { title: 'Budgets & categories', eyebrow: 'Your spending plan' },
  subscriptions: { title: 'Subscriptions', eyebrow: 'Recurring costs' },
  'recurring-income': { title: 'Recurring income', eyebrow: 'Expected cashflow' },
  'android-app': { title: 'Mobile app', eyebrow: 'Pitaka on the go' },
  contact: { title: 'Contact', eyebrow: 'Help and feedback' },
  privacy: { title: 'Privacy', eyebrow: 'Your data and controls' },
  pro: { title: 'Pitaka Pro', eyebrow: 'Advanced planning' },
  settings: { title: 'More', eyebrow: 'Settings and tools' },
  'delete-account': { title: 'Delete account', eyebrow: 'Your data, your choice' }
}

const BOTTOM_SHEET_TITLES = {
  addIncome: 'Add income',
  addExpense: 'Add expense',
  addTransfer: 'Transfer',
  addWallet: 'Add account',
  addSavings: 'Create savings goal',
  addToSavings: 'Add to Savings',
  addCategory: 'Add category',
  addSubscription: 'Add subscription',
  addInvestment: 'Add investment',
  addRecurringIncome: 'Add recurring income',
  editWallet: 'Edit account',
  editSavings: 'Edit savings goal',
  fundSavings: 'Add to Savings',
  editInvestment: 'Edit investment',
  importMapping: 'Map Import Columns',
  importData: 'Review Import',
  importResult: 'Import Results'
}

const getBottomSheetTitle = (content) => {
  const key = typeof content === 'string' ? content : content?.type
  return BOTTOM_SHEET_TITLES[key] || 'Pitaka'
}

const normalizePathname = (path = '/') => {
  const normalized = String(path || '/').replace(/\/+$/, '')
  return normalized || '/'
}

const resolveAuthenticatedViewFromPath = (path = '/') => {
  const normalizedPath = normalizePathname(path)
  return AUTHENTICATED_PATH_VIEW_ALIASES[normalizedPath] || null
}

const resolveDashboardLayout = (layoutId) => {
  const migratedLayoutId = LEGACY_DASHBOARD_LAYOUTS[layoutId] || layoutId
  return DASHBOARD_LAYOUTS.some((layout) => layout.id === migratedLayoutId)
    ? migratedLayoutId
    : DEFAULT_DASHBOARD_LAYOUT
}

const createDashboardPreset = (layoutId) => {
  const resolvedLayoutId = resolveDashboardLayout(layoutId)
  const preset = DASHBOARD_LAYOUTS.find((layout) => layout.id === resolvedLayoutId)

  return {
    id: resolvedLayoutId,
    widgetOrder: preset.widgets
  }
}

const THEME_OPTIONS = [
  {
    id: 'system',
    name: 'System'
  },
  {
    id: 'light',
    name: 'Light'
  },
  {
    id: 'dark',
    name: 'Dark'
  }
]

const PRO_PRICE_AMOUNT = Number(import.meta.env.VITE_PITAKA_PRO_PRICE_AMOUNT || 50000)
const PRO_PRICE_CURRENCY = String(import.meta.env.VITE_PITAKA_PRO_PRICE_CURRENCY || 'PHP').toUpperCase()
const PRO_PAYMENT_METHOD_LABEL = String(import.meta.env.VITE_PITAKA_PRO_PAYMENT_METHOD_LABEL || 'QRPh')
const ANDROID_APP_URL = String(
  import.meta.env.VITE_PITAKA_ANDROID_APP_LINK || 'https://play.google.com/store/apps/details?id=com.pitaka.budgetbook'
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
  const [currentView, setCurrentView] = useState(() => resolveAuthenticatedViewFromPath(window.location.pathname) || 'dashboard')
  const pageHeadingRef = useRef(null)
  const previousViewRef = useRef(currentView)
  useEffect(() => {
    if (previousViewRef.current === currentView) return
    previousViewRef.current = currentView
    window.scrollTo({ top: 0, behavior: 'instant' })
    pageHeadingRef.current?.focus({ preventScroll: true })
  }, [currentView])
  useEffect(() => {
    if (userProfile?.deletionPending && currentView !== 'delete-account') setCurrentView('delete-account')
  }, [userProfile?.deletionPending, currentView])
  const shouldLoadSubscriptions = isPro
  const shouldLoadInvestments = isPro
  const shouldLoadRecurringIncomes = isPro
  const {
    selectedMonth,
    selectedYear,
    editingIncome,
    editingRecurringIncome,
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
    recurringIncomes,
    categories,
    categoryBudgets,
    subscriptions,
    netWorthSnapshots,
    loading: budgetLoading,
    syncState,
    error,
    setSelectedMonth,
    setSelectedYear,
    addIncome,
    addRecurringIncome,
    addExpense,
    addSavings,
    addCategory,
    upsertBudget,
    addSubscription,
    deleteIncome,
    deleteRecurringIncome,
    deleteExpense,
    deleteSavings,
    deleteCategory,
    deleteBudget,
    deleteSubscription,
    editIncome,
    editRecurringIncome,
    updateIncome,
    updateRecurringIncome,
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
    creditCardSummaries,
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
    enableSubscriptions: shouldLoadSubscriptions,
    enableRecurringIncomes: shouldLoadRecurringIncomes
  })

  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [notice, setNotice] = useState('')
  const clearNotice = useCallback(() => setNotice(''), [])
  const [bottomSheetContent, setBottomSheetContent] = useState(null)
  const bottomSheetRef = useRef(null)
  const [lastImportBatch, setLastImportBatch] = useState([])
  const [importColumnMapping, setImportColumnMapping] = useState({})
  const [importMappingType, setImportMappingType] = useState('expenses')
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null)
  const [billingStatus, setBillingStatus] = useState(null)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [privacyShieldEnabled, setPrivacyShieldEnabled] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('pitaka.privacyShield') !== 'off')
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('pitaka.notifications') === 'on')
  const [requestingNotifications, setRequestingNotifications] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
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
  const dashboardLayout = resolveDashboardLayout(user?.uid && dashboardLayoutPreferences[user.uid])
  const dashboardPreset = createDashboardPreset(dashboardLayout)
  const themePreference = user?.uid && themePreferences[user.uid]
    ? themePreferences[user.uid]
    : 'system'

  useEffect(() => {
    const updatePrivacyShield = () => document.body.classList.toggle('privacy-shielded', privacyShieldEnabled && document.hidden)
    updatePrivacyShield()
    document.addEventListener('visibilitychange', updatePrivacyShield)
    return () => {
      document.removeEventListener('visibilitychange', updatePrivacyShield)
      document.body.classList.remove('privacy-shielded')
    }
  }, [privacyShieldEnabled])
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
    isAuthenticated: isAuthenticated && !userProfile?.deletionPending,
    selectedMonth,
    selectedYear,
    filteredIncomes,
    filteredExpenses,
    transfers,
    walletBalances,
    savings,
    expensesByCategory
  })

  const updateDashboardLayout = (layoutId) => {
    if (!user?.uid) return
    const resolvedLayoutId = resolveDashboardLayout(layoutId)

    const nextLayoutPreferences = {
      ...dashboardLayoutPreferences,
      [user.uid]: resolvedLayoutId
    }

    setDashboardLayoutPreferences(nextLayoutPreferences)

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

  const deleteMany = async (rows, deleteHandler) => {
    if (!Array.isArray(rows) || rows.length === 0 || typeof deleteHandler !== 'function') return
    await Promise.all(rows.map((row) => deleteHandler(row.id)))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredInstallPrompt(event)
    }
    const handleInstalled = () => {
      setIsInstalled(true)
      setDeferredInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return undefined

    const systemAppearance = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const resolvedTheme = themePreference === 'system'
        ? (systemAppearance.matches ? 'dark' : 'light')
        : themePreference

      document.body.dataset.theme = resolvedTheme
      document.body.dataset.themePreference = themePreference
      document.documentElement.style.colorScheme = resolvedTheme
    }

    applyTheme()
    systemAppearance.addEventListener('change', applyTheme)

    return () => systemAppearance.removeEventListener('change', applyTheme)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isPro])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    const pendingAction = consumePendingQuickAction()
    if (pendingAction) {
      handleQuickAction(pendingAction)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, isPro])

  useEffect(() => {
    if (typeof window === 'undefined' || isNativeMobileApp || !isAuthenticated) return undefined

    const syncViewFromLocation = () => {
      const nextView = resolveAuthenticatedViewFromPath(window.location.pathname || '/')
      if (nextView) {
        setCurrentView(nextView)
      }
    }

    syncViewFromLocation()
    window.addEventListener('popstate', syncViewFromLocation)

    return () => {
      window.removeEventListener('popstate', syncViewFromLocation)
    }
  }, [isAuthenticated, isNativeMobileApp])

  useEffect(() => {
    if (typeof window === 'undefined' || isNativeMobileApp || !isAuthenticated) return

    const nextPath = AUTHENTICATED_VIEW_PATHS[currentView]
    if (!nextPath) return

    const currentPath = normalizePathname(window.location.pathname || '/')
    if (currentPath === nextPath) return

    window.history.pushState(null, '', `${nextPath}${window.location.search || ''}${window.location.hash || ''}`)
  }, [currentView, isAuthenticated, isNativeMobileApp])

  const installApp = async () => {
    if (!deferredInstallPrompt) return

    deferredInstallPrompt.prompt()
    const choice = await deferredInstallPrompt.userChoice

    if (choice?.outcome === 'accepted') {
      setDeferredInstallPrompt(null)
    }
  }

  const startProCheckout = async () => {
    if (isNativeMobileApp) throw new Error('Purchases are not available in this version of the app.')
    if (!user?.uid || !user?.email) {
      throw new Error('Please sign in with an email-backed account first')
    }

    setIsStartingCheckout(true)

    try {
      const idToken = await user.getIdToken()
      const session = await createProCheckoutSession({
        idToken,
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
    setNotice('')
    setBottomSheetContent(content)
    setShowBottomSheet(true)
  }

  const closeBottomSheet = useCallback((message) => {
    if (typeof message === 'string') setNotice(message)
    setShowBottomSheet(false)
    setBottomSheetContent(null)
  }, [])

  const requestLogout = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      description: 'Your Pitaka data stays safely stored for your next visit.',
      confirmText: 'Sign out',
      cancelText: 'Stay signed in'
    })
    if (ok) logout()
  }

  useDialogFocus(bottomSheetRef, showBottomSheet, closeBottomSheet)
  const nativeBackState = useRef(null)
  useEffect(() => {
    nativeBackState.current = { currentView, showBottomSheet }
  }, [currentView, showBottomSheet])

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    let disposed = false
    let listener
    CapacitorApp.addListener('backButton', () => {
      const { currentView, showBottomSheet } = nativeBackState.current
      const confirmation = document.querySelector('.modal-backdrop')
      if (confirmation) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); return }
      if (showBottomSheet) closeBottomSheet()
      else if (currentView !== 'dashboard') setCurrentView(['categories', 'wealth', 'savings', 'investments', 'subscriptions', 'recurring-income'].includes(currentView) ? 'plan' : 'dashboard')
      else CapacitorApp.exitApp()
    }).then((handle) => { if (disposed) handle.remove(); else listener = handle }).catch((err) => reportAppError('native.back', err))
    return () => { disposed = true; listener?.remove() }
  }, [closeBottomSheet])

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

  const currentPeriodTransfers = transfers.filter((transfer) => {
    const date = new Date(transfer.date)
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
  })

  const walletBalanceSummary = formatCurrencySummary(
    summarizeByCurrency(walletBalances, (wallet) => wallet.balance || 0, (wallet) => wallet.currency || DEFAULT_CURRENCY)
  )



  const totalSavingsSummary = formatCurrencySummary(
    summarizeByCurrency(savings, (goal) => goal.currentAmount || 0, (goal) => goal.currency || DEFAULT_CURRENCY)
  )

  const proPriceLabel = formatCurrency(PRO_PRICE_AMOUNT / 100, PRO_PRICE_CURRENCY)

  const openAndroidApp = () => {
    if (typeof window === 'undefined') return
    window.open(ANDROID_APP_URL, '_blank', 'noopener,noreferrer')
  }

  const debtSnowball = [...creditCardSummaries].filter((card) => card.spent > 0).sort((a, b) => a.spent - b.spent)
  const debtAvalanche = [...debtSnowball].sort((a, b) => b.apr - a.apr || a.spent - b.spent)
  const selectedBudgetMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  useEffect(() => {
    if (!notificationsEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const warnings = categoryBudgets.filter((budget) => ['warning', 'over'].includes(budget.status)).length
      + creditCardSummaries.filter((card) => ['warning', 'maxed'].includes(card.status)).length
    if (!warnings) return
    const key = `pitaka.notification.${getLocalDateInputValue()}`
    if (window.localStorage.getItem(key)) return
    new Notification('Pitaka needs your attention', { body: `${warnings} budget or credit alert${warnings === 1 ? '' : 's'} need review.` })
    window.localStorage.setItem(key, 'sent')
  }, [categoryBudgets, creditCardSummaries, notificationsEnabled])

  const toggleNotifications = async () => {
    if (typeof Notification === 'undefined' || requestingNotifications) return
    setNotificationMessage('')
    setRequestingNotifications(true)
    try {
      const currentlyOn = notificationsEnabled && Notification.permission === 'granted'
      const permission = currentlyOn || Notification.permission !== 'default' ? Notification.permission : await Notification.requestPermission()
      const enabled = !currentlyOn && permission === 'granted'
      window.localStorage.setItem('pitaka.notifications', enabled ? 'on' : 'off')
      setNotificationsEnabled(enabled)
      if (!currentlyOn && permission !== 'granted') {
        setNotificationMessage(permission === 'denied' ? 'Notifications are blocked. Allow them in your browser or device settings.' : 'Notifications stayed off. You can try again when you’re ready.')
      }
    } catch {
      setNotificationMessage('Could not change notifications. Please try again.')
    } finally {
      setRequestingNotifications(false)
    }
  }

  const togglePrivacyShield = () => {
    const enabled = !privacyShieldEnabled
    setPrivacyShieldEnabled(enabled)
    window.localStorage.setItem('pitaka.privacyShield', enabled ? 'on' : 'off')
  }

  const downloadDiagnostics = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      online: navigator.onLine,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      errors: JSON.parse(window.localStorage.getItem('pitaka.errorLog') || '[]')
    }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    link.download = `pitaka-diagnostics-${getLocalDateInputValue()}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

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

  const savingsExists = (goal) => savings.some((existingGoal) => (
    normalizeImportValue(existingGoal.goal) === normalizeImportValue(goal.goal) &&
    normalizeImportAmount(existingGoal.targetAmount) === normalizeImportAmount(goal.targetAmount) &&
    normalizeImportAmount(existingGoal.currentAmount) === normalizeImportAmount(goal.currentAmount) &&
    normalizeImportValue(existingGoal.targetDate) === normalizeImportValue(goal.targetDate)
  ))

  const recurringIncomeExists = (income) => recurringIncomes.some((existingIncome) => (
    normalizeImportValue(existingIncome.source) === normalizeImportValue(income.source) &&
    normalizeImportAmount(existingIncome.amount) === normalizeImportAmount(income.amount) &&
    normalizeImportValue(existingIncome.startDate) === normalizeImportValue(income.startDate)
  ))

  const subscriptionExists = (subscription) => subscriptions.some((existingSubscription) => (
    normalizeImportValue(existingSubscription.name) === normalizeImportValue(subscription.name) &&
    normalizeImportAmount(existingSubscription.amount) === normalizeImportAmount(subscription.amount) &&
    normalizeImportValue(existingSubscription.startDate) === normalizeImportValue(subscription.startDate)
  ))

  const undoImportedRows = async (rows) => {
    const deleteByType = {
      wallets: deleteWallet,
      categories: deleteCategory,
      incomes: deleteIncome,
      expenses: deleteExpense,
      transfers: deleteTransfer,
      investments: deleteInvestment
    }

    let undone = 0
    let failed = 0

    for (const row of rows) {
      try {
        if (!row?.id || !deleteByType[row.type]) {
          failed++
          continue
        }
        await deleteByType[row.type](row.id)
        undone++
      } catch (err) {
        reportAppError('import.undo', err, { type: row?.type })
        failed++
      }
    }

    setLastImportBatch([])
    return { undone, failed }
  }

  const downloadJsonBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      version: 1,
      data: {
        wallets,
        categories,
        incomes,
        expenses,
        transfers,
        savings,
        subscriptions,
        recurringIncomes,
        investments
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pitaka-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const restoreJsonBackup = (file) => {
    const cleanBackupItem = (item) => {
      const payload = { ...(item || {}) }
      delete payload.id
      delete payload.userId
      delete payload.createdAt
      delete payload.updatedAt
      return payload
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        const data = parsed?.data || parsed
        const restorePlan = [
          ['wallets', addWallet, walletExists],
          ['categories', addCategory, categoryExists],
          ['savings', addSavings, savingsExists],
          ['incomes', addIncome, incomeExists],
          ['expenses', addExpense, expenseExists],
          ['transfers', addTransfer, transferExists],
          ['recurringIncomes', addRecurringIncome, recurringIncomeExists],
          ['subscriptions', addSubscription, subscriptionExists],
          ['investments', addInvestment, investmentExists]
        ]
        let restored = 0
        let skipped = 0

        for (const [key, addHandler, exists] of restorePlan) {
          for (const item of data[key] || []) {
            const payload = cleanBackupItem(item)
            if (exists(payload)) {
              skipped++
              continue
            }
            await addHandler(payload)
            restored++
          }
        }

        alert(`Backup restored.\nImported: ${restored}\nSkipped duplicates: ${skipped}`)
      } catch (err) {
        reportAppError('backup.restore', err)
        alert('Failed to restore backup: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const renderPageSummary = ({ title, description, stats = [] }) => (
    <section className="workspace-summary" aria-label={`${title} summary`}>
      <p className="workspace-description">{description}</p>
      {stats.length > 0 && <div className="workspace-summary-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="workspace-stat">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>}
    </section>
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
    if (normalizedPublicPath === '/delete-account') return (
      <div className="public-account-page">
        <a href="/">← Pitaka</a>
        <h1>Delete or remove your Pitaka data</h1>
        <p>This page explains how to remove selected records or delete your full Pitaka account. You can use it without reinstalling the app.</p>
        <section aria-labelledby="delete-selected-data">
          <h2 id="delete-selected-data">Delete selected data and keep your account</h2>
          <p>Sign in to Pitaka, open the section containing the record, choose its Delete action, and confirm. You can remove individual income, expense, transfer, account, category, budget, savings goal, recurring item, or investment records without deleting your account.</p>
          <p>To ask for help with deleting specific data, use the <a href="https://pitaka-sigma.vercel.app/#contact">Pitaka contact form</a>. Tell us the account email and the type of data; do not include passwords or financial account numbers.</p>
        </section>
        <section aria-labelledby="delete-full-account">
          <h2 id="delete-full-account">Delete your full account</h2>
          <p>Sign in below, then confirm your email and password or Google account. A successful request deletes your Pitaka sign-in, profile, and associated cloud finance records, including accounts, transactions, categories, budgets, savings goals, recurring items, investments, lending records, snapshots, and Pitaka billing records.</p>
          <p>Downloaded exports and copies on other devices are not removed. Payment providers may retain their own transaction records under their policies and legal requirements.</p>
        </section>
        <Suspense fallback={<SectionFallback />}><Auth initialMode="login" /></Suspense>
      </div>
    )
    const publicAuthMode = PUBLIC_AUTH_ROUTE_MODES[normalizedPublicPath] || null
    const landingSection = PUBLIC_LANDING_SECTION_SLUGS[normalizedPublicPath] || null
    const showPublicBlog = !isNativeMobileApp
      && (
        normalizedPublicPath === '/blog'
        || normalizedPublicPath.startsWith('/blog/')
        || normalizedPublicPath === '/blogs'
        || normalizedPublicPath.startsWith('/blogs/')
      )

    return (
      <Suspense fallback={<SectionFallback label="Loading..." />}>
        {isNativeMobileApp
          ? <Auth />
          : publicAuthMode
            ? <Auth initialMode={publicAuthMode} />
          : showPublicBlog
            ? <Blog onBackToLanding={() => openPublicRoute('/')} />
            : (
              <Landing
                initialSection={landingSection}
                onOpenAuthRoute={(mode = 'login') => {
                  openPublicRoute(mode === 'signup' ? '/signup' : '/login')
                }}
                onOpenBlogRoute={() => openPublicRoute('/blogs')}
              />
            )}
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
            recurringIncomes={recurringIncomes}
            netWorthSnapshots={netWorthSnapshots}
            categoryBudgets={categoryBudgets}
            isPro={isPro}
            expensesByCategory={expensesByCategory}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            preset={dashboardPreset}
            presets={DASHBOARD_LAYOUTS}
            onPresetChange={updateDashboardLayout}
            onNavigate={setCurrentView}
            onAddAccount={() => openBottomSheet('addWallet')}
          />
        )

      case 'plan':
        return <PlanHub onNavigate={setCurrentView} onNewGoal={() => { editSavings(null); openBottomSheet('addSavings') }} categoryBudgets={categoryBudgets} savings={savings} isPro={isPro} />

      case 'transactions':
        return (
          <div className="mobile-content page-shell">
            <TransactionFeed
              incomes={filteredIncomes} expenses={filteredExpenses} transfers={currentPeriodTransfers} wallets={walletBalances}
              onAdd={() => { editExpense(null); openBottomSheet('addExpense') }}
              onEdit={(entry) => {
                if (entry.type === 'income') { editIncome(entry); openBottomSheet('addIncome') }
                else { editExpense(entry); openBottomSheet('addExpense') }
              }}
              onDelete={(entry) => entry.type === 'income' ? deleteIncome(entry.id) : entry.type === 'expense' ? deleteExpense(entry.id) : deleteTransfer(entry.id)}
            />
          </div>
        )

      case 'accounts':
        return (
          <div className="mobile-content page-shell">
            {renderPageSummary({
              title: 'Accounts',
              description: 'Keep your cash, bank accounts, e-wallets, and cards together.',
              stats: [
                { label: 'Accounts', value: walletBalances.length },
                { label: 'Current balance', value: walletBalanceSummary }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><WalletIcon size={18} /> Your accounts</h3>
                  <p className="card-subtitle">Your balances at a glance. Open an account for details.</p>
                </div>
                <button
                  onClick={() => openBottomSheet('addWallet')}
                  className="btn btn-primary"
                >
                  + Add account
                </button>
              </div>
              <WalletsTable
                wallets={walletBalances}
                onEditWallet={(wallet) => openBottomSheet({ type: 'editWallet', wallet })}
                onDeleteWallet={deleteWallet}
                selectable
                onBulkDelete={(rows) => deleteMany(rows, deleteWallet)}
              />
            </div>
            {debtSnowball.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title"><WalletIcon size={18} /> Debt Payoff Strategy</h3>
                    <p className="card-subtitle">Compare the quickest psychological wins with the lowest-interest-cost order.</p>
                  </div>
                </div>
                <div className="layout-preference-list layout-preference-list--two-up">
                  <div className="layout-preference-card">
                    <strong>Snowball</strong>
                    <div className="layout-preference-description">{debtSnowball.map((card) => card.name).join(' → ')}</div>
                  </div>
                  <div className="layout-preference-card">
                    <strong>Avalanche</strong>
                    <div className="layout-preference-description">{debtAvalanche.map((card) => `${card.name} (${card.apr || 0}% APR)`).join(' → ')}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )

      case 'savings':
      case 'investments':
      case 'wealth':
        return (
          <div className="mobile-content page-shell">
            {renderPageSummary({
              title: currentView === 'investments' ? 'Investments' : 'Savings goals',
              description: currentView === 'investments' ? 'Keep track of your holdings, cost, and current value.' : 'Give your plans a goal and build your savings, one contribution at a time.',
              stats: currentView === 'investments'
                ? []
                : [{ label: 'Savings goals', value: savings.length }, { label: 'Reserved', value: totalSavingsSummary }]
            })}

            {currentView !== 'investments' && <>
            <div className="card savings-overview-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><TrendUpIcon size={18} /> Savings goals</h3>
                  <p className="card-subtitle">{savings.length} active goal{savings.length === 1 ? '' : 's'}</p>
                </div>
                <div className="savings-actions">
                <button
                  onClick={() => { editSavings(null); openBottomSheet('addSavings') }}
                  className="btn btn-primary"
                >
                  + New goal
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

                    <div className="savings-goal-track" role="progressbar" aria-label={`${goal.goal} progress`} aria-valuenow={Math.round(goal.progress)} aria-valuemin={0} aria-valuemax={100}>
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
                        className="btn btn-primary"
                        onClick={() => openBottomSheet({ type: 'fundSavings', savingsId: goal.id })}
                      >
                        Add funds
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openBottomSheet({ type: 'editSavings', savings: goal })}
                      >
                        Edit goal
                      </button>
                      <button
                        type="button"
                        className="btn danger savings-delete-btn"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete savings goal',
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
                  <button className="btn btn-primary" onClick={() => { editSavings(null); openBottomSheet('addSavings') }}>
                    Create a goal
                  </button>
                </div>
              </div>
            )}
            </div>
            </>}
            {currentView === 'investments' &&
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
                  >
                    + Add investment
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentView('pro')}
                    className="btn btn-primary"
                  >
                    Unlock Pro
                  </button>
                )}
              </div>
              {isPro ? (
                <InvestmentsTable
                  investments={investments}
                  onEdit={(investment) => openBottomSheet({ type: 'editInvestment', investment })}
                  onDelete={deleteInvestment}
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
            </div>}
          </div>
        )

      case 'recurring-income':
        return isPro ? (
          <div className="mobile-content page-shell">
            {renderPageSummary({
              title: 'Recurring Income',
              description: 'Manage repeating income schedules and keep the next payout dates accurate.',
              stats: [
                { label: 'Schedules', value: recurringIncomes.length },
                { label: 'This Month Entries', value: filteredIncomes.length }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><IncomeIcon size={18} /> Income schedules</h3>
                  <p className="card-subtitle">Create and maintain salary, allowance, or retainer schedules.</p>
                </div>
                <button
                  onClick={() => openBottomSheet('addRecurringIncome')}
                  className="btn btn-primary"
                >
                  + Add recurring income
                </button>
              </div>
              <RecurringIncomesTable
                recurringIncomes={recurringIncomes}
                wallets={walletBalances}
                onEditRecurringIncome={(recurringIncome) => {
                  editRecurringIncome(recurringIncome)
                  openBottomSheet('addRecurringIncome')
                }}
                onDeleteRecurringIncome={deleteRecurringIncome}
                selectable
                onBulkDelete={(rows) => deleteMany(rows, deleteRecurringIncome)}
              />
            </div>
          </div>
        ) : (
          <div className="mobile-content page-shell">
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h2 style={{ marginBottom: '16px' }}>Recurring Income</h2>
              <p style={{ marginBottom: '24px', opacity: 0.7 }}>This feature is exclusively available to Pro subscribers.</p>
              <button
                onClick={() => setCurrentView('pro')}
                className="btn btn-primary"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        )

      case 'categories':
        return (
          <div className="mobile-content page-shell">
            {renderPageSummary({
              title: 'Categories',
              description: 'Plan your monthly spending, then see what is left in each category.',
              stats: [
                { label: 'Categories', value: categories.length },
                { label: 'Budgets set', value: categoryBudgets.filter((entry) => entry.hasBudget).length }
              ]
            })}

            <section className="card budget-workspace">
              <div className="card-header" >
                <div>
                  <h3 className="card-title"><ChartIcon size={18} /> Monthly budgets</h3>
                  <p className="card-subtitle">Set monthly category limits and watch what is left for the current month.</p>
                </div>
              </div>
              <BudgetManager
                monthKey={selectedBudgetMonthKey}
                categories={categories}
                categoryBudgets={categoryBudgets}
                onSaveBudget={upsertBudget}
                onDeleteBudget={deleteBudget}
              />
            </section>

            <details className="settings-preferences categories-library">
              <summary>Manage categories<span>Create, rename, and organize your spending categories</span></summary>
            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><CategoryIcon size={18} /> Categories</h3>
                  <p className="card-subtitle">Create and refine the buckets that power dashboard insights and expense tracking.</p>
                </div>
                <button
                  onClick={() => openCategorySheet()}
                  className="btn btn-primary"
                >
                  + Add category
                </button>
              </div>
              <CategoryTable
                categories={categories}
                onEditCategory={openCategorySheet}
                onDeleteCategory={deleteCategory}
                selectable
                onBulkDelete={(rows) => deleteMany(rows, deleteCategory)}
              />
            </div>
            </details>
          </div>
        )

      case 'subscriptions':
        return isPro ? (
          <div className="mobile-content page-shell">
              {renderPageSummary({
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
                  <h3 className="card-title"><ExpenseIcon size={18} /> Bills & subscriptions</h3>
                  <p className="card-subtitle">Manage recurring bills and let each due date log itself automatically into your expenses.</p>
                </div>
                <button
                  onClick={() => openSubscriptionSheet()}
                  className="btn btn-primary"
                >
                  + Add subscription
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
            {renderPageSummary({
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
        if (Capacitor.getPlatform() === 'android') return <GooglePlayProPurchase user={user} isPro={isPro} />
        if (isNativeMobileApp) return <div className="mobile-content page-shell"><section className="card finance-empty"><TrendUpIcon size={36} /><h2>Pitaka Pro</h2><p>Pro purchases are available in the Android app and on the Pitaka website.</p><button className="btn btn-primary" onClick={() => setCurrentView('plan')}>Back to Plan</button></section></div>

        return (
          <div className="mobile-content page-shell">
            {renderPageSummary({
              title: 'Pitaka Pro',
              description: 'Unlock recurring income automation, automatic subscription tracking, full currency support, and investment tracking with a one-time upgrade.',
              stats: [
                { label: 'Current Plan', value: isPro ? 'Pro' : 'Basic' },
                { label: 'Premium features', value: isPro ? 'Unlocked' : 'Available' }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><TrendUpIcon size={18} /> Pitaka Pro</h3>
                  <p className="card-subtitle">
                    {isPro
                      ? 'Your account already has Pro access, including Android app distribution access, recurring income automation, automatic subscription logging, investment tracking, and every supported currency.'
                      : 'Upgrade with PayMongo to unlock recurring income automation, automatic subscription logging, full currency access, investment tracking, and future premium features.'}
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
                      <div className="plan-checklist-item is-locked">Recurring income automation with next-due tracking</div>
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
                      <div className="plan-checklist-item is-included">Recurring income automation with next-due tracking</div>
                      <div className="plan-checklist-item is-included">Automatic subscription logging with upcoming-bill visibility</div>
                      <div className="plan-checklist-item is-included">Investment tracking alongside your budget</div>
                      <div className="plan-checklist-item is-included">All supported currencies across wallets, goals, and investments</div>
                      <div className="plan-checklist-item is-included">Future Pro-only features included</div>
                    </div>
                  </div>
                </div>
              </section>

              {!isPro && (
                <section className="pro-purchase-card">
                  <div className="pro-purchase-copy">
                    <span className="eyebrow">One-Time Upgrade</span>
                    <h4 className="pro-purchase-title">Buy Pitaka Pro</h4>
                    <p className="pro-purchase-text">
                      Get recurring income automation, automatic subscription logging, full currency support, investment tracking, and future Pro-only features through a one-time PayMongo checkout.
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
                            reportAppError('billing.checkout', checkoutError)
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
                      <strong>After payment confirmation</strong>
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
                  Pro access is active on your account{userProfile.email ? ` for ${userProfile.email}` : ''}.
                </div>
              )}
            </div>
          </div>
        )

      case 'android-app':
        return (
          <div className="mobile-content page-shell">
            {renderPageSummary({
              title: 'Pitaka Android App',
              description: 'Install Pitaka on Android, including its home-screen widgets and quick actions.',
              stats: [
                { label: 'Android app', value: 'Google Play' },
                { label: 'Plan', value: isPro ? 'Pro' : 'Basic' }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><DownloadIcon size={18} /> Get Pitaka for Android</h3>
                  <p className="card-subtitle">
                    Download the free app from Google Play. Pro features can be purchased separately inside the app.
                  </p>
                </div>
                <div className="sidebar-plan-badge basic">Free download</div>
              </div>

              <div className="plan-comparison-grid" style={{ marginTop: '1rem' }}>
                <div className="plan-tier-card is-active">
                  <div className="plan-tier-header">
                    <span className="plan-tier-name">What you get</span>
                    <span className="plan-tier-badge">Google Play</span>
                  </div>
                  <div className="plan-checklist">
                    <div className="plan-checklist-item is-included">Install Pitaka as a native Android app</div>
                    <div className="plan-checklist-item is-included">Use home screen widgets and quick actions</div>
                    <div className="plan-checklist-item is-included">Install and update from Google Play</div>
                  </div>
                </div>

              </div>

              <div className="form-buttons android-app-actions">
                <button type="button" className="btn btn-primary" onClick={openAndroidApp}>Open Google Play</button>
                <button type="button" className="btn btn-secondary" onClick={() => setCurrentView('settings')}>Back to Settings</button>
              </div>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="mobile-content page-shell">
            {renderPageSummary({
              title: 'Contact Pitaka',
              description: 'Send feedback, feature requests, or concerns without leaving the app.',
              stats: []
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><ActivityIcon size={18} /> Feedback Form</h3>
                  <p className="card-subtitle">Use this page for bug reports, product suggestions, or general concerns. A concise subject and a clear reproduction note make follow-up much faster.</p>
                </div>
              </div>
              <ContactForm />
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="mobile-content page-shell">
            {renderPageSummary({
              title: 'Privacy & Security',
              description: 'How Pitaka handles finance data, account access, and billing.',
              stats: []
            })}

            <div className="card page-hero-card">
              <h3 className="card-title"><SettingsIcon size={18} /> Data Handling</h3>
              <div className="layout-preference-list">
                <div className="layout-preference-card active">
                  <div className="layout-preference-top">
                    <span className="layout-preference-name">Your records stay in your account</span>
                  </div>
                  <div className="layout-preference-description">Your finance records are stored in your account and synced across your signed-in devices.</div>
                </div>
                <div className="layout-preference-card active">
                  <div className="layout-preference-top">
                    <span className="layout-preference-name">Money inputs are validated</span>
                  </div>
                  <div className="layout-preference-description">You can correct or delete entries from Activity. Account balances update with your records.</div>
                </div>
                <div className="layout-preference-card active">
                  <div className="layout-preference-top">
                    <span className="layout-preference-name">You control your account</span>
                  </div>
                  <div className="layout-preference-description">You can permanently delete your account and saved records from More → Delete account & data, or visit /delete-account on the Pitaka website.</div>
                </div>
                <div className="layout-preference-card active">
                  <div className="layout-preference-top">
                    <span className="layout-preference-name">Backups are user controlled</span>
                  </div>
                  <div className="layout-preference-description">You can download a copy of your records from More. Keep these files private: they contain your financial information.</div>
                </div>
              </div>
              <p><a href="https://pitaka-sigma.vercel.app/privacy-policy.html" target="_blank" rel="noreferrer">Read the full Privacy Policy</a></p>
            </div>
          </div>
        )

      case 'delete-account':
        return <div className="mobile-content page-shell"><DeleteAccount /></div>

      case 'settings':
        return (
          <div className="mobile-content page-shell">
            {renderPageSummary({
              title: 'More',
              description: 'Manage your account, keep a backup, and make Pitaka feel like yours.',
              stats: []
            })}

            <div className="card settings-profile">
              <span className="settings-avatar" aria-hidden="true">{(user?.displayName || user?.email || 'P')[0].toUpperCase()}</span>
              <div className="settings-profile-copy">
                <h3 className="card-title">{user?.displayName || 'Your account'}</h3>
                <p className="card-subtitle">{user?.email}</p>
                <span className="settings-plan">Pitaka {isPro ? 'Pro' : 'Basic'}</span>
              </div>
              <button type="button" onClick={requestLogout} className="btn btn-secondary account-signout-btn"><LogoutIcon size={16} /> Sign out</button>
            </div>

            <SettingsPreferences
              layouts={DASHBOARD_LAYOUTS}
              layout={dashboardLayout}
              onLayoutChange={updateDashboardLayout}
              themes={THEME_OPTIONS}
              theme={themePreference}
              onThemeChange={updateThemePreference}
              privacyShieldEnabled={privacyShieldEnabled}
              onTogglePrivacy={togglePrivacyShield}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={toggleNotifications}
              notificationPermission={typeof Notification === 'undefined' ? 'unsupported' : Notification.permission}
              requestingNotifications={requestingNotifications}
              notificationMessage={notificationMessage}
              onDownloadDiagnostics={downloadDiagnostics}
            />

            <div className="card page-hero-card">
              <h3 className="card-title">Support & account</h3>

              <div className="settings-links">
                <button onClick={() => setCurrentView('contact')} className="settings-link"><ActivityIcon size={20} /><span>Help & feedback<small>Report an issue or share an idea</small></span><ChevronRightIcon size={18} /></button>
                <button onClick={() => setCurrentView('privacy')} className="settings-link"><SettingsIcon size={20} /><span>Privacy & security<small>How your data is stored and protected</small></span><ChevronRightIcon size={18} /></button>
                {!isNativeMobileApp && <button onClick={() => setCurrentView('android-app')} className="settings-link"><DownloadIcon size={20} /><span>Get the Android app<small>Take Pitaka with you</small></span><ChevronRightIcon size={18} /></button>}
                <button onClick={() => setCurrentView('delete-account')} className="settings-link is-danger"><LogoutIcon size={20} /><span>Delete account & data<small>Permanently remove your account</small></span><ChevronRightIcon size={18} /></button>
              </div>
            </div>

            <details className="settings-preferences settings-data">
              <summary>Backups & transfers<span>Export records, import a file, or restore a backup</span></summary>
              <div className="card">
              <p className="card-subtitle">Downloaded files contain your financial records. Keep them somewhere private.</p>
              <div className="settings-action-list">
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
                  className="btn btn-secondary"
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
                          if (data.unmapped) {
                            const headers = data.unmapped.headers || []
                            setImportMappingType('expenses')
                            setImportColumnMapping({
                              date: headers.find((header) => /date/i.test(header)) || '',
                              description: headers.find((header) => /description|merchant|name|memo/i.test(header)) || '',
                              source: headers.find((header) => /source|payer|employer|description|name/i.test(header)) || '',
                              amount: headers.find((header) => /amount|debit|charge/i.test(header)) || '',
                              category: headers.find((header) => /category/i.test(header)) || '',
                              walletName: headers.find((header) => /wallet|account/i.test(header)) || '',
                              fromWalletName: headers.find((header) => /from/i.test(header)) || '',
                              toWalletName: headers.find((header) => /to/i.test(header)) || '',
                              notes: headers.find((header) => /note|memo/i.test(header)) || ''
                            })
                            openBottomSheet({ type: 'importMapping', data })
                          } else {
                            openBottomSheet({ type: 'importData', data })
                          }
                        } catch (err) {
                          reportAppError('import.file', err)
                          alert('Failed to import file: ' + err.message)
                        }
                      }
                    }
                    input.click()
                  }}
                  className="btn btn-secondary"
                >
                  <UploadIcon size={16} /> Import from Excel
                </button>

                <button
                  onClick={downloadImportTemplate}
                  className="btn btn-secondary"
                >
                  <TemplateIcon size={16} /> Download import template
                </button>

                <button
                  onClick={downloadJsonBackup}
                  className="btn btn-secondary"
                >
                  <DownloadIcon size={16} /> Download JSON backup
                </button>

                <button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.json'
                    input.onchange = (e) => {
                      const file = e.target.files[0]
                      if (file) restoreJsonBackup(file)
                    }
                    input.click()
                  }}
                  className="btn btn-secondary"
                >
                  <UploadIcon size={16} /> Restore JSON backup
                </button>
              </div>
            </div>

            </details>



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
              closeBottomSheet('Income added')
            }}
            editingIncome={editingIncome}
            onUpdateIncome={async (income) => {
              await updateIncome(income)
              closeBottomSheet('Income updated')
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
              closeBottomSheet('Expense added')
            }}
            editingExpense={editingExpense}
            onUpdateExpense={async (expense) => {
              await updateExpense(expense)
              closeBottomSheet('Expense updated')
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
              closeBottomSheet('Transfer recorded')
            }}
            wallets={walletBalances}
          />
        )

      case 'addWallet':
        return (
          <WalletForm
            onAddWallet={async (wallet) => {
              await addWallet(wallet)
              closeBottomSheet('Account added')
            }}
          />
        )

      case 'addSavings':
        return (
          <SavingsForm
            onAddSavings={async (goal) => {
              await addSavings(goal)
              closeBottomSheet('Savings goal added')
            }}
            editingSavings={editingSavings}
            onUpdateSavings={async (goal) => {
              await updateSavings(goal)
              closeBottomSheet('Savings goal updated')
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
            <h3 className="card-title"><TrendUpIcon size={18} /> Add funds to goal</h3>
            <AddToSavingsForm
              savings={savings}
              wallets={walletBalances}
              initialSelectedId={savings[0]?.id}
              onAddToSavings={async (savingsId, amount, options) => {
                await addToSavingsGoal(savingsId, amount, options)
                closeBottomSheet('Savings contribution recorded')
              }}
            />
          </div>
        )

      case 'addCategory':
        return (
          <CategoryForm
            onAddCategory={async (category) => {
              await addCategory(category)
              closeBottomSheet('Category added')
            }}
            editingCategory={editingCategory}
            onUpdateCategory={async (category) => {
              await updateCategory(category)
              closeBottomSheet('Category updated')
            }}
            onCancelEdit={() => { editCategory(null); closeBottomSheet() }}
          />
        )

      case 'addSubscription':
        return isPro ? (
          <SubscriptionForm
            onAddSubscription={async (subscription) => {
              await addSubscription(subscription)
              closeBottomSheet('Subscription added')
            }}
            editingSubscription={editingSubscription}
            onUpdateSubscription={async (subscription) => {
              await updateSubscription(subscription)
              closeBottomSheet('Subscription updated')
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
              closeBottomSheet('Investment added')
            }}
          />
        ) : (
          <div className="form-container">
            <h3 className="card-title"><TrendUpIcon size={18} /> Pro Required</h3>
            <p className="card-subtitle" style={{ marginTop: '0.75rem' }}>
              Investment tracking is part of Pitaka Pro. View Pro features to learn more.
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

      case 'addRecurringIncome':
        return isPro ? (
          <RecurringIncomeForm
            onAddRecurringIncome={async (recurringIncome) => {
              await addRecurringIncome(recurringIncome)
              closeBottomSheet('Income schedule added')
            }}
            editingRecurringIncome={editingRecurringIncome}
            onUpdateRecurringIncome={async (recurringIncome) => {
              await updateRecurringIncome(recurringIncome)
              closeBottomSheet('Income schedule updated')
            }}
            onCancelEdit={() => {
              editRecurringIncome(null)
              closeBottomSheet()
            }}
            wallets={walletBalances}
          />
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ marginBottom: '16px' }}>Recurring Income is a Pro feature.</p>
            <button
              onClick={() => {
                closeBottomSheet()
                setCurrentView('pro')
              }}
              className="btn btn-primary"
            >
              Upgrade to Pro
            </button>
          </div>
        )

      default:
        if (bottomSheetContent?.type === 'editWallet') {
          return (
            <WalletForm
              editingWallet={bottomSheetContent.wallet}
              onUpdateWallet={async (wallet) => {
                await updateWallet(wallet)
                closeBottomSheet('Account updated')
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
                closeBottomSheet('Savings goal updated')
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
              <h3 className="card-title"><TrendUpIcon size={18} /> Add funds to goal</h3>
              <AddToSavingsForm
                savings={savings}
                wallets={walletBalances}
                initialSelectedId={bottomSheetContent.savingsId}
                onAddToSavings={async (savingsId, amount, options) => {
                  await addToSavingsGoal(savingsId, amount, options)
                  closeBottomSheet('Savings contribution recorded')
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
                closeBottomSheet('Investment updated')
              }}
              onCancelEdit={closeBottomSheet}
            />
          ) : null
        } else if (bottomSheetContent?.type === 'importMapping') {
          const headers = bottomSheetContent.data.unmapped?.headers || []
          const rows = bottomSheetContent.data.unmapped?.rows || []
          const getCell = (row, header) => {
            const index = headers.indexOf(header)
            return index >= 0 ? row[index] : ''
          }
          const fieldsByType = {
            expenses: [
              ['date', 'Date'],
              ['description', 'Description'],
              ['amount', 'Amount'],
              ['category', 'Category'],
              ['walletName', 'Wallet'],
              ['notes', 'Notes']
            ],
            incomes: [
              ['date', 'Date'],
              ['source', 'Source'],
              ['amount', 'Amount'],
              ['walletName', 'Wallet'],
              ['notes', 'Notes']
            ],
            transfers: [
              ['date', 'Date'],
              ['fromWalletName', 'From Wallet'],
              ['toWalletName', 'To Wallet'],
              ['amount', 'Amount'],
              ['notes', 'Notes']
            ]
          }
          const fields = fieldsByType[importMappingType] || fieldsByType.expenses

          return (
            <div className="form-container">
              <h3 className="card-title"><UploadIcon size={18} /> Map CSV Columns</h3>
              <p className="card-subtitle">Map a plain CSV into Pitaka records.</p>
              <div className="form" style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label>Import As</label>
                  <select value={importMappingType} onChange={(event) => setImportMappingType(event.target.value)}>
                    <option value="expenses">Expenses</option>
                    <option value="incomes">Income</option>
                    <option value="transfers">Transfers</option>
                  </select>
                </div>
                {fields.map(([key, label]) => (
                  <div key={key} className="form-group">
                    <label>{label}</label>
                    <select
                      value={importColumnMapping[key] || ''}
                      onChange={(event) => setImportColumnMapping((current) => ({ ...current, [key]: event.target.value }))}
                    >
                      <option value="">Skip</option>
                      {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="form-buttons" style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={closeBottomSheet} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={
                    !importColumnMapping.amount ||
                    (importMappingType === 'expenses' && !importColumnMapping.description) ||
                    (importMappingType === 'incomes' && !importColumnMapping.source) ||
                    (importMappingType === 'transfers' && (!importColumnMapping.fromWalletName || !importColumnMapping.toWalletName))
                  }
                  onClick={() => {
                    const mappedRows = rows.map((row) => {
                      const common = {
                        date: getCell(row, importColumnMapping.date) || getLocalDateInputValue(),
                        amount: Math.abs(parseFloat(getCell(row, importColumnMapping.amount)) || 0),
                        notes: getCell(row, importColumnMapping.notes)
                      }

                      if (importMappingType === 'incomes') {
                        return {
                          ...common,
                          source: getCell(row, importColumnMapping.source),
                          walletName: getCell(row, importColumnMapping.walletName)
                        }
                      }

                      if (importMappingType === 'transfers') {
                        return {
                          ...common,
                          fromWalletName: getCell(row, importColumnMapping.fromWalletName),
                          toWalletName: getCell(row, importColumnMapping.toWalletName)
                        }
                      }

                      return {
                        ...common,
                        description: getCell(row, importColumnMapping.description),
                        category: getCell(row, importColumnMapping.category),
                        walletName: getCell(row, importColumnMapping.walletName)
                      }
                    }).filter((row) => (
                      row.amount > 0 &&
                      (
                        row.description ||
                        row.source ||
                        (row.fromWalletName && row.toWalletName)
                      )
                    ))

                    openBottomSheet({
                      type: 'importData',
                      data: {
                        incomes: importMappingType === 'incomes' ? mappedRows : [],
                        expenses: importMappingType === 'expenses' ? mappedRows : [],
                        transfers: importMappingType === 'transfers' ? mappedRows : [],
                        investments: [],
                        wallets: [],
                        categories: []
                      }
                    })
                  }}
                >
                  Preview Import
                </button>
              </div>
            </div>
          )
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
                      const importedRows = []

                      // Import wallets first (needed for incomes/expenses/transfers)
                      if (importData.wallets?.length > 0) {
                        for (const wallet of importData.wallets) {
                          try {
                            if (walletExists(wallet)) {
                              skippedCount++
                              continue
                            }
                            const id = await addWallet(wallet)
                            if (id) importedRows.push({ type: 'wallets', id })
                            successCount++
                          } catch (err) {
                            reportAppError('import.wallet', err)
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
                            const id = await addCategory(category)
                            if (id) importedRows.push({ type: 'categories', id })
                            successCount++
                          } catch (err) {
                            reportAppError('import.category', err)
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
                            const id = await addIncome(income)
                            if (id) importedRows.push({ type: 'incomes', id })
                            successCount++
                          } catch (err) {
                            reportAppError('import.income', err)
                            errorCount++
                          }
                        }
                      }

                      // Import expenses
                      if (importData.expenses?.length > 0) {
                        for (const expense of importData.expenses) {
                          try {
                            const nextExpense = expense.category
                              ? expense
                              : { ...expense, category: suggestCategory(expense.description, categories) }
                            if (expenseExists(nextExpense)) {
                              skippedCount++
                              continue
                            }
                            const id = await addExpense(nextExpense)
                            if (id) importedRows.push({ type: 'expenses', id })
                            successCount++
                          } catch (err) {
                            reportAppError('import.expense', err)
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
                            const id = await addTransfer(transfer)
                            if (id) importedRows.push({ type: 'transfers', id })
                            successCount++
                          } catch (err) {
                            reportAppError('import.transfer', err)
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
                            const id = await addInvestment(investment)
                            if (id) importedRows.push({ type: 'investments', id })
                            successCount++
                          } catch (err) {
                            reportAppError('import.investment', err)
                            errorCount++
                          }
                        }
                      }

                      setLastImportBatch(importedRows)
                      setBottomSheetContent({
                        type: 'importResult',
                        successCount,
                        skippedCount,
                        errorCount,
                        importedRows
                      })
                    } catch (err) {
                      reportAppError('import.run', err)
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
        } else if (bottomSheetContent?.type === 'importResult') {
          const importedCount = bottomSheetContent.importedRows?.length || 0

          return (
            <div className="form-container">
              <h3 className="card-title"><UploadIcon size={18} /> Import Finished</h3>
              <div style={{
                background: 'var(--card-background)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.875rem',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Imported</span>
                  <strong>{bottomSheetContent.successCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Skipped duplicates</span>
                  <strong>{bottomSheetContent.skippedCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Failed</span>
                  <strong>{bottomSheetContent.errorCount}</strong>
                </div>
              </div>
              <div className="form-buttons" style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={closeBottomSheet}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Done
                </button>
                <button
                  type="button"
                  disabled={importedCount === 0 || lastImportBatch.length === 0}
                  onClick={async () => {
                    const { undone, failed } = await undoImportedRows(bottomSheetContent.importedRows || [])
                    alert(`Undo finished.\nRemoved: ${undone}\nFailed: ${failed}`)
                    closeBottomSheet()
                  }}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  Undo Import
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
      <AppNavigation desktop view={currentView} onNavigate={setCurrentView} user={user} isPro={isPro} onLogout={requestLogout} inert={showBottomSheet} />

      {/* Main Content Wrapper for Desktop */}
      <main className="desktop-main-wrapper" inert={showBottomSheet}>
        {/* Header */}
        <div className="mobile-header">
          <div className="mobile-header-content">
            <div className="header-title-block">
              {getPrimaryDestination(currentView) !== currentView ? (
                <button className="header-back" onClick={() => setCurrentView(getPrimaryDestination(currentView))}>
                  <ChevronLeftIcon size={14} /> Back to {getPrimaryDestination(currentView) === 'plan' ? 'Plan' : 'More'}
                </button>
              ) : <span className="eyebrow">{VIEW_META[currentView]?.eyebrow || 'Personal ledger'}</span>}
              <h1 ref={pageHeadingRef} tabIndex={-1}>{VIEW_META[currentView]?.title || 'Pitaka'}</h1>
            </div>
            {['dashboard', 'transactions', 'categories'].includes(currentView) && <div className="header-actions" role="group" aria-label="Reporting period">
            <button
              className="icon-btn"
              onClick={() => {
                const d = new Date(selectedYear, selectedMonth - 1)
                setSelectedMonth(d.getMonth())
                setSelectedYear(d.getFullYear())
              }}
              title="Previous month"
              aria-label="Show previous month"
            >
              <ChevronLeftIcon size={18} />
            </button>
            <input type="month" className="period-select" aria-label="Reporting month" min="1900-01" max="9999-12" value={selectedBudgetMonthKey} onChange={(event) => {
              if (!event.target.value || !event.target.validity.valid) return
              const [year, month] = event.target.value.split('-').map(Number)
              setSelectedYear(year)
              setSelectedMonth(month - 1)
            }} />
            <button
              className="icon-btn"
              onClick={() => {
                const d = new Date(selectedYear, selectedMonth + 1)
                setSelectedMonth(d.getMonth())
                setSelectedYear(d.getFullYear())
              }}
              title="Next month"
              aria-label="Show next month"
            >
              <ChevronRightIcon size={18} />
            </button>
            <button type="button" className="period-current" aria-label="Return to current month" onClick={() => { const today = new Date(); setSelectedMonth(today.getMonth()); setSelectedYear(today.getFullYear()) }}>Now</button>
          </div>}
        </div>
      </div>

      {(syncState.hasPendingWrites || syncState.isFromCache) && <div className="sync-status" role="status">{syncState.hasPendingWrites ? 'Syncing changes…' : 'Showing saved data. Reconnecting…'}</div>}

      {/* Error Banner */}
      {userProfile?.deletionPending && <div className="sync-notice" role="status">Your account is locked while deletion finishes. If deletion was interrupted, confirm your identity below to retry.</div>}
      {error && (
        <div className="app-error-banner" role="alert">
          <strong>Needs attention</strong>
          <span>{error}</span><button className="btn btn-secondary" onClick={() => window.location.reload()}>Try again</button>
        </div>
      )}

      {/* Quick Actions */}
      {['dashboard', 'transactions', 'accounts'].includes(currentView) && <section className="quick-actions-wrap" aria-label="Quick actions">
        <div className="quick-actions">
          <button
            className="quick-action-btn"
            onClick={() => { editExpense(null); openBottomSheet('addExpense') }}
          >
            <ExpenseIcon className="quick-action-icon" size={16} />
            <span className="quick-action-label-long">Add expense</span>
            <span className="quick-action-label-short">Expense</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => { editIncome(null); openBottomSheet('addIncome') }}
          >
            <IncomeIcon className="quick-action-icon" size={16} />
            <span className="quick-action-label-long">Add income</span>
            <span className="quick-action-label-short">Income</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => openBottomSheet('addTransfer')}
          >
            <TransferIcon className="quick-action-icon" size={16} />
            <span className="quick-action-label-long">Transfer</span>
            <span className="quick-action-label-short">Transfer</span>
          </button>
        </div>
      </section>}

      {/* Main Content */}
      <Suspense fallback={<SectionFallback label="Loading view..." />}>
        {renderView()}
      </Suspense>

      {/* Bottom Navigation */}
      <AppNavigation view={currentView} onNavigate={setCurrentView} />
      
      </main> {/* End desktop-main-wrapper */}

      {/* Bottom Sheet */}
      {showBottomSheet && <>
      <div
        className={`bottom-sheet-backdrop ${showBottomSheet ? 'open' : ''}`}
        onClick={closeBottomSheet}
      />
      <div
        className={`bottom-sheet ${showBottomSheet ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={bottomSheetContent ? undefined : 'Pitaka action sheet'}
        aria-labelledby={bottomSheetContent ? 'bottom-sheet-title' : undefined}
        tabIndex={-1}
        ref={bottomSheetRef}
      >
        <div className="bottom-sheet-handle" />
        {bottomSheetContent && (
          <div className="bottom-sheet-header">
            <h2 id="bottom-sheet-title">{getBottomSheetTitle(bottomSheetContent)}</h2>
            <button type="button" className="bottom-sheet-close" onClick={closeBottomSheet} aria-label="Close sheet">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        )}
        <Suspense fallback={<SectionFallback label="Loading tools..." />}>
          {renderBottomSheetContent()}
        </Suspense>
      </div>
      </>}
      <Toast open={Boolean(notice)} message={notice} onClose={clearNotice} />
    </div>
  )
}


export default ModernApp
