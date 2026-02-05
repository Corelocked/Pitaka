import React from 'react'
import DataTable from './DataTable'
import './Table.css'

export default function TransactionsTable({ transactions = [], onDeleteTransaction, onUpdateTransaction, onBulkDelete }) {
  const columns = [
    { key: 'type', header: 'Type', className: 'col-type', width: '120px', render: r => (
      <span className={`badge badge-${r.kind}`}>{r.kind}</span>
    ), sortable: true },
    { key: 'description', header: 'Description', className: 'col-desc', width: '1fr', render: r => r.description, sortable: true, editable: true },
    { key: 'category', header: 'Category', className: 'col-category', width: '160px', render: r => r.category || '—', sortable: true },
    { key: 'amount', header: 'Amount', className: 'col-amount amount', width: '140px', render: r => (
      <span style={{ color: r.kind === 'expense' ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 800 }}>{r.kind === 'expense' ? '- ' : ''}₱{Number(Math.abs(r.amount) || 0).toFixed(2)}</span>
    ), sortable: true, sortValue: r => Number(r.amount || 0), editable: true, exportValue: r => Number(r.amount || 0) },
    { key: 'date', header: 'Date', className: 'col-date date', width: '160px', render: r => (r.date ? new Date(r.date).toLocaleDateString() : '—'), sortable: true },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '120px', render: r => (
      <>
        <button className="edit-btn" title="Edit" aria-label="Edit" onClick={() => onUpdateTransaction && onUpdateTransaction({ ...r, _edit: true })}>Edit</button>
        <button className="delete-btn" title="Delete" aria-label="Delete" onClick={() => onDeleteTransaction && onDeleteTransaction(r)}>Delete</button>
      </>
    ) }
  ]

  return (
    <DataTable
      tableClassName="table table--transactions"
      columns={columns}
      data={transactions}
      rowKey={r => r.id}
      emptyState={(
        <div className="empty-state">
          <div className="icon">🔄</div>
          <p>No transactions available</p>
        </div>
      )}
      selectable
      onBulkDelete={onBulkDelete}
      onUpdateRow={onUpdateTransaction}
    />
  )
}