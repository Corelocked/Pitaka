import { useConfirm } from '../contexts/useConfirm'
import { ActivityIcon, ChartIcon, EditIcon, TrendUpIcon, TrashIcon, WalletIcon } from './Icons'
import { DEFAULT_CURRENCY, formatCurrency, formatCurrencySummary, getCurrencyCode, summarizeByCurrency } from '../utils/currency'
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

  const getInvestmentCurrency = (investment) => investment.currency || DEFAULT_CURRENCY

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
  const totalValueSummary = summarizeByCurrency(
    investments,
    (investment) => calculateMetrics(investment).current,
    (investment) => getInvestmentCurrency(investment)
  )

  const totalCostSummary = summarizeByCurrency(
    investments,
    (investment) => calculateMetrics(investment).cost,
    (investment) => getInvestmentCurrency(investment)
  )

  const totalGainLossSummary = summarizeByCurrency(
    investments,
    (investment) => calculateMetrics(investment).gainLoss,
    (investment) => getInvestmentCurrency(investment)
  )

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
          {formatCurrencySummary(totalValueSummary)}
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.875rem' }}>
          <div>
            <div style={{ opacity: 0.8 }}>Cost Basis</div>
            <div style={{ fontWeight: 600, marginTop: '4px' }}>{formatCurrencySummary(totalCostSummary)}</div>
          </div>
          <div>
            <div style={{ opacity: 0.8 }}>Gain/Loss</div>
            <div style={{ fontWeight: 700, marginTop: '4px' }}>
              {totalGainLossSummary.map(({ currency, total }) => (
                <div key={currency}>
                  {total >= 0 ? '+' : ''}{formatCurrency(total, currency)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Investments List */}
      <div className="transaction-list">
        {investments.map((investment) => {
          const metrics = calculateMetrics(investment)
          const currency = getInvestmentCurrency(investment)

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
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)'
                    }}>
                      {investment.ticker}
                    </span>
                  )}
                </div>
                <div className="transaction-subtitle">
                  {getInvestmentTypeLabel(investment.investmentType)} • {investment.quantity} units @ {formatCurrency(parseFloat(investment.currentValue || investment.purchasePrice), currency)} {getCurrencyCode(currency)}
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                  <span style={{ color: metrics.gainLoss >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 600 }}>
                    {metrics.gainLoss >= 0 ? '+' : ''}{formatCurrency(metrics.gainLoss, currency)} ({metrics.gainLossPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatCurrency(metrics.current, currency)}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(investment)
                    }}
                    className="icon-btn"
                    style={{
                      background: 'rgba(31, 106, 57, 0.14)',
                      color: 'var(--success-color)',
                      border: '1px solid rgba(31, 106, 57, 0.18)',
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
                      background: 'rgba(215, 131, 120, 0.12)',
                      color: 'var(--danger-color)',
                      border: '1px solid rgba(215, 131, 120, 0.16)',
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
