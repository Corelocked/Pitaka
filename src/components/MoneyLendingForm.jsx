import { useState } from 'react'
import './Form.css'

function MoneyLendingForm({ onSubmit, onCancel, wallets = [] }) {
  const [direction, setDirection] = useState('lent') // 'lent' or 'borrowed'
  const [status, setStatus] = useState('pending') // 'pending' or 'settled'
  const [walletId, setWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount) {
      setMessage('Amount is required')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      await onSubmit({
        direction,
        status,
        walletId: walletId || null,
        amount: parseFloat(amount),
        date,
        description
      })
      setMessage('Saved')
      setDirection('lent')
      setStatus('pending')
      setWalletId('')
      setAmount('')
      setDate(new Date().toISOString().split('T')[0])
      setDescription('')
      setTimeout(() => setMessage(''), 1500)
    } catch (err) {
      console.error('Add lending failed', err)
      setMessage('Error: ' + (err?.message || 'Failed'))
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label>Type</label>
        <select value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="lent">Lent</option>
          <option value="borrowed">Borrowed</option>
        </select>
      </div>

      <div className="form-group">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="settled">Settled</option>
        </select>
      </div>

      <div className="form-group">
        <label>Wallet</label>
        <select value={walletId} onChange={(e) => setWalletId(e.target.value)}>
          <option value="">-- none --</option>
          {wallets.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Amount</label>
        <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>

      <div className="form-group">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>

      {message && <div className="form-message">{message}</div>}

      <div className="form-buttons">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

export default MoneyLendingForm
