import React from 'react'
import DataTable from './DataTable'
import { useConfirm } from '../contexts/ConfirmContext'

export default function WalletsTable({ wallets = [], balances = [], onEditWallet, onDeleteWallet }) {
  const confirm = useConfirm()
  const columns = [
    { key: 'name', header: 'Name', className: 'col-name', width: '1fr', render: r => r.name, sortable: true, editable: true },
    { key: 'description', header: 'Description', className: 'col-desc', width: '2fr', render: r => r.description || '' },
    { key: 'startingBalance', header: 'Starting', className: 'col-start', width: '120px', render: r => `₱${Number(r.startingBalance || 0).toFixed(2)}` },
    { key: 'balance', header: 'Balance', className: 'col-balance', width: '120px', render: r => `₱${Number(r.balance || 0).toFixed(2)}`, sortable: true },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '120px', render: r => (
      <>
        <button className="edit-btn" title="Edit" aria-label="Edit" onClick={async () => {
          const name = window.prompt('Edit wallet name', r.name)
          if (name === null) return
          const description = window.prompt('Edit description', r.description || '')
          if (description === null) return
          const startingBalance = window.prompt('Starting balance', (r.startingBalance || 0).toString())
          if (startingBalance === null) return
          const ok = await confirm({ title: 'Save wallet', description: 'Save changes to this wallet?', confirmText: 'Save', cancelText: 'Cancel' })
          if (!ok) return
          onEditWallet && onEditWallet({ id: r.id, name: name.trim(), description: description.trim(), startingBalance: parseFloat(startingBalance) || 0 })
        }}>Edit</button>
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