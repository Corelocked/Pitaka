import { useMemo, useRef, useState } from 'react'
import './Form.css'
import { formatCurrency, SUPPORTED_CURRENCIES } from '../utils/currency'
import { useConfirm } from '../contexts/useConfirm'

function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey || '').split('-').map(Number)
  if (!year || !month) return 'Selected Month'
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
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
  const [currency, setCurrency] = useState('PHP')
  const [error, setError] = useState('')
  const amountRef = useRef(null)
  const confirm = useConfirm()

  const availableCategories = useMemo(() => (
    categories.filter((category) => {
      const existing = categoryBudgets.find((entry) => entry.categoryId === category.id && entry.hasBudget)
      return !existing || existing.categoryId === selectedCategoryId
    })
  ), [categories, categoryBudgets, selectedCategoryId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedCategoryId || submitting) return

    setSubmitting(true)
    setError('')
    try {
      await onSaveBudget({
        categoryId: selectedCategoryId,
        monthKey,
        amount: Number(amount),
        currency,
        carryover: Number(carryover || 0)
      })
      setSelectedCategoryId('')
      setAmount('')
      setCarryover('')
      setEditingCategoryId('')
    } catch (err) {
      setError(err.message || 'Could not save this budget. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (entry) => {
    setSelectedCategoryId(entry.categoryId)
    setAmount(String(entry.amount || ''))
    setCarryover(String(entry.carryover || ''))
    setEditingCategoryId(entry.categoryId)
    setCurrency(entry.currency || 'PHP')
    amountRef.current?.focus()
  }

  return (
    <div className="budget-manager">
      <form onSubmit={handleSubmit} className="form budget-manager-form">
        {error && <p className="form-error" role="alert">{error}</p>}
        {categories.length === 0 && <p className="form-hint">Open Manage categories below to add your first category.</p>}
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

        <div className="form-group"><label htmlFor="budget-currency">Budget currency</label><select id="budget-currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>{SUPPORTED_CURRENCIES.map((option) => <option key={option.code} value={option.code}>{option.code} — {option.label}</option>)}</select><small>Only expenses in this currency count toward this budget.</small></div>
        <div className="form-group">
          <label htmlFor="budget-carryover">Carryover <span className="field-optional">optional</span></label>
          <input id="budget-carryover" type="number" min="0" step="0.01" value={carryover} onChange={(event) => setCarryover(event.target.value)} placeholder="0.00" />
        </div>

        <div className="form-group">
          <label htmlFor="budget-amount">Monthly Budget</label>
          <input
            id="budget-amount"
            ref={amountRef}
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
            {submitting ? 'Saving…' : `${editingCategoryId ? 'Update' : 'Save'} budget`}
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
            <h3 className="card-title">Budget progress</h3>
            <p className="card-subtitle">Track how each category is pacing against your budget for {formatMonthLabel(monthKey)}.</p>
          </div>
        </div>

        <div className="budget-coverage-list">
          {!categoryBudgets.some((entry) => entry.hasBudget) && (
            <div className="card-subtitle">No budgets set for this month. Choose a category and a limit above to get started.</div>
          )}

          {categoryBudgets.filter((entry) => entry.hasBudget).map((entry) => {
            const progressWidth = entry.hasBudget ? `${Math.min(entry.utilization, 100)}%` : '0%'

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
                      Budget {entry.hasBudget ? formatCurrency(entry.amount, entry.currency) : 'not set'}{entry.carryover > 0 ? ` + ${formatCurrency(entry.carryover, entry.currency)} carryover` : ''} | Spent {formatCurrency(entry.spent, entry.currency)}
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
                        onClick={async () => {
                          if (!await confirm({ title: 'Remove budget?', description: 'Your transactions and category will stay saved.', confirmText: 'Remove budget' })) return
                          try { await onDeleteBudget(entry.budgetId) } catch (err) { setError(err.message || 'Could not remove this budget.') }
                        }}
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
                      ? `${entry.remaining >= 0 ? 'Remaining' : 'Over by'} ${formatCurrency(Math.abs(entry.remaining), entry.currency)}${entry.dailyAllowance != null ? ` | ${formatCurrency(entry.dailyAllowance, entry.currency)} per day` : ''}`
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
