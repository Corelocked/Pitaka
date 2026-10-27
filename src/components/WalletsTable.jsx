import React, { useState } from 'react'
import DataTable from './DataTable'
import { useConfirm } from '../contexts/useConfirm'
import { formatCurrency, getWalletCurrency } from '../utils/currency'

export default function WalletsTable({ wallets = [], balances = [], onEditWallet, onDeleteWallet, selectable = false, onBulkDelete }) {
  const confirm = useConfirm()
  const [error, setError] = useState('')
  const typeLabel = (wallet) => {
    switch (wallet.accountType) {
      case 'credit': return 'Credit Card'
      case 'ewallet': return 'E-Wallet'
      case 'bank': return 'Bank'
      case 'savings': return 'Savings'
      case 'investment': return 'Investment'
      case 'cash': return 'Cash'
      default: return 'Other'
    }
  }

  const creditMetrics = (wallet) => {
    const balance = parseFloat(wallet.balance || 0)
    const limit = parseFloat(wallet.creditLimit || 0)
    const spent = Math.max(balance * -1, 0)
    const utilization = limit > 0 ? (spent / limit) * 100 : 0
    return { limit, spent, utilization }
  }

  const data = wallets.map(w => ({ ...w, balance: (balances.find(b => b.id === w.id)?.balance) ?? w.balance ?? 0 }))
  const hasCreditAccounts = data.some(wallet => wallet.accountType === 'credit')
  const hasMultipleCurrencies = new Set(data.map(getWalletCurrency)).size > 1

  const columns = [
    { key: 'name', header: 'Name', className: 'col-name', render: r => r.name, sortable: true },
    { key: 'accountType', header: 'Type', className: 'col-type', width: '130px', render: r => typeLabel(r), sortable: true, sortValue: r => typeLabel(r) },
    { key: 'description', header: 'Description', className: 'col-desc', render: r => r.description || '—', exportValue: r => r.description || '' },
    ...(hasMultipleCurrencies ? [{ key: 'currency', header: 'Currency', className: 'col-currency', width: '100px', render: r => getWalletCurrency(r) }] : []),
    { key: 'startingBalance', header: 'Starting', className: 'col-start', width: '140px', render: r => formatCurrency(r.startingBalance || 0, getWalletCurrency(r)) },
    ...(hasCreditAccounts ? [{
      key: 'creditLimit',
      header: 'Limit',
      className: 'col-limit',
      width: '140px',
      render: r => r.accountType === 'credit' && r.creditLimit ? formatCurrency(r.creditLimit || 0, getWalletCurrency(r)) : '—'
    },
    {
      key: 'creditSpent',
      header: 'Used',
      className: 'col-used',
      width: '140px',
      render: r => r.accountType === 'credit' ? formatCurrency(creditMetrics(r).spent, getWalletCurrency(r)) : '—',
      sortValue: r => creditMetrics(r).spent
    },
    {
      key: 'creditUtilization',
      header: 'Utilization',
      className: 'col-utilization',
      width: '140px',
      render: r => r.accountType === 'credit' && creditMetrics(r).limit > 0 ? `${creditMetrics(r).utilization.toFixed(0)}%` : '—',
      sortValue: r => creditMetrics(r).utilization
    }] : []),
    { key: 'balance', header: 'Balance', className: 'col-balance', width: '140px', render: r => formatCurrency(r.balance || 0, getWalletCurrency(r)), sortable: true, mobileSummary: true },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '128px', render: r => (
      <>
        <button className="edit-btn" title="Edit" aria-label="Edit" onClick={() => { onEditWallet && onEditWallet(r) }}>Edit</button>
        <button className="delete-btn" title="Delete" aria-label={`Delete ${r.name}`} onClick={async () => {
          if (!await confirm({ title: 'Delete account?', description: `Remove "${r.name}"? This cannot be undone. Accounts with linked records must be kept to preserve your history.`, confirmText: 'Delete account' })) return
          setError('')
          try { await onDeleteWallet?.(r.id) } catch (err) { setError(err.message || 'Could not delete this account.') }
        }}>Delete</button>
      </>
    ) }
  ]

  return (
    <>{error && <p className="form-error" role="alert">{error}</p>}<DataTable
      tableClassName="table table--wallets"
      columns={columns}
      data={data}
      searchPlaceholder="Search accounts…"
      rowKey={r => r.id}
      emptyState={(
        <div className="empty-state">
          <div className="icon empty-icon" aria-hidden></div>
          <p>No accounts yet. Add your cash, bank account, or e-wallet to get started.</p>
        </div>
      )}
      selectable={selectable}
      onBulkDelete={onBulkDelete}
    /></>
  )
}
