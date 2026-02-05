import React from 'react'
import DataTable from './DataTable'

export default function CategoryTable({ categories = [], onDeleteCategory, onEditCategory }) {
  const columns = [
    { key: 'name', header: 'Category Name', className: 'col-name', width: '240px', render: r => r.name },
    { key: 'description', header: 'Description', className: 'col-desc', width: '1fr', render: r => (r.description || 'No description') },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '120px', render: r => (
      <>
        <button className="edit-btn" onClick={() => onEditCategory && onEditCategory(r)}>Edit</button>
        <button className="delete-btn" onClick={() => onDeleteCategory && onDeleteCategory(r.id)}>Delete</button>
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
