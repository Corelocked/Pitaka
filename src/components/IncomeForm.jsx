import { useState, useEffect } from 'react'
import './Form.css'

function IncomeForm({ onAddIncome, editingIncome, onUpdateIncome, onCancelEdit }) {
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [message, setMessage] = useState('')

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
      try {
        if (editingIncome) {
          onUpdateIncome({ ...editingIncome, source, amount: parseFloat(amount), date })
          setMessage('Income updated successfully!')
        } else {
          onAddIncome({ source, amount: parseFloat(amount), date })
          setMessage('Income added successfully!')
          setSource('')
          setAmount('')
        }
        setTimeout(() => setMessage(''), 3000)
      } catch (error) {
        console.error('Error submitting form:', error)
        setMessage('Error: ' + error.message)
        setTimeout(() => setMessage(''), 5000)
      }
    } else {
      setMessage('Please fill in all required fields')
      setTimeout(() => setMessage(''), 3000)
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
        <label htmlFor="income-amount">Amount (₱)</label>
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
        />
      </div>
      {message && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '16px',
          backgroundColor: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: message.includes('Error') ? '#ef4444' : '#10b981',
          border: '1px solid ' + (message.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)')
        }}>
          {message}
        </div>
      )}
      <div className="form-buttons">
        <button type="submit">{editingIncome ? 'Update' : 'Add'} Income</button>
        {editingIncome && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default IncomeForm