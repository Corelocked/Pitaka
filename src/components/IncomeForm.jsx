import { useState, useEffect } from 'react'
import './Form.css'
import { DEFAULT_CURRENCY, formatCurrency, getWalletCurrency } from '../utils/currency'
import { getLocalDateInputValue } from '../utils/date'

function IncomeForm({ onAddIncome, editingIncome, onUpdateIncome, onCancelEdit, wallets = [] }) {
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(getLocalDateInputValue())
  const [walletId, setWalletId] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedWallet = wallets.find((wallet) => wallet.id === walletId)
  const activeCurrency = selectedWallet ? getWalletCurrency(selectedWallet) : (editingIncome?.currency || DEFAULT_CURRENCY)

  useEffect(() => {
    if (editingIncome) {
      setSource(editingIncome.source || '')
      setAmount((editingIncome.amount != null) ? String(editingIncome.amount) : '')
      setDate(editingIncome.date || getLocalDateInputValue())
      setWalletId(editingIncome.walletId || '')
    }
  }, [editingIncome])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!source.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !date) {
      setMessage('Enter a source, a date, and an amount greater than zero.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      if (editingIncome) {
        await onUpdateIncome({ ...editingIncome, source: source.trim(), amount: parseFloat(amount), date, walletId: walletId || null, currency: activeCurrency })
        setMessage('Income updated successfully!')
      } else {
        await onAddIncome({ source: source.trim(), amount: parseFloat(amount), date, walletId: walletId || null, currency: activeCurrency })
        setMessage('Income added successfully!')
        setSource('')
        setAmount('')
        setWalletId('')
      }
    } catch (err) {
      console.error('Error submitting form:', err)
      setMessage('Error: ' + (err?.message || 'Failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setSource('')
    setAmount('')
    setDate(getLocalDateInputValue())
    setWalletId('')
    if (typeof onCancelEdit === 'function') onCancelEdit()
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
        <label htmlFor="income-amount">Amount ({activeCurrency})</label>
        <input
          id="income-amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0.01"
          inputMode="decimal"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="income-date">Date</label>
        <input id="income-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="form-group">
        <label htmlFor="income-wallet">Account <span className="field-optional">optional</span></label>
        <select id="income-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
          <option value="">No account · record only</option>
          {wallets && wallets.length > 0 ? (
            wallets.map(w => {
              const bal = (w.balance !== undefined && w.balance !== null) ? w.balance : w.startingBalance
              return (
                <option key={w.id} value={w.id}>{w.name}{(bal !== undefined && bal !== null) ? ` (${formatCurrency(bal, getWalletCurrency(w))})` : ''}</option>
              )
            })
          ) : (
            <option value="" disabled>No accounts available</option>
          )}
        </select>
      </div>

      {message && (
        <p className="form-error" role="status">{message}</p>
      )}

      <div className="form-buttons">
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingIncome ? 'Save income' : 'Add income'}</button>
        {editingIncome && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default IncomeForm
