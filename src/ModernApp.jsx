import { useEffect, useState } from 'react'
import { useContext } from 'react'
import { FirebaseContext } from './contexts/FirebaseContext'
import { useConfirm } from './contexts/useConfirm'
import { useBudget } from './hooks/useBudget'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import IncomeForm from './components/IncomeForm'
import ExpenseForm from './components/ExpenseForm'
import TransferForm from './components/TransferForm'
import WalletForm from './components/WalletForm'
import CategoryForm from './components/CategoryForm'
import SavingsForm from './components/SavingsForm'
import AddToSavingsForm from './components/AddToSavingsForm'
import TransfersTable from './components/TransfersTable'
import IncomeTable from './components/IncomeTable'
import ExpenseTable from './components/ExpenseTable'
import WalletsTable from './components/WalletsTable'
import CategoryTable from './components/CategoryTable'
import InvestmentForm from './components/InvestmentForm'
import InvestmentsTable from './components/InvestmentsTable'
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
import { DEFAULT_CURRENCY, formatCurrency, formatCurrencySummary, summarizeByCurrency } from './utils/currency'
import './MobileApp.css'

const DASHBOARD_LAYOUTS = [
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Balanced hero-led dashboard with a side rail for accounts and goals.'
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Prioritizes fast scanning with activity and accounts closer to the top.'
  },
  {
    id: 'planner',
    name: 'Planner',
    description: 'Pushes savings goals and spending planning ahead of transaction feed.'
  }
]

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

