import { useState, useEffect } from 'react'
import './Form.css'
import { DEFAULT_CURRENCY, formatCurrency, getWalletCurrency } from '../utils/currency'
import { getLocalDateInputValue } from '../utils/date'
import { suggestCategory } from '../utils/categoryRules'
import { splitExpenseAmount } from '../utils/transactions'

function ExpenseForm({ onAddExpense, editingExpense, onUpdateExpense, onCancelEdit, categories = [], wallets = [] }) {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(getLocalDateInputValue())
  const [walletId, setWalletId] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [splitCategory, setSplitCategory] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedWallet = wallets.find((wallet) => wallet.id === walletId)
  const activeCurrency = selectedWallet ? getWalletCurrency(selectedWallet) : (editingExpense?.currency || DEFAULT_CURRENCY)

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description || '')
      setCategory(editingExpense.category || '')
      setAmount(String(editingExpense.amount ?? ''))
      setDate(editingExpense.date)
      setWalletId(editingExpense.walletId || '')
      setNotes(editingExpense.notes || '')
      setTags((editingExpense.tags || []).join(', '))
    }
  }, [editingExpense])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    setError('')
    if (!description.trim() || !category || !date || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a description, category, date, and an amount greater than zero.')
      return
    }
    setSaving(true)
    try {
      if (editingExpense) {
        await onUpdateExpense({ ...editingExpense, description: description.trim(), category, amount: parseFloat(amount), date, walletId: walletId || null, currency: activeCurrency, notes: notes.trim(), tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) })
      } else {
        const total = parseFloat(amount)
        const amounts = splitCategory ? splitExpenseAmount(total, splitAmount) : null
        const base = { description: description.trim(), date, walletId: walletId || null, currency: activeCurrency, notes: notes.trim(), tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) }
        await onAddExpense(amounts
          ? [{ ...base, category, amount: amounts[0] }, { ...base, description: `${description.trim()} (split)`, category: splitCategory, amount: amounts[1] }]
          : { ...base, category, amount: total })
        setDescription('')
        setCategory('')
        setAmount('')
        setWalletId('')
        setNotes('')
        setTags('')
        setSplitCategory('')
        setSplitAmount('')
      }
    } catch (err) {
      setError(err.message || 'Could not save this expense. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDescription('')
    setCategory('')
    setAmount('')
    setDate(getLocalDateInputValue())
    setNotes('')
    setTags('')
    onCancelEdit()
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-group">
        <label htmlFor="expense-description">Description</label>
        <input
          id="expense-description"
          type="text"
          placeholder="e.g., Groceries, Rent, Utilities"
          value={description}
          onChange={(e) => {
            const nextDescription = e.target.value
            setDescription(nextDescription)
            if (!category) {
              const suggestion = suggestCategory(nextDescription, categories)
              if (suggestion) setCategory(suggestion)
            }
          }}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="expense-category">Category</label>
        <select
          id="expense-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select a category</option>
          <option value="Uncategorized">Uncategorized</option>
          {categories && categories.length > 0 ? categories.map(cat => (
            cat.name !== 'Uncategorized' && <option key={cat.id} value={cat.name}>{cat.name}</option>
          )) : (
            <option value="" disabled>No categories available</option>
          )}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="expense-amount">Amount ({activeCurrency})</label>
        <input
          id="expense-amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0.01"
          inputMode="decimal"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="expense-date">Date</label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="expense-wallet">Account <span className="field-optional">optional</span></label>
        <select id="expense-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
          <option value="">No account · record only</option>
          {wallets && wallets.length > 0 ? wallets.map(w => {
            const bal = (w.balance !== undefined && w.balance !== null) ? w.balance : w.startingBalance
            return <option key={w.id} value={w.id}>{w.name}{(bal !== undefined && bal !== null) ? ` (${formatCurrency(bal, getWalletCurrency(w))})` : ''}</option>
          }) : (
            <option value="" disabled>No accounts available</option>
          )}
        </select>
      </div>

      <details className="form-disclosure" open={Boolean(editingExpense?.notes || editingExpense?.tags?.length)}>
      <summary>Notes, tags{!editingExpense && ' & split'}</summary>
      <div className="form-disclosure-content">
      <div className="form-group">
        <label htmlFor="expense-tags">Tags</label>
        <input id="expense-tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="work, reimbursable" />
      </div>

      <div className="form-group">
        <label htmlFor="expense-notes">Notes</label>
        <textarea id="expense-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" />
      </div>

      {!editingExpense && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expense-split-category">Split category</label>
            <select id="expense-split-category" value={splitCategory} onChange={(e) => setSplitCategory(e.target.value)}>
              <option value="">No split</option>
              {categories.filter((item) => item.name !== category).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="expense-split-amount">Split amount</label>
            <input id="expense-split-amount" type="number" inputMode="decimal" min="0" max={amount || undefined} step="0.01" value={splitAmount} onChange={(e) => setSplitAmount(e.target.value)} disabled={!splitCategory} aria-describedby="split-help" />
          </div>
        </div>
      )}
      {!editingExpense && <p className="form-hint" id="split-help">A split moves part of this amount to a second category. Your total stays the same.</p>}
      </div>
      </details>

      <div className="form-buttons">
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingExpense ? 'Save expense' : 'Add expense'}</button>
        {editingExpense && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default ExpenseForm
