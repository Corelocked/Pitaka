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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!source || !amount) {
      setMessage('Please fill in all required fields')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      if (editingIncome) {
        onUpdateIncome({ ...editingIncome, source, amount: parseFloat(amount), date, walletId: walletId || null, currency: activeCurrency })
        setMessage('Income updated successfully!')
      } else {
        onAddIncome({ source, amount: parseFloat(amount), date, walletId: walletId || null, currency: activeCurrency })
        setMessage('Income added successfully!')
        setSource('')
        setAmount('')
        setWalletId('')
      }
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error submitting form:', err)
      setMessage('Error: ' + (err?.message || 'Failed'))
      setTimeout(() => setMessage(''), 5000)
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
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="income-date">Date</label>
        <input id="income-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="form-group">
        <label htmlFor="income-wallet">Wallet</label>
        <select id="income-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
          <option value="">Select a wallet</option>
          {wallets && wallets.length > 0 ? (
            wallets.map(w => {
              const bal = (w.balance !== undefined && w.balance !== null) ? w.balance : w.startingBalance
              return (
                <option key={w.id} value={w.id}>{w.name}{(bal !== undefined && bal !== null) ? ` (${formatCurrency(bal, getWalletCurrency(w))})` : ''}</option>
              )
            })
          ) : (
            <option value="" disabled>No wallets available</option>
          )}
        </select>
      </div>

      {message && (
        <div style={{ padding: '8px 12px', borderRadius: 4, fontSize: 14, fontWeight: 500, marginBottom: 16, backgroundColor: message.includes('Error') ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', color: message.includes('Error') ? '#ef4444' : '#10b981', border: '1px solid ' + (message.includes('Error') ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.14)') }}>{message}</div>
      )}

      <div className="form-buttons">
        <button type="submit">{editingIncome ? 'Update' : 'Add'} Income</button>
        {editingIncome && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default IncomeForm
