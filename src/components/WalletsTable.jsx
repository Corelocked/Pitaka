import React from 'react'
import DataTable from './DataTable'
import { useConfirm } from '../contexts/useConfirm'
import { formatCurrency, getWalletCurrency } from '../utils/currency'

export default function WalletsTable({ wallets = [], balances = [], onEditWallet, onDeleteWallet }) {
  const confirm = useConfirm()
  const typeLabel = (wallet) => {
    switch (wallet.accountType) {
      case 'credit': return 'Credit Card'
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

  const columns = [
    { key: 'name', header: 'Name', className: 'col-name', width: '1fr', render: r => r.name, sortable: true, editable: true },
    { key: 'accountType', header: 'Type', className: 'col-type', width: '130px', render: r => typeLabel(r), sortable: true, sortValue: r => typeLabel(r) },
    { key: 'description', header: 'Description', className: 'col-desc', width: '2fr', render: r => r.description || '' },
    { key: 'currency', header: 'Currency', className: 'col-currency', width: '100px', render: r => getWalletCurrency(r) },
    { key: 'startingBalance', header: 'Starting', className: 'col-start', width: '140px', render: r => formatCurrency(r.startingBalance || 0, getWalletCurrency(r)) },
    {
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
    },
    { key: 'balance', header: 'Balance', className: 'col-balance', width: '140px', render: r => formatCurrency(r.balance || 0, getWalletCurrency(r)), sortable: true },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '120px', render: r => (
      <>
        <button className="edit-btn" title="Edit" aria-label="Edit" onClick={() => { onEditWallet && onEditWallet(r) }}>Edit</button>
        <button className="delete-btn" title="Delete" aria-label="Delete" onClick={async () => { const ok = await confirm({ title: 'Delete wallet', description: `Delete wallet "${r.name}"? This cannot be undone.`, confirmText: 'Delete', cancelText: 'Cancel' }); if (ok) onDeleteWallet && onDeleteWallet(r.id) }}>Delete</button>
      </>
    ) }
  ]

  // merge balances into wallets by id
  const data = wallets.map(w => ({ ...w, balance: (balances.find(b => b.id === w.id)?.balance) ?? w.balance ?? 0 }))

  return (
    <DataTable
      tableClassName="table table--wallets"
      columns={columns}
      data={data}
      rowKey={r => r.id}
      emptyState={(
        <div className="empty-state">
          <div className="icon empty-icon" aria-hidden></div>
          <p>No wallets yet</p>
        </div>
      )}
      onUpdateRow={() => {}}
    />
  )
}
