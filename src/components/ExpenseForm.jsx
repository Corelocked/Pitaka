import { useState, useEffect } from 'react'
import './Form.css'

function ExpenseForm({ onAddExpense, editingExpense, onUpdateExpense, onCancelEdit, categories = [], wallets = [] }) {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [walletId, setWalletId] = useState('')

  useEffect(() => {
    if (editingExpense) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription(editingExpense.description)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategory(editingExpense.category)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(editingExpense.amount.toString())
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(editingExpense.date)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWalletId(editingExpense.walletId || '')
    }
  }, [editingExpense])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (description && category && amount) {
      if (editingExpense) {
        onUpdateExpense({ ...editingExpense, description, category, amount: parseFloat(amount), date, walletId: walletId || null })
      } else {
        onAddExpense({ description, category, amount: parseFloat(amount), date, walletId: walletId || null })
        setDescription('')
        setCategory('')
        setAmount('')
        setWalletId('')
      }
    }
  }

  const handleCancel = () => {
    setDescription('')
    setCategory('')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
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
          onChange={(e) => setDescription(e.target.value)}
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
        <label htmlFor="expense-amount">Amount (₱)</label>
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
            return <option key={w.id} value={w.id}>{w.name}{(bal !== undefined && bal !== null) ? ` (${Number(bal).toFixed(2)})` : ''}</option>
          }) : (
            <option value="" disabled>No wallets available</option>
          )}
        </select>
      </div>

      <div className="form-buttons">
        <button type="submit">{editingExpense ? 'Update' : 'Add'} Expense</button>
        {editingExpense && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default ExpenseForm