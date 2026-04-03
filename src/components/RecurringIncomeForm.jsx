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

export default function RecurringIncomeForm({
  onAddRecurringIncome,
  onUpdateRecurringIncome,
  onCancelEdit,
  editingRecurringIncome,
  wallets = []
}) {
  const [source, setSource] = useState('')
  const [walletId, setWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(getLocalDateInputValue())
  const [intervalType, setIntervalType] = useState('monthly')
  const [customIntervalDays, setCustomIntervalDays] = useState('30')

  useEffect(() => {
    if (editingRecurringIncome) {
      setSource(editingRecurringIncome.source || '')
      setWalletId(editingRecurringIncome.walletId || '')
      setAmount(String(editingRecurringIncome.amount ?? ''))
      setStartDate(editingRecurringIncome.startDate || getLocalDateInputValue())
      setIntervalType(editingRecurringIncome.intervalType || 'monthly')
      setCustomIntervalDays(String(editingRecurringIncome.customIntervalDays || 30))
      return
    }

    setSource('')
    setWalletId('')
    setAmount('')
    setStartDate(getLocalDateInputValue())
    setIntervalType('monthly')
    setCustomIntervalDays('30')
  }, [editingRecurringIncome])

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === walletId),
    [walletId, wallets]
  )

  const activeCurrency = selectedWallet ? getWalletCurrency(selectedWallet) : (editingRecurringIncome?.currency || DEFAULT_CURRENCY)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!source.trim() || !amount || !startDate) {
      return
    }

    const payload = {
      source: source.trim(),
      walletId: walletId || null,
      amount: parseFloat(amount),
      startDate,
      intervalType,
      customIntervalDays: intervalType === 'custom' ? parseInt(customIntervalDays, 10) : null,
      currency: activeCurrency,
      isActive: true
    }

    if (editingRecurringIncome) {
      await onUpdateRecurringIncome({ ...editingRecurringIncome, ...payload })
    } else {
      await onAddRecurringIncome(payload)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label htmlFor="recurring-income-source">Income Source</label>
        <input
          id="recurring-income-source"
          type="text"
          placeholder="e.g., Monthly Salary, Allowance, Retainer"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="recurring-income-wallet">Wallet</label>
        <select
          id="recurring-income-wallet"
          value={walletId}
          onChange={(event) => setWalletId(event.target.value)}
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
        <label htmlFor="recurring-income-amount">Amount ({activeCurrency})</label>
        <input
          id="recurring-income-amount"
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
        <label htmlFor="recurring-income-date">First Payout Date</label>
        <input
          id="recurring-income-date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="recurring-income-interval">Interval</label>
        <select
          id="recurring-income-interval"
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
          <label htmlFor="recurring-income-custom-days">Custom Interval (Days)</label>
          <input
            id="recurring-income-custom-days"
            type="number"
            min="1"
            step="1"
            value={customIntervalDays}
            onChange={(event) => setCustomIntervalDays(event.target.value)}
            required
          />
        </div>
      )}

      <div className="form-buttons">
        <button type="submit">{editingRecurringIncome ? 'Update' : 'Add'} Recurring Income</button>
        {editingRecurringIncome ? <button type="button" onClick={onCancelEdit}>Cancel</button> : null}
      </div>
    </form>
  )
}
