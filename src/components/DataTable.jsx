import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import './Table.css'
import Modal from './Modal'
import Toast from './Toast'

// columns: [{ key, header, width, className, render, sortable, editable, exportValue }]
// data: array of row objects
export default function DataTable({
  columns = [],
  data = [],
  rowKey = (r, i) => r.id || i,
  tableClassName = 'table',
  emptyState = null,
  selectable = false,
  onBulkDelete,
  onBulkExport,
  onUndoBulkDelete,
  onUpdateRow,
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10
}) {
  const tableRef = useRef(null)
  const [localCols, setLocalCols] = useState(columns)
  useEffect(() => setLocalCols(columns), [columns])

  // Selection
  const [selected, setSelected] = useState(new Set())
  const toggleSelect = useCallback((id) => {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const clearSelection = () => setSelected(new Set())
  const selectAllOnPage = (rows) => setSelected(new Set(rows.map(r => rowKey(r))))

  // Confirm modal & undo toast
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteRows, setPendingDeleteRows] = useState([])
  const [toastOpen, setToastOpen] = useState(false)
  const [lastDeletedRows, setLastDeletedRows] = useState([])

  // Sorting
  const [sortBy, setSortBy] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const toggleSort = (colKey) => {
    if (sortBy === colKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(colKey); setSortDir('asc') }
  }

  const sortedData = useMemo(() => {
    if (!sortBy) return data
    const col = localCols.find(c => c.key === sortBy)
    const getVal = (r) => (col && col.sortValue) ? col.sortValue(r) : (r[sortBy] ?? '')
    const dir = sortDir === 'asc' ? 1 : -1
    return [...data].sort((a,b) => {
      const A = getVal(a)
      const B = getVal(b)
      if (A == null && B == null) return 0
      if (A == null) return -1 * dir
      if (B == null) return 1 * dir
      if (typeof A === 'number' && typeof B === 'number') return (A - B) * dir
      return String(A).localeCompare(String(B)) * dir
    })
  }, [data, sortBy, sortDir, localCols])

  // Pagination
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [page, setPage] = useState(0)
  // Reset page to 0 whenever data changes (e.g., after edit/delete)
  useEffect(() => { setPage(0) }, [data])
  useEffect(() => setPage(0), [sortedData, pageSize])
  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const pageData = useMemo(() => {
    const start = page * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, page, pageSize])

  // Column resizing
  const colRefs = useRef({})
  const resizing = useRef(null)
  useEffect(() => {
    const onMove = (e) => {
      if (!resizing.current) return
      const { key, startX, startW } = resizing.current
      const dx = e.clientX - startX
      const nextW = Math.max(40, startW + dx)
      const colEl = colRefs.current[key]
      if (colEl) colEl.style.width = nextW + 'px'
    }
    const onUp = () => { resizing.current = null }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [])

  const startResize = (key, e) => {
    const el = colRefs.current[key]
    const startW = el ? el.getBoundingClientRect().width : 120
    resizing.current = { key, startX: e.clientX, startW }
  }

  // Reordering
  const dragging = useRef(null)
  const onDragStart = (index) => (e) => { dragging.current = index; e.dataTransfer?.setData('text/plain', 'drag') }
  const onDragOver = (index) => (e) => { e.preventDefault() }
  const onDrop = (index) => (e) => {
    e.preventDefault()
    const from = dragging.current
    const to = index
    if (from == null) return
    const next = [...localCols]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setLocalCols(next)
    dragging.current = null
  }

  // Inline editing
  const [editing, setEditing] = useState(null) // { key: colKey, id: rowId }
  const startEdit = (rid, colKey) => setEditing({ id: rid, key: colKey })
  const finishEdit = async (rid, colKey, value) => {
    setEditing(null)
    if (onUpdateRow) {
      try { await onUpdateRow({ ...(data.find(r => rowKey(r) === rid)), [colKey]: value }) } catch (err) { console.error(err) }
    }
  }

  // Row mismatch highlight (keep old safety check)
  useEffect(() => {
    const el = tableRef.current
    if (!el) return
    const thCount = localCols.length + (selectable ? 1 : 0)
    el.querySelectorAll('tbody tr').forEach((tr, idx) => {
      const tdCount = tr.querySelectorAll('td').length
      if (tdCount !== thCount) {
        tr.classList.add('row-mismatch')
        console.warn(`DataTable: row ${idx} has ${tdCount} cells but header has ${thCount}`)
      } else {
        tr.classList.remove('row-mismatch')
      }
    })
  }, [pageData, localCols, selectable])

  // CSV export helper (for selected rows)
  const downloadCSV = (title, rows) => {
    if (!rows || rows.length === 0) return
    const headers = localCols.map(c => c.header)
    const lines = [headers.join(',')]
    rows.forEach(r => {
      const cells = localCols.map(c => {
        const val = (c.exportValue ? c.exportValue(r) : (typeof c.render === 'function' ? c.render(r) : r[c.key])) ?? ''
        const text = String(val).replace(/\n/g, ' ').replace(/\,/g, ' ')
        return `"${text.replace(/"/g, '""')}"`
      })
      lines.push(cells.join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (title || 'export') + '.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const selectedRows = useMemo(() => {
    const ids = new Set(Array.from(selected))
    return data.filter(r => ids.has(rowKey(r)))
  }, [selected, data])

  // default bulk export (if parent doesn't provide)
  const handleBulkExport = (rows) => {
    if (onBulkExport) return onBulkExport(rows)
    downloadCSV('selected', rows)
  }

  const handleBulkDelete = async (rows) => {
    if (!rows || rows.length === 0) return
    setPendingDeleteRows(rows)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    setConfirmOpen(false)
    if (onBulkDelete) {
      try {
        await onBulkDelete(pendingDeleteRows)
      } catch (err) {
        console.error('Bulk delete failed', err)
      }
    } else {
      console.warn('No onBulkDelete handler provided for selected rows', pendingDeleteRows)
    }

    // Store last deleted for undo and show toast
    const justDeleted = pendingDeleteRows
    setLastDeletedRows(justDeleted)
    setPendingDeleteRows([])
    setSelected(new Set())
    setToastOpen(true)
  }

  const undoDelete = async () => {
    setToastOpen(false)
    if (typeof onUndoBulkDelete === 'function') {
      try {
        await onUndoBulkDelete(lastDeletedRows)
      } catch (err) {
        console.warn('Undo failed', err)
      }
    } else {
      console.warn('No undo handler available for bulk delete')
    }
    setLastDeletedRows([])
  }

  const handleRowKeyDown = (e, row) => {
    const id = rowKey(row)
    if (e.key === 'Enter') {
      toggleSelect(id)
    } else if (e.key === 'e' || e.key === 'E') {
      // start editing first editable column
      const editableCol = localCols.find(c => c.editable)
      if (editableCol) startEdit(id, editableCol.key)
    } else if (e.key === 'Delete') {
      setPendingDeleteRows([row])
      setConfirmOpen(true)
    }
  }

  if (!data || data.length === 0) return (
    <div className={`table-wrapper ${tableClassName || ''}`}>
      {emptyState || (
        <div className="empty-state">
          <div className="icon empty-icon" aria-hidden></div>
          <p>No entries</p>
        </div>
      )}
    </div>
  )

  return (
    <div className={`table-wrapper ${tableClassName || ''}`}>
      {selectable && selected.size > 0 && (
        <div className="table-bulk-toolbar">
          <div>{selected.size} selected</div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={() => handleBulkExport(selectedRows)} className="btn">Export</button>
            <button onClick={() => handleBulkDelete(selectedRows)} className="btn danger">Delete</button>
            <button onClick={() => clearSelection()} className="btn">Clear</button>
          </div>
        </div>
      )}

      <table ref={tableRef} className={tableClassName + ' data-table'} role="table" aria-rowcount={data.length}>
        <colgroup>
          {selectable && <col className="col-select" />}
          {localCols.map(col => (
            <col key={col.key} ref={el => { colRefs.current[col.key] = el }} className={`col-${col.key}`} style={col.width ? { width: col.width } : undefined} />
          ))}
        </colgroup>
        <thead role="rowgroup">
          <tr role="row">
            {selectable && (
              <th className="col-select"><input type="checkbox" aria-label="Select page" onChange={(e) => e.target.checked ? selectAllOnPage(pageData) : clearSelection()} /></th>
            )}
            {localCols.map((col, i) => (
              <th key={col.key}
                  className={(col.className || '') + (col.sortable ? ' th-sortable' : '')}
                  draggable
                  onDragStart={onDragStart(i)}
                  onDragOver={onDragOver(i)}
                  onDrop={onDrop(i)}
              >
                <div className="th-content">
                  <button type="button" onClick={() => col.sortable && toggleSort(col.key)} className="th-btn" aria-sort={sortBy === col.key ? sortDir : 'none'}>
                    <span>{col.header}</span>
                    {col.sortable && <span className={`sort-icon ${sortBy === col.key ? sortDir : ''}`}></span>}
                  </button>
                  <div className="col-resizer" onMouseDown={(e) => startResize(col.key, e)} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {pageData.map((row, i) => (
            <tr role="row" key={rowKey(row, i)} tabIndex={0} onKeyDown={(e) => handleRowKeyDown(e, row)}>
              {selectable && (
                <td className="col-select"><input type="checkbox" checked={selected.has(rowKey(row))} onChange={() => toggleSelect(rowKey(row))} aria-label={`Select row ${i + 1}`} /></td>
              )}
              {localCols.map(col => {
                const cellKey = `${rowKey(row)}:${col.key}`
                const isEditing = editing && editing.id === rowKey(row) && editing.key === col.key
                return (
                  <td key={col.key} data-label={col.header} className={col.className || ''} onDoubleClick={() => col.editable && startEdit(rowKey(row), col.key)}>
                    {isEditing ? (
                      <input autoFocus defaultValue={row[col.key]} onBlur={(e) => finishEdit(rowKey(row), col.key, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur() } }} />
                    ) : (
                      typeof col.render === 'function' ? col.render(row) : (row[col.key] ?? '')
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-footer">
        <div className="pager">
          <button className="btn" onClick={() => setPage(0)} disabled={page === 0}>«</button>
          <button className="btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
          <div className="page-info">Page {page + 1} / {pageCount}</div>
          <button className="btn" onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>›</button>
          <button className="btn" onClick={() => setPage(pageCount - 1)} disabled={page >= pageCount - 1}>»</button>
        </div>
        <div className="page-size">
          <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value, 10))}>
            {pageSizeOptions.map(s => <option key={s} value={s}>{s} / page</option>)}
          </select>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title="Confirm delete"
        description={`Delete ${pendingDeleteRows.length} selected items? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <Toast
        open={toastOpen}
        message={`${lastDeletedRows.length} item(s) deleted`}
        actionText="Undo"
        onAction={undoDelete}
        onClose={() => setToastOpen(false)}
      />

    </div>
  )
}
