import React from 'react'
import DataTable from './DataTable'
import { useConfirm } from '../contexts/ConfirmContext'
import { IncomeIcon } from './Icons'

export default function IncomeTable({ incomes = [], wallets = [], onDeleteIncome, onEditIncome, onUpdateIncome, selectable = false, onBulkDelete }) {
  const confirm = useConfirm()
  const walletName = (id) => wallets.find(w => w.id === id)?.name || ''
  const columns = [
    { key: 'source', header: 'Source', className: 'col-source', width: '1fr', render: r => r.source, sortable: true, editable: true },
    { key: 'wallet', header: 'Wallet', className: 'col-wallet', width: '160px', render: r => walletName(r.walletId) },
    { key: 'amount', header: 'Amount', className: 'col-amount amount', width: '120px', render: r => `₱${Number(r.amount || 0).toFixed(2)}`, sortable: true, sortValue: r => parseFloat(r.amount || 0), editable: true, exportValue: r => Number(r.amount || 0) },
    { key: 'date', header: 'Date', className: 'col-date date', width: '140px', render: r => (r.date ? new Date(r.date).toLocaleDateString() : ''), sortable: true },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '120px', render: r => (
      <>
        <button className="edit-btn" title="Edit" aria-label="Edit" onClick={() => { onEditIncome && onEditIncome(r) }}>Edit</button>
        <button className="delete-btn" title="Delete" aria-label="Delete" onClick={async () => { const ok = await confirm({ title: 'Delete income', description: `Delete income "${r.source || ''}"? This cannot be undone.`, confirmText: 'Delete', cancelText: 'Cancel' }); if (ok) onDeleteIncome && onDeleteIncome(r.id) }}>Delete</button>
      </>
    ) }
  ]

  return (
    <DataTable
      tableClassName="table table--incomes"
      columns={columns}
      data={incomes}
      rowKey={r => r.id}
      emptyState={(
        <div className="empty-state">
          <div className="icon"><IncomeIcon size={22} /></div>
          <p>No income entries yet</p>
        </div>
      )}
      selectable={selectable}
      onBulkDelete={onBulkDelete}
      onUpdateRow={onUpdateIncome}
    />
  )
}
