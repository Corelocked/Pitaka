import React from 'react'
import './Form.css'

export default function WalletSelect({ wallets = [], value, onChange, allowNone = true }) {
  return (
    <div className="form-group">
      <label htmlFor="wallet-select">Wallet</label>
      <select id="wallet-select" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}>
        <option value="">{allowNone ? '-- None --' : 'Select a wallet'}</option>
        {wallets && wallets.length > 0 ? wallets.map(w => (
          <option key={w.id} value={w.id}>{w.name}{w.startingBalance ? ` (${Number(w.startingBalance).toFixed(2)})` : ''}</option>
        )) : (
          <option value="" disabled>No wallets available</option>
        )}
      </select>
    </div>
  )
}