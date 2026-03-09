import { useState, useEffect } from 'react'
import { TrendUpIcon } from './Icons'
import './Form.css'

function InvestmentForm({ onAddInvestment, editingInvestment, onUpdateInvestment, onCancelEdit }) {
  const [name, setName] = useState('')
  const [investmentType, setInvestmentType] = useState('stock')
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (editingInvestment) {
      setName(editingInvestment.name || '')
      setInvestmentType(editingInvestment.investmentType || 'stock')
      setTicker(editingInvestment.ticker || '')
      setQuantity(editingInvestment.quantity || '')
      setPurchasePrice(editingInvestment.purchasePrice || '')
      setCurrentValue(editingInvestment.currentValue || '')
      setPurchaseDate(editingInvestment.purchaseDate || new Date().toISOString().split('T')[0])
      setNotes(editingInvestment.notes || '')
    } else {
      // Reset form
      setName('')
      setInvestmentType('stock')
      setTicker('')
      setQuantity('')
      setPurchasePrice('')
      setCurrentValue('')
      setPurchaseDate(new Date().toISOString().split('T')[0])
      setNotes('')
    }
  }, [editingInvestment])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Investment name is required')
      return
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
      setError('Please enter a valid purchase price')
      return
    }

    try {
      const investmentData = {
        name: name.trim(),
        investmentType,
        ticker: ticker.trim().toUpperCase(),
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        currentValue: currentValue ? parseFloat(currentValue) : parseFloat(purchasePrice),
        purchaseDate,
        notes: notes.trim()
      }

      if (editingInvestment) {
        await onUpdateInvestment(editingInvestment.id, investmentData)
      } else {
        await onAddInvestment(investmentData)
        // Reset form after successful add
        setName('')
        setInvestmentType('stock')
        setTicker('')
        setQuantity('')
        setPurchasePrice('')
        setCurrentValue('')
        setPurchaseDate(new Date().toISOString().split('T')[0])
        setNotes('')
      }
    } catch (err) {
      console.error('Investment form error:', err)
      setError(err.message || 'Failed to save investment')
    }
  }

  const investmentTypes = [
    { value: 'stock', label: 'Stock' },
    { value: 'bond', label: 'Bond' },
    { value: 'mutual_fund', label: 'Mutual Fund' },
    { value: 'etf', label: 'ETF' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'commodity', label: 'Commodity' },
    { value: 'other', label: 'Other' }
  ]

  const totalCost = quantity && purchasePrice ? (parseFloat(quantity) * parseFloat(purchasePrice)).toFixed(2) : '0.00'
  const currentTotal = quantity && currentValue ? (parseFloat(quantity) * parseFloat(currentValue)).toFixed(2) : totalCost
  const gainLoss = currentTotal && totalCost ? (parseFloat(currentTotal) - parseFloat(totalCost)).toFixed(2) : '0.00'
  const gainLossPercent = totalCost && parseFloat(totalCost) > 0 ? ((parseFloat(gainLoss) / parseFloat(totalCost)) * 100).toFixed(2) : '0.00'

  return (
    <div className="form-container">
      <h3 className="card-title"><TrendUpIcon size={18} /> {editingInvestment ? 'Edit Investment' : 'Add Investment'}</h3>
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
          <label className="form-label">Investment Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="e.g., Apple Inc., Gold Bars"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Investment Type</label>
          <select
            value={investmentType}
            onChange={(e) => setInvestmentType(e.target.value)}
            className="form-input"
            required
          >
            {investmentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Ticker/Symbol (Optional)</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="form-input"
            placeholder="e.g., AAPL, BTC"
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Quantity/Shares</label>
          <input
            type="number"
            step="0.00000001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="form-input"
            placeholder="0"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Purchase Price (per unit)</label>
          <input
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            className="form-input"
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Current Value (per unit)</label>
          <input
            type="number"
            step="0.01"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            className="form-input"
            placeholder={purchasePrice || '0.00'}
          />
          <small style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
            Leave empty to use purchase price
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Purchase Date</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input"
            placeholder="Add notes about this investment..."
            rows="2"
            style={{ resize: 'vertical', minHeight: '60px' }}
          />
        </div>

        {/* Investment Summary */}
        {(quantity && purchasePrice) && (
          <div style={{
            background: '#f1f5f9',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', color: '#475569' }}>
              Investment Summary
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Cost:</span>
                <span style={{ fontWeight: 600 }}>₱{totalCost}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Current Value:</span>
                <span style={{ fontWeight: 600 }}>₱{currentTotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #cbd5e1' }}>
                <span style={{ color: '#64748b' }}>Gain/Loss:</span>
                <span style={{ fontWeight: 700, color: parseFloat(gainLoss) >= 0 ? '#10b981' : '#ef4444' }}>
                  {parseFloat(gainLoss) >= 0 ? '+' : ''}₱{gainLoss} ({gainLossPercent}%)
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="form-buttons" style={{ display: 'flex', gap: '8px' }}>
          {editingInvestment && onCancelEdit && (
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
            {editingInvestment ? 'Update Investment' : 'Add Investment'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default InvestmentForm
