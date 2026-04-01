import { useEffect, useState } from 'react'
import './Form.css'
import { DEFAULT_CURRENCY, formatCurrency, getWalletCurrency } from '../utils/currency'
import { getLocalDateInputValue } from '../utils/date'

function AddToSavingsForm({ savings, wallets = [], onAddToSavings, initialSelectedId = '' }) {
  const [manualSelectedId, setManualSelectedId] = useState('')
  const [fromWalletId, setFromWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(getLocalDateInputValue())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const selectedId = (
    manualSelectedId && savings.some((s) => s.id === manualSelectedId)
      ? manualSelectedId
      : initialSelectedId && savings.some((s) => s.id === initialSelectedId)
        ? initialSelectedId
        : savings?.[0]?.id || ''
  )
  const selectedGoal = savings.find((entry) => entry.id === selectedId)
  const activeCurrency = selectedGoal?.currency || DEFAULT_CURRENCY
  const eligibleWallets = wallets.filter((wallet) => getWalletCurrency(wallet) === activeCurrency)
  const selectedWallet = eligibleWallets.find((wallet) => wallet.id === fromWalletId) || eligibleWallets[0]

  useEffect(() => {
    if (!selectedWallet && eligibleWallets.length > 0) {
      setFromWalletId(eligibleWallets[0].id)
      return
    }

    if (selectedWallet && !eligibleWallets.some((wallet) => wallet.id === selectedWallet.id)) {
      setFromWalletId(eligibleWallets[0]?.id || '')
    }
  }, [eligibleWallets, selectedWallet])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const value = parseFloat(amount)

    if (!selectedId) {
      setError('Please choose a savings goal')
      return
    }

    if (!selectedWallet) {
      setError(`Add or choose an account in ${activeCurrency} to fund this goal`)
      return
    }

    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (selectedWallet.accountType !== 'credit' && parseFloat(selectedWallet.balance || 0) < value) {
      setError('The selected account does not have enough available funds')
      return
    }

    try {
      await onAddToSavings(selectedId, value, {
        fromWalletId: selectedWallet.id,
        date,
        notes
      })
      setAmount('')
      setNotes('')
      setDate(getLocalDateInputValue())
    } catch (err) {
      setError(err.message || 'Failed to move funds to this goal')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form add-to-savings-form">
      {error && (
        <div style={{
          padding: '12px',
          background: '#fecaca',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

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

      <div className="form-group">
        <label htmlFor="funding-wallet">From Account</label>
        <select
          id="funding-wallet"
          value={selectedWallet?.id || ''}
          onChange={(e) => setFromWalletId(e.target.value)}
          disabled={eligibleWallets.length === 0}
        >
          {eligibleWallets.length > 0 ? (
            eligibleWallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} - {formatCurrency(wallet.balance || 0, getWalletCurrency(wallet))}
              </option>
            ))
          ) : (
            <option value="">No matching accounts available</option>
          )}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="funding-date">Date</label>
        <input
          id="funding-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="funding-notes">Notes (Optional)</label>
        <textarea
          id="funding-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note about this goal transfer..."
          rows="2"
          style={{ resize: 'vertical', minHeight: '60px' }}
        />
      </div>

      <div className="form-buttons">
        <button type="submit" disabled={!selectedWallet}>Transfer to Goal</button>
      </div>
    </form>
  )
}

export default AddToSavingsForm
