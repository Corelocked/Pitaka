import React from 'react'
import DataTable from './DataTable'
import { useConfirm } from '../contexts/useConfirm'
import { formatCurrency, getWalletCurrency } from '../utils/currency'

export default function WalletsTable({ wallets = [], balances = [], onEditWallet, onDeleteWallet }) {
  const confirm = useConfirm()
  const columns = [
    { key: 'name', header: 'Name', className: 'col-name', width: '1fr', render: r => r.name, sortable: true, editable: true },
    { key: 'description', header: 'Description', className: 'col-desc', width: '2fr', render: r => r.description || '' },
    { key: 'currency', header: 'Currency', className: 'col-currency', width: '100px', render: r => getWalletCurrency(r) },
    { key: 'startingBalance', header: 'Starting', className: 'col-start', width: '140px', render: r => formatCurrency(r.startingBalance || 0, getWalletCurrency(r)) },
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
