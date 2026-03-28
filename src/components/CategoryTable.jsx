import React from 'react'
import DataTable from './DataTable'
import { useConfirm } from '../contexts/ConfirmContext'
import { FolderIcon } from './Icons'

export default function CategoryTable({ categories = [], onDeleteCategory, onEditCategory, onDelete, onEdit }) {
  const confirm = useConfirm()
  const editHandlerProp = onEditCategory || onEdit
  const deleteHandlerProp = onDeleteCategory || onDelete
  React.useEffect(() => {
    try { window.__APP_LOGS = window.__APP_LOGS || []; window.__APP_LOGS.unshift({ ts: Date.now(), msg: `CategoryTable: props onEditCategory:${!!onEditCategory} onEdit:${!!onEdit} onDeleteCategory:${!!onDeleteCategory} onDelete:${!!onDelete} categories:${(categories||[]).length}` }) } catch (e) {}
    console.log('CategoryTable props:', { onEditCategory, onEdit, onDeleteCategory, onDelete, categoriesCount: (categories || []).length })
  }, [onEditCategory, onEdit, onDeleteCategory, onDelete, categories])

  const columns = [
    { key: 'name', header: 'Category Name', className: 'col-name', width: '240px', render: r => r.name },
    { key: 'description', header: 'Description', className: 'col-desc', width: '1fr', render: r => (r.description || 'No description') },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '120px', render: r => (
      <>
        <button
          className="edit-btn"
          onClick={async () => {
            console.log('CategoryTable: edit button clicked for id:', r.id)
            try { window.__APP_LOGS = window.__APP_LOGS || []; window.__APP_LOGS.unshift({ ts: Date.now(), msg: 'CategoryTable: edit clicked ' + r.id }) } catch (e) {}
            try {
              const ok = await confirm({ title: 'Edit category', description: `Edit category "${r.name}"?`, confirmText: 'Edit', cancelText: 'Cancel' })
              if (ok) {
                if (editHandlerProp) {
                  editHandlerProp(r)
                } else {
                  console.warn('CategoryTable: no edit handler prop provided; cannot toggle edit state from table')
                }
              }
            } catch (err) {
              console.error('CategoryTable: confirm for edit failed:', err)
              try { alert('Unable to open confirmation dialog: ' + (err?.message || err)) } catch (e) { }
            }
          }}
        >Edit</button>
        <button
          className="delete-btn"
          onClick={async () => {
            console.log('CategoryTable: delete button clicked for id:', r.id)
            try { window.__APP_LOGS = window.__APP_LOGS || []; window.__APP_LOGS.unshift({ ts: Date.now(), msg: 'CategoryTable: delete clicked ' + r.id }) } catch (e) {}
            let ok
            try {
              ok = await confirm({ title: 'Delete category', description: `Delete category "${r.name}"? This cannot be undone.`, confirmText: 'Delete', cancelText: 'Cancel' })
            } catch (err) {
              console.error('CategoryTable: confirm for delete failed:', err)
              try { alert('Unable to open confirmation dialog: ' + (err?.message || err)) } catch (e) { }
              return
            }
            if (!ok) return
            console.log('CategoryTable: about to call onDeleteCategory', { hasPropHandler: !!onDeleteCategory })
            try {
              if (deleteHandlerProp) {
                await deleteHandlerProp(r.id)
              } else {
                console.warn('CategoryTable: no delete handler prop provided; cannot delete from table')
                return
              }
            } catch (err) {
              console.error('CategoryTable: delete failed for id:', r.id, err)
              try { alert(err?.message || 'Failed to delete category') } catch (e) { }
            }
          }}
        >Delete</button>
      </>
    ) }
  ]

  return (
    <DataTable tableClassName="table table--categories" columns={columns} data={categories} rowKey={r => r.id} emptyState={
      <div className="empty-state">
        <div className="icon"><FolderIcon size={22} /></div>
        <p>No categories yet</p>
      </div>
    } />
  )
}