function ModernApp() {
  const { isAuthenticated, loading: authLoading, logout, user } = useContext(FirebaseContext)
  const confirm = useConfirm()
  const {
    selectedMonth,
    selectedYear,
    editingIncome,
    editingExpense,
    editingSavings,
    editingCategory,
    totalIncome,
    totalExpenses,
    totalSavings,
    netIncome,
    expensesByCategory,
    filteredIncomes,
    filteredExpenses,
    categories,
    loading: budgetLoading,
    error,
    syncState,
    setSelectedMonth,
    setSelectedYear,
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
  } = useBudget()

  const [currentView, setCurrentView] = useState('dashboard')
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [bottomSheetContent, setBottomSheetContent] = useState(null)
  const [isOnline, setIsOnline] = useState(() => (
    typeof navigator === 'undefined' ? true : navigator.onLine
  ))
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null)
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

  const dashboardLayout = user?.uid && dashboardLayoutPreferences[user.uid]
    ? dashboardLayoutPreferences[user.uid]
    : 'editorial'
  const themePreference = user?.uid && themePreferences[user.uid]
    ? themePreferences[user.uid]
    : 'light'

  const updateDashboardLayout = (layoutId) => {
    if (!user?.uid) return

    const nextPreferences = {
      ...dashboardLayoutPreferences,
      [user.uid]: layoutId
    }

    setDashboardLayoutPreferences(nextPreferences)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pitaka.dashboardLayouts', JSON.stringify(nextPreferences))
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

  const installApp = async () => {
    if (!deferredInstallPrompt) return

    deferredInstallPrompt.prompt()
    const choice = await deferredInstallPrompt.userChoice

    if (choice?.outcome === 'accepted') {
      setDeferredInstallPrompt(null)
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

  const topCategory = [...expensesByCategory]
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total)[0]

  const walletBalanceSummary = formatCurrencySummary(
    summarizeByCurrency(walletBalances, (wallet) => wallet.balance || 0, (wallet) => wallet.currency || DEFAULT_CURRENCY)
  )

  const totalSavingsSummary = formatCurrencySummary(
    summarizeByCurrency(savings, (goal) => goal.currentAmount || 0, (goal) => goal.currency || DEFAULT_CURRENCY)
  )

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
        <h1>Pitaka</h1>
        <div className="sidebar-period">
          {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>
      
      <nav className="sidebar-nav">
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
          className={`sidebar-nav-item ${currentView === 'savings' ? 'active' : ''}`}
          onClick={() => setCurrentView('savings')}
        >
          <div className="sidebar-nav-icon"><TrendUpIcon size={20} /></div>
          <div>Savings</div>
        </button>
        <button
          className={`sidebar-nav-item ${currentView === 'investments' ? 'active' : ''}`}
          onClick={() => setCurrentView('investments')}
        >
          <div className="sidebar-nav-icon"><ChartIcon size={20} /></div>
          <div>Investments</div>
        </button>
        <button
          className={`sidebar-nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          <div className="sidebar-nav-icon"><SettingsIcon size={20} /></div>
          <div>Settings</div>
        </button>
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

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <Auth />
  }

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
            expensesByCategory={expensesByCategory}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            layoutPreference={dashboardLayout}
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

            <div className="page-section-grid">
              <div className={`card page-table-card ${filteredIncomes.length === 0 ? 'page-table-card--empty' : ''}`}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title"><IncomeIcon size={18} /> Income</h3>
                    <p className="card-subtitle">{filteredIncomes.length} entries in {currentPeriodLabel}</p>
                  </div>
                </div>
                <div className={`page-table-card-body ${filteredIncomes.length === 0 ? 'page-table-card-body--empty' : ''}`}>
                  <IncomeTable
                    incomes={filteredIncomes}
                    onEditIncome={editIncome}
                    onDeleteIncome={deleteIncome}
                    wallets={walletBalances}
                  />
                </div>
              </div>

              <div className={`card page-table-card ${filteredExpenses.length === 0 ? 'page-table-card--empty' : ''}`}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title"><ExpenseIcon size={18} /> Expenses</h3>
                    <p className="card-subtitle">{filteredExpenses.length} entries in {currentPeriodLabel}</p>
                  </div>
                </div>
                <div className={`page-table-card-body ${filteredExpenses.length === 0 ? 'page-table-card-body--empty' : ''}`}>
                  <ExpenseTable
                    expenses={filteredExpenses}
                    onEditExpense={editExpense}
                    onDeleteExpense={deleteExpense}
                    wallets={walletBalances}
                  />
                </div>
              </div>

              <div className="card page-table-card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title"><TransferIcon size={18} /> Transfers</h3>
                    <p className="card-subtitle">{currentPeriodTransfers.length} internal movements</p>
                  </div>
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
              />
            </div>
          </div>
        )

      case 'savings':
        return (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Future Planning',
              title: 'Savings Goals',
              description: 'Turn long-term plans into visible targets and keep them funded with intention.',
              stats: [
                { label: 'Active Goals', value: savings.length },
                { label: 'Reserved', value: totalSavingsSummary }
              ]
            })}

            <div className="card savings-overview-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><TrendUpIcon size={18} /> Savings Goals</h3>
                  <p className="card-subtitle">{savings.length} active goal{savings.length === 1 ? '' : 's'}</p>
                </div>
              <div className="savings-summary-amount">
                {totalSavingsSummary}
              </div>
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
                  onClick={() => openBottomSheet('addCategory')}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem', minHeight: 'auto' }}
                >
                  + Add Category
                </button>
              </div>
              <CategoryTable
                categories={categories}
                onEditCategory={editCategory}
                onDeleteCategory={async (id) => {
                  const ok = await confirm({
                    title: 'Delete Category',
                    description: 'Are you sure? Expenses with this category will become uncategorized.',
                    confirmText: 'Delete',
                    cancelText: 'Cancel'
                  })
                  if (ok) deleteCategory(id)
                }}
              />
            </div>
          </div>
        )

      case 'investments':
        return (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Capital Allocation',
              title: 'Investments',
              description: 'Monitor positions, update holdings, and keep your invested capital visible beside cash.',
              stats: [
                { label: 'Positions', value: investments.length },
                { label: 'Tracked Value', value: investmentValueSummary }
              ]
            })}

            <div className="card page-hero-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><TrendUpIcon size={18} /> Investments</h3>
                  <p className="card-subtitle">Record positions, refresh values, and keep your portfolio organized.</p>
                </div>
                <button
                  onClick={() => openBottomSheet('addInvestment')}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem', minHeight: 'auto' }}
                >
                  + Add Investment
                </button>
              </div>
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
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="mobile-content page-shell">
            {renderPageIntro({
              eyebrow: 'Controls & Tools',
              title: 'Settings',
              description: 'Customize your workspace, move data in and out, and maintain supporting configuration.',
              stats: [
                { label: 'Dashboard Mode', value: DASHBOARD_LAYOUTS.find((layout) => layout.id === dashboardLayout)?.name || 'Editorial' },
                { label: 'Theme', value: THEME_OPTIONS.find((theme) => theme.id === themePreference)?.name || 'Light' },
                { label: 'Categories', value: categories.length }
              ]
            })}

            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title"><HomeIcon size={18} /> Dashboard Layout</h3>
                  <p className="card-subtitle">Choose how the home view organizes your financial overview.</p>
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

                <div style={{
                  marginTop: '12px',
                  padding: '16px',
                  background: 'var(--card-background)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px'
                }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                    About Import/Export
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Export creates an Excel-compatible CSV file with all your data. 
                    Import allows you to bulk add data from a CSV file. 
                    Download the template to see the required format.
                  </p>
                </div>
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

            <div className="card page-hero-card" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="card-title"><CategoryIcon size={18} /> Categories</h3>
                <button
                  onClick={() => openBottomSheet('addCategory')}
                  className="btn btn-primary"
                  style={{ fontSize: '1.5rem', padding: '8px 16px' }}
                >
                  +
                </button>
              </div>
              <CategoryTable
                categories={categories}
                onEdit={(category) => {
                  editCategory(category)
                  openBottomSheet('addCategory')
                }}
                onDelete={async (id) => {
                  const ok = await confirm({
                    title: 'Delete Category',
                    description: 'Are you sure you want to delete this category? This action cannot be undone.',
                    confirmText: 'Delete',
                    cancelText: 'Cancel'
                  })
                  if (ok) deleteCategory(id)
                }}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderBottomSheetContent = () => {
    if (!bottomSheetContent) return null

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
              initialSelectedId={savings[0]?.id}
              onAddToSavings={async (savingsId, amount) => {
                await addToSavingsGoal(savingsId, amount)
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

      case 'addInvestment':
        return (
          <InvestmentForm
            onAddInvestment={async (investment) => {
              await addInvestment(investment)
              closeBottomSheet()
            }}
          />
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
                initialSelectedId={bottomSheetContent.savingsId}
                onAddToSavings={async (savingsId, amount) => {
                  await addToSavingsGoal(savingsId, amount)
                  closeBottomSheet()
                }}
              />
            </div>
          )
        } else if (bottomSheetContent?.type === 'editInvestment') {
          return (
            <InvestmentForm
              editingInvestment={bottomSheetContent.investment}
              onUpdateInvestment={async (id, updates) => {
                await updateInvestment(id, updates)
                closeBottomSheet()
              }}
              onCancelEdit={closeBottomSheet}
            />
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

                      // Import wallets first (needed for incomes/expenses/transfers)
                      if (importData.wallets?.length > 0) {
                        for (const wallet of importData.wallets) {
                          try {
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
                        alert(`Successfully imported ${successCount} items.`)
                      } else {
                        alert(`Import completed with some errors:\nSuccess: ${successCount}\nFailed: ${errorCount}`)
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

      {(!isOnline || syncState.hasPendingWrites || (!isInstalled && deferredInstallPrompt)) && (
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

          {!isInstalled && deferredInstallPrompt && (
            <button type="button" className="status-pill action" onClick={installApp}>
              Install Pitaka
            </button>
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
        </div>
      </div>

      {/* Main Content */}
      {renderView()}

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
          className={`bottom-nav-item ${currentView === 'savings' ? 'active' : ''}`}
          onClick={() => setCurrentView('savings')}
        >
          <div className="bottom-nav-icon"><TrendUpIcon size={22} /></div>
          <div>Goals</div>
        </button>
        <button
          className={`bottom-nav-item ${currentView === 'investments' ? 'active' : ''}`}
          onClick={() => setCurrentView('investments')}
        >
          <div className="bottom-nav-icon"><ChartIcon size={22} /></div>
          <div>Invest</div>
        </button>
        <button
          className={`bottom-nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          <div className="bottom-nav-icon"><SettingsIcon size={22} /></div>
          <div>More</div>
        </button>
      </div>
      
      </div> {/* End desktop-main-wrapper */}

      {/* Bottom Sheet */}
      <div
        className={`bottom-sheet-backdrop ${showBottomSheet ? 'open' : ''}`}
        onClick={closeBottomSheet}
      />
      <div className={`bottom-sheet ${showBottomSheet ? 'open' : ''}`}>
        <div className="bottom-sheet-handle" />
        {renderBottomSheetContent()}
      </div>
    </div>
  )
}

export default ModernApp
