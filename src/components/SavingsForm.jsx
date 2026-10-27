import { useState, useEffect } from 'react'
import './Form.css'
import { DEFAULT_CURRENCY, getAllowedCurrencies, isCurrencyProOnly } from '../utils/currency'
import { useFirebase } from '../hooks/useFirebase'

function SavingsForm({ onAddSavings, editingSavings, onUpdateSavings, onCancelEdit }) {
  const { isPro } = useFirebase()
  const [goal, setGoal] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)

  useEffect(() => {
    if (editingSavings) {
      setGoal(editingSavings.goal)
      setTargetAmount(String(editingSavings.targetAmount ?? ''))
      setCurrentAmount(String(editingSavings.currentAmount ?? 0))
      setTargetDate(editingSavings.targetDate)
      setCurrency(editingSavings.currency || DEFAULT_CURRENCY)
    }
  }, [editingSavings])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!goal.trim() || !Number.isFinite(Number(targetAmount)) || Number(targetAmount) <= 0) { setError('Enter a goal and a target greater than zero.'); return }
    setSaving(true)
    setError('')
    try {
      if (editingSavings) {
        await onUpdateSavings({
          ...editingSavings,
          goal,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate,
          currency
        })
      } else {
        await onAddSavings({
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
    } catch (err) { setError(err.message || 'Could not save your goal. Please try again.') } finally { setSaving(false) }
  }

  const handleCancel = () => {
    setGoal('')
    setTargetAmount('')
    setCurrentAmount('')
    setTargetDate('')
    setCurrency(DEFAULT_CURRENCY)
    onCancelEdit()
  }

  const availableCurrencies = getAllowedCurrencies(isPro, editingSavings?.currency)

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <p className="form-error" role="alert">{error}</p>}
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
          {availableCurrencies.map((option) => (
            <option key={option.code} value={option.code}>
              {option.code} - {option.label}{!isPro && isCurrencyProOnly(option.code) ? ' (Pro locked)' : ''}
            </option>
          ))}
        </select>
        {!isPro && (
          <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
            Basic goals can use `PHP` and `USD`. Pro unlocks the full currency list.
          </small>
        )}
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
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingSavings ? 'Save savings goal' : 'Add savings goal'}</button>
        {editingSavings && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default SavingsForm
