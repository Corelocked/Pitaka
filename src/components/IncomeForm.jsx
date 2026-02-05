import { useState, useEffect } from 'react'
import './Form.css'

function IncomeForm({ onAddIncome, editingIncome, onUpdateIncome, onCancelEdit }) {
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (editingIncome) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSource(editingIncome.source)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(editingIncome.amount.toString())
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(editingIncome.date)
    }
  }, [editingIncome])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (source && amount) {
      if (editingIncome) {
        onUpdateIncome({ ...editingIncome, source, amount: parseFloat(amount), date })
      } else {
        onAddIncome({ source, amount: parseFloat(amount), date })
        setSource('')
        setAmount('')
      }
    }
  }

  const handleCancel = () => {
    setSource('')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    onCancelEdit()
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label htmlFor="income-source">Income Source</label>
        <input
          id="income-source"
          type="text"
          placeholder="e.g., Salary, Freelance, Investment"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="income-amount">Amount ($)</label>
        <input
          id="income-amount"
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
        <label htmlFor="income-date">Date</label>
        <input
          id="income-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="form-buttons">
        <button type="submit">{editingIncome ? 'Update' : 'Add'} Income</button>
        {editingIncome && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default IncomeForm