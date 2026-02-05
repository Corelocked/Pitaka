import { useState, useEffect } from 'react'
import './Form.css'

function AddToSavingsForm({ savings, onAddToSavings }) {
  const [selectedId, setSelectedId] = useState(savings?.[0]?.id || '')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    // Ensure a valid selectedId is chosen when `savings` loads or changes
    if (savings && savings.length > 0) {
      const exists = selectedId && savings.some(s => s.id === selectedId)
      if (!exists) setSelectedId(savings[0].id)
    } else {
      if (selectedId) setSelectedId('')
    }
  }, [savings, selectedId])

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
        <select id="select-saving" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {savings.map(s => (
            <option key={s.id} value={s.id}>{s.goal} — ₱{parseFloat(s.currentAmount).toFixed(2)}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="add-amount">Amount to Add (₱)</label>
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
