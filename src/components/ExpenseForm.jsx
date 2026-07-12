import { useState, useEffect } from 'react'
/* eslint-disable react-hooks/set-state-in-effect */
import './Form.css'
import { DEFAULT_CURRENCY, formatCurrency, getWalletCurrency } from '../utils/currency'
import { getLocalDateInputValue } from '../utils/date'
import { suggestCategory } from '../utils/categoryRules'

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

  const selectedWallet = wallets.find((wallet) => wallet.id === walletId)
  const activeCurrency = selectedWallet ? getWalletCurrency(selectedWallet) : (editingExpense?.currency || DEFAULT_CURRENCY)

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description)
      setCategory(editingExpense.category)
      setAmount(editingExpense.amount.toString())
      setDate(editingExpense.date)
      setWalletId(editingExpense.walletId || '')
      setNotes(editingExpense.notes || '')
      setTags((editingExpense.tags || []).join(', '))
    }
  }, [editingExpense])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (description && category && amount) {
      if (editingExpense) {
        onUpdateExpense({ ...editingExpense, description, category, amount: parseFloat(amount), date, walletId: walletId || null, currency: activeCurrency, notes: notes.trim(), tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) })
      } else {
        const total = parseFloat(amount)
        const split = parseFloat(splitAmount || 0)
        const base = { description, date, walletId: walletId || null, currency: activeCurrency, notes: notes.trim(), tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) }
        onAddExpense(splitCategory && split > 0 && split < total
          ? [{ ...base, category, amount: total - split }, { ...base, description: `${description} (split)`, category: splitCategory, amount: split }]
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
          {categories && categories.length > 0 ? categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
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
          min="0"
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
        <label htmlFor="expense-wallet">Wallet</label>
        <select id="expense-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
          <option value="">Select a wallet</option>
          {wallets && wallets.length > 0 ? wallets.map(w => {
            const bal = (w.balance !== undefined && w.balance !== null) ? w.balance : w.startingBalance
            return <option key={w.id} value={w.id}>{w.name}{(bal !== undefined && bal !== null) ? ` (${formatCurrency(bal, getWalletCurrency(w))})` : ''}</option>
          }) : (
            <option value="" disabled>No wallets available</option>
          )}
        </select>
      </div>

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
            <label htmlFor="expense-split-category">Split Category</label>
            <select id="expense-split-category" value={splitCategory} onChange={(e) => setSplitCategory(e.target.value)}>
              <option value="">No split</option>
              {categories.filter((item) => item.name !== category).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="expense-split-amount">Split Amount</label>
            <input id="expense-split-amount" type="number" min="0" max={amount || undefined} step="0.01" value={splitAmount} onChange={(e) => setSplitAmount(e.target.value)} disabled={!splitCategory} />
          </div>
        </div>
      )}

      <div className="form-buttons">
        <button type="submit">{editingExpense ? 'Update' : 'Add'} Expense</button>
        {editingExpense && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default ExpenseForm
