import React, { useState, useImperativeHandle, forwardRef } from 'react'
import './Form.css'

const WalletForm = forwardRef(function WalletForm({ onSubmit, onCancel, defaultValues = {} }, ref) {
  const [name, setName] = useState(defaultValues.name || '')
  const [description, setDescription] = useState(defaultValues.description || '')
  const [startingBalance, setStartingBalance] = useState(defaultValues.startingBalance || '')
  const [message, setMessage] = useState('')

  useImperativeHandle(ref, () => ({
    submit: () => handleSubmit()
  }))

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!name.trim()) {
      setMessage('Name is required')
      setTimeout(() => setMessage(''), 2500)
      return
    }
    try {
      const id = await onSubmit({ name: name.trim(), description: description.trim(), startingBalance: parseFloat(startingBalance) || 0 })
      console.log('Wallet created, id:', id)
      setMessage('Wallet added')
      setTimeout(() => setMessage(''), 2000)
      setName('')
      setDescription('')
      setStartingBalance('')
      if (onCancel) onCancel()
    } catch (err) {
      setMessage('Error: ' + (err?.message || 'Failed'))
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="wallet-name">Name</label>
        <input id="wallet-name" value={name} onChange={e => setName(e.target.value)} placeholder="Wallet name" />
      </div>
      <div className="form-group">
        <label htmlFor="wallet-desc">Description</label>
        <input id="wallet-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
      </div>
      <div className="form-group">
        <label htmlFor="wallet-start">Starting Balance</label>
        <input id="wallet-start" type="number" step="0.01" value={startingBalance} onChange={e => setStartingBalance(e.target.value)} placeholder="0.00" />
      </div>
      {message && <div style={{ marginTop: 8, color: message.startsWith('Error') ? '#ef4444' : '#10b981' }}>{message}</div>}
      <div className="form-buttons">
        <button type="submit">Add Wallet</button>
      </div>
    </form>
  )
})

export default WalletForm
