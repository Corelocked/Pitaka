import React from 'react'
import DataTable from './DataTable'
import { useConfirm } from '../contexts/ConfirmContext'
import { HandshakeIcon } from './Icons'

export default function LendingsTable({ lendings = [], wallets = [], onEdit, onDelete, selectable = false, onBulkDelete }) {
  const confirm = useConfirm()
  const walletName = (id) => wallets.find(w => w.id === id)?.name || ''

  const columns = [
    { key: 'date', header: 'Date', className: 'col-date date', width: '140px', render: r => (r.date ? new Date(r.date).toLocaleDateString() : '—'), sortable: true },
    { key: 'direction', header: 'Type', className: 'col-type', width: '120px', render: r => (r.direction === 'lent' ? 'Lent' : 'Borrowed'), sortable: true },
    { key: 'wallet', header: 'Wallet', className: 'col-wallet', width: '160px', render: r => walletName(r.walletId) },
    { key: 'amount', header: 'Amount', className: 'col-amount amount', width: '140px', render: r => (
      <span style={{ fontWeight: 800 }}>{r.direction === 'lent' ? '- ' : ''}₱{Number(r.amount || 0).toFixed(2)}</span>
    ), sortable: true, sortValue: r => Number(r.amount || 0), exportValue: r => Number(r.amount || 0) },
    { key: 'status', header: 'Status', className: 'col-status', width: '120px', render: r => r.status || 'pending', sortable: true },
    { key: 'description', header: 'Description', className: 'col-desc', width: '1fr', render: r => r.description || '' },
        { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '140px', render: r => (
          <>
            <button className="edit-btn" title="Edit" aria-label="Edit" onClick={() => { onEdit && onEdit(r) }}>Edit</button>
            <button className="delete-btn" title="Delete" aria-label="Delete" onClick={async () => { const ok = await confirm({ title: 'Delete lending', description: `Delete lending record "${r.description || ''}"? This cannot be undone.`, confirmText: 'Delete', cancelText: 'Cancel' }); if (ok) onDelete && onDelete(r.id) }}>Delete</button>
          </>
        ) }
  ]

  return (
    <DataTable
      tableClassName="table table--lendings"
      columns={columns}
      data={lendings}
      rowKey={r => r.id}
      emptyState={(
        <div className="empty-state">
          <div className="icon"><HandshakeIcon size={22} /></div>
          <p>No lending records yet</p>
        </div>
      )}
      selectable={selectable}
      onBulkDelete={onBulkDelete}
    />
  )
}
