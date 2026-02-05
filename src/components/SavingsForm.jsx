import { useState, useEffect } from 'react'
import './Form.css'

function SavingsForm({ onAddSavings, editingSavings, onUpdateSavings, onCancelEdit }) {
  const [goal, setGoal] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')

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
          targetDate
        })
      } else {
        onAddSavings({
          goal,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate
        })
        setGoal('')
        setTargetAmount('')
        setCurrentAmount('')
        setTargetDate('')
      }
    }
  }

  const handleCancel = () => {
    setGoal('')
    setTargetAmount('')
    setCurrentAmount('')
    setTargetDate('')
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
        <label htmlFor="savings-target">Target Amount (₱)</label>
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
        <label htmlFor="savings-current">Current Amount (₱)</label>
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