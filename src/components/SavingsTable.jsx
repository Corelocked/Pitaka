import React from 'react'
import DataTable from './DataTable'
import { useConfirm } from '../contexts/ConfirmContext'

export default function SavingsTable({ savings = [], onDeleteSavings, onEditSavings, onUpdateSavings, selectable = false, onBulkDelete }) {
  const confirm = useConfirm()
  const calcProgress = (c, t) => (t === 0 ? 0 : Math.min((c / t) * 100, 100))

  const columns = [
    { key: 'goal', header: 'Goal', className: 'col-goal', width: '1fr', render: r => r.goal, sortable: true, editable: true },
    { key: 'currentAmount', header: 'Current', className: 'col-amount amount', width: '120px', render: r => `₱${Number(r.currentAmount || 0).toFixed(2)}`, sortable: true, sortValue: r => parseFloat(r.currentAmount || 0), editable: true, exportValue: r => Number(r.currentAmount || 0) },
    { key: 'targetAmount', header: 'Target', className: 'col-amount amount', width: '120px', render: r => `₱${Number(r.targetAmount || 0).toFixed(2)}`, sortable: true, sortValue: r => parseFloat(r.targetAmount || 0), editable: true, exportValue: r => Number(r.targetAmount || 0) },
    { key: 'progress', header: 'Progress', className: 'col-progress', width: '160px', render: r => {
      const p = calcProgress(Number(r.currentAmount || 0), Number(r.targetAmount || 0))
      return <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ background:'#e6eefb', width: '100%', height:8, borderRadius:6, overflow:'hidden' }}><div style={{ width: p + '%', height:'100%', background:'#2563eb' }} /></div><span style={{ fontSize:12 }}>{p.toFixed(1)}%</span></div>
    }},
    { key: 'targetDate', header: 'Target Date', className: 'col-date date', width: '120px', render: r => (r.targetDate ? new Date(r.targetDate).toLocaleDateString() : '—'), sortable: true },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '100px', render: r => (
      <>
        <button className="edit-btn" title="Edit" aria-label="Edit" onClick={() => { onEditSavings && onEditSavings(r) }}>Edit</button>
        <button className="delete-btn" title="Delete" aria-label="Delete" onClick={async () => { const ok = await confirm({ title: 'Delete saving', description: `Delete saving "${r.name || ''}"? This cannot be undone.`, confirmText: 'Delete', cancelText: 'Cancel' }); if (ok) onDeleteSavings && onDeleteSavings(r.id) }}>Delete</button>
      </>
    ) }
  ]

  return (
    <DataTable
      tableClassName="table table--savings"
      columns={columns}
      data={savings}
      rowKey={r => r.id}
      emptyState={(
        <div className="empty-state">
          <div className="icon">🎯</div>
          <p>No savings entries yet</p>
        </div>
      )}
      selectable={selectable}
      onBulkDelete={onBulkDelete}
      onUpdateRow={onUpdateSavings}
    />
  )
}
