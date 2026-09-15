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
  const [carryover, setCarryover] = useState('')
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
        amount,
        carryover: Number(carryover || 0)
      })
      setSelectedCategoryId('')
      setAmount('')
      setCarryover('')
      setEditingCategoryId('')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (entry) => {
    setSelectedCategoryId(entry.categoryId)
    setAmount(String(entry.amount || ''))
    setCarryover(String(entry.carryover || ''))
    setEditingCategoryId(entry.categoryId)
  }

  return (
    <div className="budget-manager">
      <form onSubmit={handleSubmit} className="form budget-manager-form">
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
          <label htmlFor="budget-carryover">Carryover from Previous Month</label>
          <input id="budget-carryover" type="number" min="0" step="0.01" value={carryover} onChange={(event) => setCarryover(event.target.value)} placeholder="0.00" />
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
                setCarryover('')
                setEditingCategoryId('')
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="card budget-coverage-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Budget Coverage</h3>
            <p className="card-subtitle">Track how each category is pacing against your budget for {formatMonthLabel(monthKey)}.</p>
          </div>
        </div>

        <div className="budget-coverage-list">
          {categoryBudgets.length === 0 && (
            <div className="card-subtitle">No categories yet.</div>
          )}

          {categoryBudgets.map((entry) => {
            const progressWidth = entry.amount > 0 ? `${Math.min(entry.utilization, 100)}%` : '0%'

            return (
              <div
                key={entry.categoryId}
                className="budget-coverage-item"
                data-status={entry.status}
              >
                <div className="budget-coverage-header">
                  <div>
                    <div style={{ fontWeight: 700 }}>{entry.categoryName}</div>
                    <div className="card-subtitle" style={{ marginTop: '0.2rem' }}>
                      Budget {entry.hasBudget ? formatAmount(entry.amount) : 'not set'}{entry.carryover > 0 ? ` + ${formatAmount(entry.carryover)} carryover` : ''} | Spent {formatAmount(entry.spent)}
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
                        onClick={() => onDeleteBudget(entry.budgetId)}
                        style={{ minHeight: 'auto', padding: '8px 14px' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="budget-coverage-progress">
                  <div className="budget-progress-track">
                    <div
                      className="budget-progress-fill"
                      data-status={entry.status}
                      style={{ '--budget-progress': progressWidth }}
                    />
                  </div>
                  <div className="card-subtitle">
                    {entry.hasBudget
                      ? `${entry.remaining >= 0 ? 'Remaining' : 'Over by'} ${formatAmount(Math.abs(entry.remaining))}${entry.dailyAllowance != null ? ` | ${formatAmount(entry.dailyAllowance)} per day` : ''}`
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
