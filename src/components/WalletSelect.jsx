import React from 'react'
import './Form.css'

export default function WalletSelect({ wallets = [], value, onChange, allowNone = true }) {
  return (
    <div className="form-group">
      <label htmlFor="wallet-select">Wallet</label>
      <select id="wallet-select" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}>
        <option value="">{allowNone ? '-- None --' : 'Select a wallet'}</option>
        {wallets && wallets.length > 0 ? wallets.map(w => {
          const bal = (w.balance !== undefined && w.balance !== null) ? w.balance : w.startingBalance
          return <option key={w.id} value={w.id}>{w.name}{(bal !== undefined && bal !== null) ? ` (${Number(bal).toFixed(2)})` : ''}</option>
        }) : (
          <option value="" disabled>No wallets available</option>
        )}
      </select>
    </div>
  )
}