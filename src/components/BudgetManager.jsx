import { useMemo, useState } from 'react'
import './Form.css'

function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey || '').split('-').map(Number)
  if (!year || !month) return 'Selected Month'
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
}

function formatAmount(amount) {
  const value = Number(amount || 0)
  return value.toLocaleString('en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })
}

export default function BudgetManager({
  monthKey,
  categories = [],
  categoryBudgets = [],
  onSaveBudget,
  onDeleteBudget
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState('')

  const availableCategories = useMemo(() => (
    categories.filter((category) => {
      const existing = categoryBudgets.find((entry) => entry.categoryId === category.id && entry.hasBudget)
      return !existing || existing.categoryId === selectedCategoryId
    })
  ), [categories, categoryBudgets, selectedCategoryId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedCategoryId) return

    setSubmitting(true)
    try {
      await onSaveBudget({
        categoryId: selectedCategoryId,
        monthKey,
        amount
      })
      setSelectedCategoryId('')
      setAmount('')
      setEditingCategoryId('')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (entry) => {
    setSelectedCategoryId(entry.categoryId)
    setAmount(String(entry.amount || ''))
    setEditingCategoryId(entry.categoryId)
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <form onSubmit={handleSubmit} className="form" style={{ marginBottom: 0 }}>
        <div className="form-group">
          <label htmlFor="budget-category">Category</label>
          <select
            id="budget-category"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            required
          >
            <option value="">Select category</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="budget-amount">Monthly Budget</label>
          <input
            id="budget-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-buttons">
          <button type="submit" disabled={submitting || !selectedCategoryId}>
            {submitting ? 'Saving...' : `${editingCategoryId ? 'Update' : 'Save'} ${formatMonthLabel(monthKey)} Budget`}
          </button>
          {editingCategoryId ? (
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId('')
                setAmount('')
                setEditingCategoryId('')
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="card" style={{ padding: '1rem 1.1rem' }}>
        <div className="card-header" style={{ marginBottom: '0.75rem' }}>
          <div>
            <h3 className="card-title">Budget Coverage</h3>
            <p className="card-subtitle">Track how each category is pacing against your budget for {formatMonthLabel(monthKey)}.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {categoryBudgets.length === 0 && (
            <div className="card-subtitle">No categories yet.</div>
          )}

          {categoryBudgets.map((entry) => {
            const tone = entry.status === 'over'
              ? 'rgba(215, 131, 120, 0.16)'
              : entry.status === 'warning'
                ? 'rgba(209, 178, 121, 0.16)'
                : entry.status === 'healthy'
                  ? 'rgba(99, 178, 127, 0.12)'
                  : 'rgba(255, 255, 255, 0.04)'
            const borderColor = entry.status === 'over'
              ? 'rgba(215, 131, 120, 0.34)'
              : entry.status === 'warning'
                ? 'rgba(209, 178, 121, 0.34)'
                : entry.status === 'healthy'
                  ? 'rgba(99, 178, 127, 0.22)'
                  : 'var(--border-color)'
            const progressWidth = entry.amount > 0 ? `${Math.min(entry.utilization, 100)}%` : '0%'

            return (
              <div
                key={entry.categoryId}
                style={{
                  border: `1px solid ${borderColor}`,
                  background: tone,
                  borderRadius: '18px',
                  padding: '0.9rem 1rem',
                  display: 'grid',
                  gap: '0.7rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{entry.categoryName}</div>
                    <div className="card-subtitle" style={{ marginTop: '0.2rem' }}>
                      Budget {entry.hasBudget ? formatAmount(entry.amount) : 'not set'} | Spent {formatAmount(entry.spent)}
                    </div>
                  </div>
                  {entry.hasBudget ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => startEdit(entry)}
                        style={{ minHeight: 'auto', padding: '8px 14px' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => onDeleteBudget(entry.id)}
                        style={{ minHeight: 'auto', padding: '8px 14px' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>

                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: progressWidth,
                        height: '100%',
                        borderRadius: '999px',
                        background: entry.status === 'over'
                          ? 'linear-gradient(135deg, #d78378, #9f3d34)'
                          : entry.status === 'warning'
                            ? 'linear-gradient(135deg, #d1b279, #8a6a36)'
                            : 'linear-gradient(135deg, #78b287, #1f6a39)'
                      }}
                    />
                  </div>
                  <div className="card-subtitle">
                    {entry.hasBudget
                      ? `${entry.remaining >= 0 ? 'Remaining' : 'Over by'} ${formatAmount(Math.abs(entry.remaining))}`
                      : 'No budget set for this category yet.'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
