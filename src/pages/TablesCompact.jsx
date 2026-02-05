import React, { useState, useMemo, useEffect } from 'react'
import { useBudget } from '../hooks/useBudget'
import IncomeTable from '../components/IncomeTable'
import ExpenseTable from '../components/ExpenseTable'
import SavingsTable from '../components/SavingsTable'
import TransactionsTable from '../components/TransactionsTable'
import WalletsTable from '../components/WalletsTable'
import LendingsTable from '../components/LendingsTable'
import WalletForm from '../components/WalletForm'
import Modal from '../components/Modal'
import './Tables.css' 

export default function TablesCompact() {
  const {
    filteredIncomes,
    filteredExpenses,
    savings,
    wallets,
    lendings,
    walletBalances,
    exportToCSV,
    deleteIncome,
    deleteExpense,
    deleteSavings,
    addWallet,
    deleteWallet,
    updateWallet,
    updateIncome,
    updateExpense,
    updateSavings
    , deleteLending
  } = useBudget()

  const [activeTab, setActiveTab] = useState('incomes')
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [minAmount, setMinAmount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // quick-add wallet state
  const [walletName, setWalletName] = useState('')
  const [walletDesc, setWalletDesc] = useState('')
  const [walletStart, setWalletStart] = useState('')
  const [walletMsg, setWalletMsg] = useState('')

  const visibleIncomes = useMemo(() => {
    const q = query.trim().toLowerCase()
    let items = q
      ? filteredIncomes.filter(i => (i.source || '').toLowerCase().includes(q) || String(i.amount).includes(q) || (i.date || '').toLowerCase().includes(q))
      : filteredIncomes
    if (minAmount) items = items.filter(i => parseFloat(i.amount || 0) >= parseFloat(minAmount))
    if (startDate) items = items.filter(i => new Date(i.date) >= new Date(startDate))
    if (endDate) items = items.filter(i => new Date(i.date) <= new Date(endDate))
    return items
  }, [filteredIncomes, query, minAmount, startDate, endDate])

  const visibleExpenses = useMemo(() => {
    const q = query.trim().toLowerCase()
    let items = q
      ? filteredExpenses.filter(e => (e.description || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q) || String(e.amount).includes(q))
      : filteredExpenses
    if (minAmount) items = items.filter(e => parseFloat(e.amount || 0) >= parseFloat(minAmount))
    if (startDate) items = items.filter(e => new Date(e.date) >= new Date(startDate))
    if (endDate) items = items.filter(e => new Date(e.date) <= new Date(endDate))
    return items
  }, [filteredExpenses, query, minAmount, startDate, endDate])

  const visibleSavings = useMemo(() => {
    const q = query.trim().toLowerCase()
    let items = q
      ? savings.filter(s => (s.goal || '').toLowerCase().includes(q) || String(s.currentAmount).includes(q) || String(s.targetAmount).includes(q))
      : savings
    if (minAmount) items = items.filter(s => parseFloat(s.currentAmount || 0) >= parseFloat(minAmount))
    return items
  }, [savings, query, minAmount])

  // Combined transactions view
  const visibleTransactions = useMemo(() => {
    const incomes = visibleIncomes.map(i => ({
      id: `income:${i.id}`,
      kind: 'income',
      description: i.source || '',
      category: '',
      amount: parseFloat(i.amount || 0),
      date: i.date || i.createdAt || null,
      walletId: i.walletId || null,
      raw: i
    }))

    const expenses = visibleExpenses.map(e => ({
      id: `expense:${e.id}`,
      kind: 'expense',
      description: e.description || '',
      category: e.category || '',
      amount: -parseFloat(e.amount || 0),
      date: e.date || e.createdAt || null,
      walletId: e.walletId || null,
      raw: e
    }))

    const svgs = visibleSavings.map(s => ({
      id: `saving:${s.id}`,
      kind: 'saving',
      description: s.goal || '',
      category: '',
      amount: parseFloat(s.currentAmount || 0),
      date: s.targetDate || s.createdAt || null,
      raw: s
    }))

    const combined = [...incomes, ...expenses, ...svgs]
    combined.sort((a,b) => (new Date(b.date || 0)) - (new Date(a.date || 0)))
    return combined
  }, [visibleIncomes, visibleExpenses, visibleSavings])

  // Tabs with icons and counts (ARIA + keyboard navigation + persistence)
  const tabs = [
    { key: 'transactions', label: 'Transactions', count: visibleTransactions.length },
    { key: 'incomes', label: 'Incomes', count: visibleIncomes.length },
    { key: 'expenses', label: 'Expenses', count: visibleExpenses.length },
    { key: 'savings', label: 'Savings', count: visibleSavings.length },
    { key: 'wallets', label: 'Wallets', count: savings.length > 0 ? savings.length : wallets.length },
    { key: 'lendings', label: 'Lendings', count: lendings.length }
  ]

  const handleTabKeyDown = (e, idx) => {
    const key = e.key
    if (key === 'ArrowRight') {
      const next = (idx + 1) % tabs.length
      setActiveTab(tabs[next].key)
      document.getElementById(`tab-${tabs[next].key}`)?.focus()
    } else if (key === 'ArrowLeft') {
      const prev = (idx - 1 + tabs.length) % tabs.length
      setActiveTab(tabs[prev].key)
      document.getElementById(`tab-${tabs[prev].key}`)?.focus()
    } else if (key === 'Home') {
      setActiveTab(tabs[0].key)
      document.getElementById(`tab-${tabs[0].key}`)?.focus()
    } else if (key === 'End') {
      setActiveTab(tabs[tabs.length - 1].key)
      document.getElementById(`tab-${tabs[tabs.length - 1].key}`)?.focus()
    } else if (key === 'Enter' || key === ' ') {
      e.preventDefault()
      setActiveTab(tabs[idx].key)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('tables.activeTab')
    if (saved && ['transactions','incomes','expenses','savings'].includes(saved)) setActiveTab(saved)
  }, [])

  useEffect(() => { localStorage.setItem('tables.activeTab', activeTab) }, [activeTab])

  const exportAll = () => {
    // prefer exporting currently visible tab; fallback to combined sections
    if (activeTab === 'transactions') {
      const txCsv = visibleTransactions.map(t => [t.kind, t.description, t.category || '', t.amount, t.date || ''].join(',')).join('\n')
      const blob = new Blob([`Type,Description,Category,Amount,Date\n${txCsv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions_export_${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return
    }

    // simple combined CSV export with labeled sections
    const sections = []
    if (visibleIncomes.length) {
      sections.push('Incomes')
      sections.push('Source,Amount,Date')
      visibleIncomes.forEach(i => sections.push([i.source ?? '', i.amount ?? '', i.date ?? ''].join(',')))
    }
    if (visibleExpenses.length) {
      sections.push('')
      sections.push('Expenses')
      sections.push('Description,Category,Amount,Date')
      visibleExpenses.forEach(e => sections.push([e.description ?? '', e.category ?? '', e.amount ?? '', e.date ?? ''].join(',')))
    }
    if (visibleSavings.length) {
      sections.push('')
      sections.push('Savings')
      sections.push('Goal,Current,Target,TargetDate')
      visibleSavings.forEach(s => sections.push([s.goal ?? '', s.currentAmount ?? '', s.targetAmount ?? '', s.targetDate ?? ''].join(',')))
    }

    const csv = sections.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget_export_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="tables-compact">
      <div className="compact-toolbar">
        <div className="tab-buttons" role="tablist" aria-label="Tables tabs">
          {tabs.map((t, idx) => (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              role="tab"
              aria-selected={activeTab === t.key}
              aria-controls={`panel-${t.key}`}
              tabIndex={activeTab === t.key ? 0 : -1}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              title={`${t.label} (${t.count})`}
            >
              <span className="tab-label">{t.label}</span>
              <span className="tab-count" aria-hidden>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="compact-controls">
          <input type="search" aria-label="Search" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} />
          <button className="filter-toggle" aria-expanded={showFilters} onClick={() => setShowFilters(s => !s)} title="Show filters">Filters</button>
          <button className="export-btn" onClick={exportAll} title="Export CSV">Export All</button>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Wallet quick-add moved to the side quick-panel */}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="filter-panel" role="region" aria-label="Table filters">
          <label>Min amount: <input type="number" min="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" /></label>
          <label>Start date: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
          <label>End date: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
          <div style={{display:'flex', gap:8}}>
            <button className="btn" onClick={() => { setMinAmount(''); setStartDate(''); setEndDate('') }}>Clear</button>
            <button className="btn" onClick={() => setShowFilters(false)}>Done</button>
          </div>
        </div>
      )}

      {/* Wallet Add Modal */}


      <div className="compact-content">
        <div role="tabpanel" id="panel-transactions" aria-labelledby="tab-transactions" hidden={activeTab !== 'transactions'}>
          <TransactionsTable
            transactions={visibleTransactions}
            wallets={wallets}
            onDeleteTransaction={(row) => {
              const [kind, id] = row.id.split(':')
              if (kind === 'income') deleteIncome(id)
              if (kind === 'expense') deleteExpense(id)
              if (kind === 'saving') deleteSavings(id)
            }}
            onBulkDelete={(rows) => rows.forEach(r => {
              const [kind, id] = r.id.split(':')
              if (kind === 'income') deleteIncome(id)
              if (kind === 'expense') deleteExpense(id)
              if (kind === 'saving') deleteSavings(id)
            })}
            onUpdateTransaction={(row) => {
              const [kind, id] = row.id.split(':')
              if (kind === 'income') {
                return updateIncome({ id, source: row.description, amount: parseFloat(row.amount) || 0, date: row.date, walletId: row.walletId })
              }
              if (kind === 'expense') {
                return updateExpense({ id, description: row.description, category: row.category, amount: Math.abs(parseFloat(row.amount)) || 0, date: row.date, walletId: row.walletId })
              }
              if (kind === 'saving') {
                return updateSavings({ id, goal: row.description, currentAmount: parseFloat(row.amount) || 0, targetDate: row.date })
              }
            }}
          />
        </div>

        <div role="tabpanel" id="panel-incomes" aria-labelledby="tab-incomes" hidden={activeTab !== 'incomes'}>
          <IncomeTable
            incomes={visibleIncomes}
            wallets={wallets}
            selectable
            onDeleteIncome={(row) => deleteIncome(row.id)}
            onBulkDelete={(rows) => rows.forEach(r => deleteIncome(r.id))}
            onUpdateIncome={(row) => updateIncome(row)}
          />
        </div>

        <div role="tabpanel" id="panel-expenses" aria-labelledby="tab-expenses" hidden={activeTab !== 'expenses'}>
          <ExpenseTable
            expenses={visibleExpenses}
            wallets={wallets}
            selectable
            onDeleteExpense={(row) => deleteExpense(row.id)}
            onBulkDelete={(rows) => rows.forEach(r => deleteExpense(r.id))}
            onUpdateExpense={(row) => updateExpense(row)}
          />
        </div>

        <div role="tabpanel" id="panel-savings" aria-labelledby="tab-savings" hidden={activeTab !== 'savings'}>
          <SavingsTable
            savings={visibleSavings}
            selectable
            onDeleteSavings={(row) => deleteSavings(row.id)}
            onBulkDelete={(rows) => rows.forEach(r => deleteSavings(r.id))}
            onUpdateSavings={(row) => updateSavings(row)}
          />
        </div>

        <div role="tabpanel" id="panel-wallets" aria-labelledby="tab-wallets" hidden={activeTab !== 'wallets'}>
          <WalletsTable
            wallets={wallets}
            balances={walletBalances}
            onEditWallet={(w) => updateWallet(w)}
            onDeleteWallet={(id) => deleteWallet(id)}
          />
        </div>
        <div role="tabpanel" id="panel-lendings" aria-labelledby="tab-lendings" hidden={activeTab !== 'lendings'}>
          <LendingsTable
            lendings={lendings}
            wallets={wallets}
            onEdit={(row) => {
              // placeholder: UI edit flow handled elsewhere
            }}
            onDelete={(id) => {
              if (typeof deleteLending === 'function') deleteLending(id)
            }}
          />
        </div>
      </div>
    </div>
  )
}
