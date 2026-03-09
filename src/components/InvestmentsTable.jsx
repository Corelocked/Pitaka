import { useConfirm } from '../contexts/ConfirmContext'
import { ActivityIcon, ChartIcon, EditIcon, TrendUpIcon, TrashIcon, WalletIcon } from './Icons'
import './Table.css'

function InvestmentsTable({ investments, onEdit, onDelete }) {
  const confirm = useConfirm()

  const handleDelete = async (investment) => {
    const ok = await confirm({
      title: 'Delete Investment',
      description: `Are you sure you want to delete "${investment.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })

    if (ok) {
      onDelete(investment.id)
    }
  }

  const getInvestmentIcon = (type) => {
    const iconSize = 20
    const icons = {
      stock: <TrendUpIcon size={iconSize} />,
      bond: <ChartIcon size={iconSize} />,
      mutual_fund: <WalletIcon size={iconSize} />,
      etf: <ActivityIcon size={iconSize} />,
      crypto: <ActivityIcon size={iconSize} />,
      real_estate: <WalletIcon size={iconSize} />,
      commodity: <ChartIcon size={iconSize} />,
      other: <WalletIcon size={iconSize} />
    }
    return icons[type] || <WalletIcon size={iconSize} />
  }

  const getInvestmentTypeLabel = (type) => {
    const labels = {
      stock: 'Stock',
      bond: 'Bond',
      mutual_fund: 'Mutual Fund',
      etf: 'ETF',
      crypto: 'Cryptocurrency',
      real_estate: 'Real Estate',
      commodity: 'Commodity',
      other: 'Other'
    }
    return labels[type] || 'Investment'
  }

  const calculateMetrics = (investment) => {
    const cost = parseFloat(investment.quantity || 0) * parseFloat(investment.purchasePrice || 0)
    const current = parseFloat(investment.quantity || 0) * (parseFloat(investment.currentValue) || parseFloat(investment.purchasePrice || 0))
    const gainLoss = current - cost
    const gainLossPercent = cost > 0 ? ((gainLoss / cost) * 100) : 0

    return { cost, current, gainLoss, gainLossPercent }
  }

  if (!investments || investments.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-state-icon"><TrendUpIcon size={56} /></div>
          <div className="empty-state-title">No investments yet</div>
          <div className="empty-state-description">
            Start tracking your stocks, bonds, and other investments
          </div>
        </div>
      </div>
    )
  }

  // Calculate total portfolio value
  const totalValue = investments.reduce((sum, inv) => {
    const metrics = calculateMetrics(inv)
    return sum + metrics.current
  }, 0)

  const totalCost = investments.reduce((sum, inv) => {
    const metrics = calculateMetrics(inv)
    return sum + metrics.cost
  }, 0)

  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100) : 0

  return (
    <div className="table-container">
      {/* Portfolio Summary */}
      <div style={{
        background: 'var(--gradient-primary)',
        borderRadius: '16px',
        padding: '20px',
        color: 'white',
        marginBottom: '20px'
      }}>
        <h4 style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>
          Total Portfolio Value
        </h4>
        <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }}>
          ₱{totalValue.toFixed(2)}
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.875rem' }}>
          <div>
            <div style={{ opacity: 0.8 }}>Cost Basis</div>
            <div style={{ fontWeight: 600, marginTop: '4px' }}>₱{totalCost.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ opacity: 0.8 }}>Gain/Loss</div>
            <div style={{ fontWeight: 700, marginTop: '4px' }}>
              {totalGainLoss >= 0 ? '+' : ''}₱{totalGainLoss.toFixed(2)} ({totalGainLossPercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Investments List */}
      <div className="transaction-list">
        {investments.map((investment) => {
          const metrics = calculateMetrics(investment)
          return (
            <div key={investment.id} className="transaction-item" style={{ cursor: 'pointer' }}>
              <div className="transaction-icon" style={{
                background: 'var(--gradient-primary)'
              }}>
                {getInvestmentIcon(investment.investmentType)}
              </div>
              <div className="transaction-details" style={{ flex: 1 }}>
                <div className="transaction-title">
                  {investment.name}
                  {investment.ticker && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      background: '#f1f5f9',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#475569'
                    }}>
                      {investment.ticker}
                    </span>
                  )}
                </div>
                <div className="transaction-subtitle">
                  {getInvestmentTypeLabel(investment.investmentType)} • {investment.quantity} units @ ₱{parseFloat(investment.currentValue || investment.purchasePrice).toFixed(2)}
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                  <span style={{ color: metrics.gainLoss >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {metrics.gainLoss >= 0 ? '+' : ''}₱{metrics.gainLoss.toFixed(2)} ({metrics.gainLossPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
                  ₱{metrics.current.toFixed(2)}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(investment)
                    }}
                    className="icon-btn"
                    style={{
                      background: '#eaf6f4',
                      color: 'var(--primary-700)',
                      width: '36px',
                      height: '36px',
                      fontSize: '16px'
                    }}
                    title="Edit investment"
                  >
                    <EditIcon size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(investment)
                    }}
                    className="icon-btn"
                    style={{
                      background: '#fee',
                      color: '#ef4444',
                      width: '36px',
                      height: '36px',
                      fontSize: '16px'
                    }}
                    title="Delete investment"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InvestmentsTable
