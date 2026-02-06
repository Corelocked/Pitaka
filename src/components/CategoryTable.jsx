import React from 'react'
import DataTable from './DataTable'
import { useConfirm } from '../contexts/ConfirmContext'

export default function CategoryTable({ categories = [], onDeleteCategory, onEditCategory }) {
  const confirm = useConfirm()
  const columns = [
    { key: 'name', header: 'Category Name', className: 'col-name', width: '240px', render: r => r.name },
    { key: 'description', header: 'Description', className: 'col-desc', width: '1fr', render: r => (r.description || 'No description') },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '120px', render: r => (
      <>
        <button className="edit-btn" onClick={async () => { const ok = await confirm({ title: 'Edit category', description: `Edit category "${r.name}"?`, confirmText: 'Edit', cancelText: 'Cancel' }); if (ok) onEditCategory && onEditCategory(r) }}>Edit</button>
        <button className="delete-btn" onClick={async () => { const ok = await confirm({ title: 'Delete category', description: `Delete category "${r.name}"? This cannot be undone.`, confirmText: 'Delete', cancelText: 'Cancel' }); if (ok) onDeleteCategory && onDeleteCategory(r.id) }}>Delete</button>
      </>
    ) }
  ]

  return (
    <DataTable tableClassName="table table--categories" columns={columns} data={categories} rowKey={r => r.id} emptyState={
      <div className="empty-state">
        <div className="icon">📂</div>
        <p>No categories yet</p>
      </div>
    } />
  )
}
