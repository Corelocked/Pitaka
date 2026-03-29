/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react'
import './Form.css'
import { DEFAULT_CURRENCY, getAllowedCurrencies, isCurrencyProOnly } from '../utils/currency'
import { useFirebase } from '../hooks/useFirebase'

function WalletForm({ onAddWallet, editingWallet, onUpdateWallet, onCancelEdit }) {
  const { isPro } = useFirebase()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [accountType, setAccountType] = useState('cash')
  const [startingBalance, setStartingBalance] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [creditAlertPercent, setCreditAlertPercent] = useState('80')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [error, setError] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (editingWallet) {
      setName(editingWallet.name || '')
      setDescription(editingWallet.description || '')
      setAccountType(editingWallet.accountType || 'cash')
      setStartingBalance(editingWallet.startingBalance || '')
      setCreditLimit(editingWallet.creditLimit || '')
      setCreditAlertPercent(editingWallet.creditAlertPercent || '80')
      setCurrency(editingWallet.currency || DEFAULT_CURRENCY)
    } else {
      // Reset form
      setName('')
      setDescription('')
      setAccountType('cash')
      setStartingBalance('')
      setCreditLimit('')
      setCreditAlertPercent('80')
      setCurrency(DEFAULT_CURRENCY)
    }
  }, [editingWallet])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Account name is required')
      return
    }

    if (accountType === 'credit' && !(parseFloat(creditLimit) > 0)) {
      setError('Credit limit is required for credit cards')
      return
    }

    try {
      const walletData = {
        name: name.trim(),
        description: description.trim(),
        accountType,
        startingBalance: parseFloat(startingBalance) || 0,
        creditLimit: accountType === 'credit' ? (parseFloat(creditLimit) || 0) : null,
        creditAlertPercent: accountType === 'credit' ? (parseFloat(creditAlertPercent) || 80) : null,
        currency
      }

      if (editingWallet) {
        await onUpdateWallet({ id: editingWallet.id, ...walletData })
      } else {
        await onAddWallet(walletData)
        // Reset form after successful add
        setName('')
        setDescription('')
        setAccountType('cash')
        setStartingBalance('')
        setCreditLimit('')
        setCreditAlertPercent('80')
        setCurrency(DEFAULT_CURRENCY)
      }
    } catch (err) {
      console.error('Wallet form error:', err)
      setError(err.message || 'Failed to save account')
    }
  }

  const accountTypes = [
    { value: 'cash', label: 'Cash', color: '#43e97b' },
    { value: 'bank', label: 'Bank Account', color: '#4facfe' },
    { value: 'credit', label: 'Credit Card', color: '#fa709a' },
    { value: 'investment', label: 'Investment Account', color: '#0f766e' },
    { value: 'savings', label: 'Savings Account', color: '#11998e' },
    { value: 'other', label: 'Other', color: '#9ca3af' }
  ]
  const availableCurrencies = getAllowedCurrencies(isPro, editingWallet?.currency)

  return (
    <div className="form-container">
      <h3>{editingWallet ? 'Edit Account' : 'Add Account'}</h3>
      <form onSubmit={handleSubmit} className="form">
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
          <label className="form-label">Account Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="e.g., Main Wallet, Bank of America"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Account Type</label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="form-input"
            required
          >
            {accountTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="form-input"
            required
          >
            {availableCurrencies.map((option) => (
              <option key={option.code} value={option.code}>
                {option.code} - {option.label}{!isPro && isCurrencyProOnly(option.code) ? ' (Pro locked)' : ''}
              </option>
            ))}
          </select>
          {!isPro && (
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
              Basic accounts can use `PHP` and `USD`. Upgrade to Pro to unlock more currencies.
            </small>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">{accountType === 'credit' ? 'Current Card Balance' : 'Starting Balance'}</label>
          <input
            type="number"
            step="0.01"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            className="form-input"
            placeholder="0.00"
          />
          <small style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
            {accountType === 'credit'
              ? `Use a negative number if this card already has an outstanding balance in ${currency}.`
              : `Initial balance in ${currency} when you started tracking this account`}
          </small>
        </div>

        {accountType === 'credit' && (
          <>
            <div className="form-group">
              <label className="form-label">Credit Limit</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="form-input"
                placeholder="50000.00"
                required
              />
              <small style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                This is the maximum spendable amount for the card in {currency}.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Utilization Warning (%)</label>
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                value={creditAlertPercent}
                onChange={(e) => setCreditAlertPercent(e.target.value)}
                className="form-input"
                placeholder="80"
              />
              <small style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                Pitaka will flag the card once spending reaches this percentage of the limit.
              </small>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input"
            placeholder="Add notes about this account..."
            rows="2"
            style={{ resize: 'vertical', minHeight: '60px' }}
          />
        </div>

        <div className="form-buttons" style={{ display: 'flex', gap: '8px' }}>
          {editingWallet && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          )}
          <button type="submit" className="btn-submit" style={{ flex: 1 }}>
            {editingWallet ? 'Update Account' : 'Add Account'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default WalletForm
