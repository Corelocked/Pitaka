import { useState } from 'react'
import { useContext } from 'react'
import { FirebaseContext } from './contexts/FirebaseContext'
import { useConfirm } from './contexts/ConfirmContext'
import { useBudget } from './hooks/useBudget'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import IncomeForm from './components/IncomeForm'
import ExpenseForm from './components/ExpenseForm'
import TransferForm from './components/TransferForm'
import WalletForm from './components/WalletForm'
import CategoryForm from './components/CategoryForm'
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
import './MobileApp.css'

function ModernApp() {
  const { isAuthenticated, loading: authLoading, logout, user } = useContext(FirebaseContext)
  const confirm = useConfirm()
  const {
    selectedMonth,
    selectedYear,
    editingIncome,
    editingExpense,
    editingCategory,
    totalIncome,
    totalExpenses,
    totalSavings,
    totalInvestments,
    netIncome,
    expensesByCategory,
    filteredIncomes,
    filteredExpenses,
    categories,
    loading: budgetLoading,
    error,
    setSelectedMonth,
    setSelectedYear,
    addIncome,
    addExpense,
    addCategory,
    deleteIncome,
    deleteExpense,
    deleteCategory,
    editIncome,
    updateIncome,
    editExpense,
    updateExpense,
    editCategory,
    updateCategory,
    walletBalances,
    addWallet,
    deleteWallet,
    updateWallet,
    addTransfer,
    deleteTransfer,
    transfers,
    investments,
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

  // Open bottom sheet with specific content
  const openBottomSheet = (content) => {
    setBottomSheetContent(content)
    setShowBottomSheet(true)
  }

  const closeBottomSheet = () => {
    setShowBottomSheet(false)
    setTimeout(() => setBottomSheetContent(null), 300)
  }

  // Desktop sidebar renderer
  const renderDesktopSidebar = () => (
    <div className="desktop-sidebar">
      <div className="sidebar-header">
        <h1>Pitaka</h1>
        <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '8px' }}>
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
            walletBalances={walletBalances}
            filteredIncomes={filteredIncomes}
            filteredExpenses={filteredExpenses}
            transfers={transfers}
            expensesByCategory={expensesByCategory}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        )

      case 'transactions':
        return (
          <div className="mobile-content">
            <div className="card">
              <h3 className="card-title"><IncomeIcon size={18} /> Income</h3>
              <IncomeTable
                incomes={filteredIncomes}
                onEditIncome={editIncome}
                onDeleteIncome={deleteIncome}
                wallets={walletBalances}
              />
            </div>
            <div className="card">
              <h3 className="card-title"><ExpenseIcon size={18} /> Expenses</h3>
              <ExpenseTable
                expenses={filteredExpenses}
                onEditExpense={editExpense}
                onDeleteExpense={deleteExpense}
                wallets={walletBalances}
              />
            </div>
            <div className="card">
              <TransfersTable
                transfers={transfers.filter(t => {
                  const d = new Date(t.date)
                  return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
                })}
                wallets={walletBalances}
                onDelete={deleteTransfer}
              />
            </div>
          </div>
        )

      case 'accounts':
        return (
          <div className="mobile-content">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><WalletIcon size={18} /> My Accounts</h3>
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

      case 'categories':
        return (
          <div className="mobile-content">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><CategoryIcon size={18} /> Categories</h3>
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
          <div className="mobile-content">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><TrendUpIcon size={18} /> Investments</h3>
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
          <div className="mobile-content">
            <div className="card">
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
                  background: '#f1f5f9',
                  borderRadius: '12px'
                }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                    About Import/Export
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                    Export creates an Excel-compatible CSV file with all your data. 
                    Import allows you to bulk add data from a CSV file. 
                    Download the template to see the required format.
                  </p>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '16px' }}>
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
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
                  Ready to import data from your file. Review the summary below:
                </p>
                <div style={{
                  background: '#f1f5f9',
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
                  background: '#dff5ef',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: 'var(--primary-700)'
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
            <div>
              <h1>Pitaka</h1>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '4px' }}>
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

      {/* Quick Actions */}
      <div className="quick-actions-wrap">
        <div className="quick-actions">
          <button
            className="quick-action-btn"
            onClick={() => openBottomSheet('addIncome')}
          >
            <IncomeIcon className="quick-action-icon" size={16} /> Add Income
          </button>
          <button
            className="quick-action-btn"
            onClick={() => openBottomSheet('addExpense')}
          >
            <ExpenseIcon className="quick-action-icon" size={16} /> Add Expense
          </button>
          <button
            className="quick-action-btn"
            onClick={() => openBottomSheet('addTransfer')}
          >
            <TransferIcon className="quick-action-icon" size={16} /> Transfer
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
