import { useState, useEffect } from 'react'
import './Form.css'

function ExpenseForm({ onAddExpense, editingExpense, onUpdateExpense, onCancelEdit }) {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

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
    }
  }, [editingExpense])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (description && category && amount) {
      if (editingExpense) {
        onUpdateExpense({ ...editingExpense, description, category, amount: parseFloat(amount), date })
      } else {
        onAddExpense({ description, category, amount: parseFloat(amount), date })
        setDescription('')
        setCategory('')
        setAmount('')
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
        <input
          id="expense-category"
          type="text"
          placeholder="e.g., Food, Housing, Transportation"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="expense-amount">Amount ($)</label>
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
      <div className="form-buttons">
        <button type="submit">{editingExpense ? 'Update' : 'Add'} Expense</button>
        {editingExpense && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default ExpenseForm