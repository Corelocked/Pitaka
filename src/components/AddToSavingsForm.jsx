import { useState } from 'react'
import './Form.css'
import { DEFAULT_CURRENCY, formatCurrency } from '../utils/currency'

function AddToSavingsForm({ savings, onAddToSavings, initialSelectedId = '' }) {
  const [manualSelectedId, setManualSelectedId] = useState('')
  const [amount, setAmount] = useState('')
  const selectedId = (
    manualSelectedId && savings.some((s) => s.id === manualSelectedId)
      ? manualSelectedId
      : initialSelectedId && savings.some((s) => s.id === initialSelectedId)
        ? initialSelectedId
        : savings?.[0]?.id || ''
  )
  const selectedGoal = savings.find((entry) => entry.id === selectedId)
  const activeCurrency = selectedGoal?.currency || DEFAULT_CURRENCY

  const handleSubmit = (e) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!selectedId || isNaN(value) || value <= 0) return
    onAddToSavings(selectedId, value)
    setAmount('')
  }

  return (
    <form onSubmit={handleSubmit} className="form add-to-savings-form">
      <div className="form-group">
        <label htmlFor="select-saving">Select Saving</label>
        <select id="select-saving" value={selectedId} onChange={(e) => setManualSelectedId(e.target.value)}>
          {savings.map(s => (
            <option key={s.id} value={s.id}>{s.goal} — {formatCurrency(parseFloat(s.currentAmount), s.currency || DEFAULT_CURRENCY)}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="add-amount">Amount to Add ({activeCurrency})</label>
        <input
          id="add-amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="form-buttons">
        <button type="submit">Add to Savings</button>
      </div>
    </form>
  )
}

export default AddToSavingsForm
