import { useState, useEffect } from 'react'
import { TransferIcon } from './Icons'
import './Form.css'
import { formatCurrency, getWalletCurrency } from '../utils/currency'
import { getLocalDateInputValue } from '../utils/date'

function TransferForm({ onAddTransfer, wallets }) {
  const [fromWalletId, setFromWalletId] = useState('')
  const [toWalletId, setToWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(getLocalDateInputValue())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fromWallet = wallets.find((wallet) => wallet.id === fromWalletId)
  const toWallet = wallets.find((wallet) => wallet.id === toWalletId)
  const transferCurrency = fromWallet ? getWalletCurrency(fromWallet) : null

  // Reset form when wallets change
  useEffect(() => {
    if (wallets && wallets.length >= 2 && !fromWalletId) {
      setFromWalletId(wallets[0].id)
      if (wallets.length > 1) {
        setToWalletId(wallets[1].id)
      }
    }
  }, [wallets, fromWalletId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    setError('')

    if (!fromWalletId || !toWalletId) {
      setError('Please select both source and destination accounts')
      return
    }

    if (fromWalletId === toWalletId) {
      setError('Source and destination accounts must be different')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (fromWallet && toWallet && getWalletCurrency(fromWallet) !== getWalletCurrency(toWallet)) {
      setError('Cross-currency transfers are not supported yet. Please use accounts with the same currency.')
      return
    }

    setSaving(true)
    try {
      await onAddTransfer({
        fromWalletId,
        toWalletId,
        amount: parseFloat(amount),
        currency: transferCurrency,
        date,
        notes
      })

      // Reset form
      setAmount('')
      setNotes('')
      setDate(getLocalDateInputValue())
    } catch (err) {
      console.error('Transfer error:', err)
      setError(err.message || 'Failed to add transfer')
    } finally {
      setSaving(false)
    }
  }

  if (!wallets || wallets.length < 2) {
    return (
      <div className="form-container">
        <h3>Transfer Money</h3>
        <div className="empty-state">
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            You need two accounts to make a transfer.
          </p>
        </div>
      </div>
    )
  }

  const availableToWallets = wallets.filter(w => w.id !== fromWalletId)

  return (
    <div className="form-container">
      <h3 className="card-title"><TransferIcon size={18} /> Transfer Money</h3>
      <form onSubmit={handleSubmit} className="form">
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-group">
          <label className="form-label" htmlFor="transfer-field-1">From account</label>
          <select id="transfer-field-1"
            value={fromWalletId}
            onChange={(e) => {
              setFromWalletId(e.target.value)
              // If current toWallet is same as new fromWallet, reset toWallet
              if (e.target.value === toWalletId) {
                const available = wallets.filter(w => w.id !== e.target.value)
                if (available.length > 0) {
                  setToWalletId(available[0].id)
                }
              }
            }}
            className="form-input"
            required
          >
            {wallets.map(wallet => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} ({formatCurrency(wallet.balance || 0, getWalletCurrency(wallet))})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="transfer-field-2">To account</label>
          <select id="transfer-field-2"
            value={toWalletId}
            onChange={(e) => setToWalletId(e.target.value)}
            className="form-input"
            required
          >
            {availableToWallets.map(wallet => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} ({formatCurrency(wallet.balance || 0, getWalletCurrency(wallet))})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="transfer-field-3">Amount{transferCurrency ? ` (${transferCurrency})` : ''}</label>
          <input id="transfer-field-3"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="form-input"
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="transfer-field-4">Date</label>
          <input id="transfer-field-4"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="transfer-field-5">Notes (Optional)</label>
          <textarea id="transfer-field-5"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input"
            placeholder="Add a note about this transfer..."
            rows="2"
            style={{ resize: 'vertical', minHeight: '60px' }}
          />
        </div>

        <button type="submit" className="btn-submit" disabled={saving}>
          {saving ? 'Saving…' : `Transfer ${transferCurrency ? formatCurrency(amount || 0, transferCurrency) : amount || '0.00'}`}
        </button>
      </form>
    </div>
  )
}

export default TransferForm
