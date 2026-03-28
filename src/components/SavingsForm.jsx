import { useState, useEffect } from 'react'
import './Form.css'
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '../utils/currency'

function SavingsForm({ onAddSavings, editingSavings, onUpdateSavings, onCancelEdit }) {
  const [goal, setGoal] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)

  useEffect(() => {
    if (editingSavings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoal(editingSavings.goal)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTargetAmount(editingSavings.targetAmount.toString())
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentAmount(editingSavings.currentAmount.toString())
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTargetDate(editingSavings.targetDate)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrency(editingSavings.currency || DEFAULT_CURRENCY)
    }
  }, [editingSavings])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (goal && targetAmount) {
      if (editingSavings) {
        onUpdateSavings({
          ...editingSavings,
          goal,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate,
          currency
        })
      } else {
        onAddSavings({
          goal,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate,
          currency
        })
        setGoal('')
        setTargetAmount('')
        setCurrentAmount('')
        setTargetDate('')
        setCurrency(DEFAULT_CURRENCY)
      }
    }
  }

  const handleCancel = () => {
    setGoal('')
    setTargetAmount('')
    setCurrentAmount('')
    setTargetDate('')
    setCurrency(DEFAULT_CURRENCY)
    onCancelEdit()
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label htmlFor="savings-goal">Savings Goal</label>
        <input
          id="savings-goal"
          type="text"
          placeholder="e.g., Emergency Fund, Vacation, Car"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="savings-currency">Currency</label>
        <select id="savings-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {SUPPORTED_CURRENCIES.map((option) => (
            <option key={option.code} value={option.code}>
              {option.code} - {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="savings-target">Target Amount ({currency})</label>
        <input
          id="savings-target"
          type="number"
          placeholder="0.00"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          step="0.01"
          min="0"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="savings-current">Current Amount ({currency})</label>
        <input
          id="savings-current"
          type="number"
          placeholder="0.00"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(e.target.value)}
          step="0.01"
          min="0"
        />
      </div>
      <div className="form-group">
        <label htmlFor="savings-date">Target Date</label>
        <input
          id="savings-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>
      <div className="form-buttons">
        <button type="submit">{editingSavings ? 'Update' : 'Add'} Savings Goal</button>
        {editingSavings && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default SavingsForm
