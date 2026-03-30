import { useEffect, useMemo, useState } from 'react'
import './Form.css'
import { DEFAULT_CURRENCY, formatCurrency, getWalletCurrency } from '../utils/currency'
import { getLocalDateInputValue } from '../utils/date'

const INTERVAL_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' }
]

export default function SubscriptionForm({
  onAddSubscription,
  onUpdateSubscription,
  onCancelEdit,
  editingSubscription,
  wallets = []
}) {
  const [name, setName] = useState('')
  const [walletId, setWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(getLocalDateInputValue())
  const [intervalType, setIntervalType] = useState('monthly')
  const [customIntervalDays, setCustomIntervalDays] = useState('30')

  useEffect(() => {
    if (editingSubscription) {
      setName(editingSubscription.name || '')
      setWalletId(editingSubscription.walletId || '')
      setAmount(String(editingSubscription.amount ?? ''))
      setStartDate(editingSubscription.startDate || getLocalDateInputValue())
      setIntervalType(editingSubscription.intervalType || 'monthly')
      setCustomIntervalDays(String(editingSubscription.customIntervalDays || 30))
      return
    }

    setName('')
    setWalletId('')
    setAmount('')
    setStartDate(getLocalDateInputValue())
    setIntervalType('monthly')
    setCustomIntervalDays('30')
  }, [editingSubscription])

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === walletId),
    [walletId, wallets]
  )

  const activeCurrency = selectedWallet ? getWalletCurrency(selectedWallet) : (editingSubscription?.currency || DEFAULT_CURRENCY)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!name.trim() || !walletId || !amount || !startDate) {
      return
    }

    const payload = {
      name: name.trim(),
      walletId,
      amount: parseFloat(amount),
      startDate,
      intervalType,
      customIntervalDays: intervalType === 'custom' ? parseInt(customIntervalDays, 10) : null,
      category: 'Subscription',
      currency: activeCurrency,
      isActive: true
    }

    try {
      if (editingSubscription) {
        await onUpdateSubscription({ ...editingSubscription, ...payload })
      } else {
        await onAddSubscription(payload)
      }
    } catch (err) {
      console.error('SubscriptionForm submit error:', err)
      try { alert(err?.message || 'Failed to save subscription') } catch { /* ignore */ }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label htmlFor="subscription-name">Subscription Name</label>
        <input
          id="subscription-name"
          type="text"
          placeholder="e.g., Spotify, Netflix, iCloud"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="subscription-wallet">Wallet</label>
        <select
          id="subscription-wallet"
          value={walletId}
          onChange={(event) => setWalletId(event.target.value)}
          required
        >
          <option value="">Select a wallet</option>
          {wallets.map((wallet) => {
            const balance = wallet.balance ?? wallet.startingBalance
            return (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}{balance !== undefined && balance !== null ? ` (${formatCurrency(balance, getWalletCurrency(wallet))})` : ''}
              </option>
            )
          })}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="subscription-amount">Amount ({activeCurrency})</label>
        <input
          id="subscription-amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          step="0.01"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="subscription-date">First Charge Date</label>
        <input
          id="subscription-date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="subscription-interval">Interval</label>
        <select
          id="subscription-interval"
          value={intervalType}
          onChange={(event) => setIntervalType(event.target.value)}
          required
        >
          {INTERVAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {intervalType === 'custom' && (
        <div className="form-group">
          <label htmlFor="subscription-custom-days">Custom Interval (Days)</label>
          <input
            id="subscription-custom-days"
            type="number"
            min="1"
            step="1"
            value={customIntervalDays}
            onChange={(event) => setCustomIntervalDays(event.target.value)}
            required
          />
        </div>
      )}

      <div className="form-group">
        <label>Category</label>
        <input type="text" value="Subscription" disabled readOnly />
      </div>

      <div className="form-buttons">
        <button type="submit">{editingSubscription ? 'Update' : 'Add'} Subscription</button>
        {editingSubscription && <button type="button" onClick={onCancelEdit}>Cancel</button>}
      </div>
    </form>
  )
}
