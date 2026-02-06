import React from 'react'
import DataTable from './DataTable'
import { useConfirm } from '../contexts/ConfirmContext'

export default function ExpenseTable({ expenses = [], wallets = [], onDeleteExpense, onEditExpense, onUpdateExpense, selectable = false, onBulkDelete }) {
  const confirm = useConfirm()
  const walletName = (id) => wallets.find(w => w.id === id)?.name || ''
  const columns = [
    { key: 'description', header: 'Description', className: 'col-desc', width: '1fr', render: r => r.description, sortable: true, editable: true },
    { key: 'category', header: 'Category', className: 'col-category', width: '140px', render: r => r.category, sortable: true },
    { key: 'wallet', header: 'Wallet', className: 'col-wallet', width: '160px', render: r => walletName(r.walletId) },
    { key: 'amount', header: 'Amount', className: 'col-amount amount', width: '120px', render: r => `₱${Number(r.amount || 0).toFixed(2)}`, sortable: true, sortValue: r => parseFloat(r.amount || 0), editable: true, exportValue: r => Number(r.amount || 0) },
    { key: 'date', header: 'Date', className: 'col-date date', width: '140px', render: r => (r.date ? new Date(r.date).toLocaleDateString() : ''), sortable: true },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '100px', render: r => (
        <>
          <button className="edit-btn" title="Edit" aria-label="Edit" onClick={() => { onEditExpense && onEditExpense(r) }}>Edit</button>
          <button className="delete-btn" title="Delete" aria-label="Delete" onClick={async () => { const ok = await confirm({ title: 'Delete expense', description: `Delete expense "${r.description || 'item'}"? This cannot be undone.`, confirmText: 'Delete', cancelText: 'Cancel' }); if (ok) onDeleteExpense && onDeleteExpense(r.id) }}>Delete</button>
        </>
    ) }
  ]

  return (
    <DataTable
      tableClassName="table table--expenses"
      columns={columns}
      data={expenses}
      rowKey={r => r.id}
      emptyState={(
        <div className="empty-state">
          <div className="icon">🛒</div>
          <p>No expense entries yet</p>
        </div>
      )}
      selectable={selectable}
      onBulkDelete={onBulkDelete}
      onUpdateRow={onUpdateExpense}
    />
  )
}
