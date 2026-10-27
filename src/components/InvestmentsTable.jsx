import { useConfirm } from '../contexts/useConfirm'
import { useState } from 'react'
import {
  ActivityIcon,
  ChartIcon,
  EditIcon,
  TrendUpIcon,
  TrashIcon,
  WalletIcon
} from './Icons'
import {
  DEFAULT_CURRENCY,
  formatCurrency,
  formatCurrencySummary,
  getCurrencyCode,
  summarizeByCurrency
} from '../utils/currency'
import './Table.css'

function InvestmentsTable({ investments, onEdit, onDelete }) {
  const confirm = useConfirm()
  const [error, setError] = useState('')

  const handleDelete = async (investment) => {
    const ok = await confirm({
      title: 'Delete investment',
      description: `Are you sure you want to delete "${investment.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })

    if (ok) {
      setError('')
      try {
        await onDelete(investment.id)
      } catch (err) {
        setError(err.message || 'Could not delete this investment.')
      }
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
    const cost =
      parseFloat(investment.quantity || 0) *
      parseFloat(investment.purchasePrice || 0)
    const current =
      parseFloat(investment.quantity || 0) *
      Number(investment.currentValue ?? investment.purchasePrice ?? 0)
    const gainLoss = current - cost
    const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0

    return { cost, current, gainLoss, gainLossPercent }
  }

  const getInvestmentCurrency = (investment) =>
    investment.currency || DEFAULT_CURRENCY

  if (!investments || investments.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <TrendUpIcon size={56} />
          </div>
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
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="workspace-summary-stats portfolio-totals">
        <div className="workspace-stat">
          <span>Portfolio value</span>
          <strong>{formatCurrencySummary(totalValueSummary)}</strong>
        </div>
        <div className="workspace-stat">
          <span>Cost basis</span>
          <strong>{formatCurrencySummary(totalCostSummary)}</strong>
        </div>
        <div className="workspace-stat">
          <span>Gain / loss</span>
          <strong>
            {totalGainLossSummary.map(({ currency, total }) => (
              <span
                className={total >= 0 ? 'amount-income' : 'amount-loss'}
                key={currency}
              >
                {total >= 0 ? '+' : ''}
                {formatCurrency(total, currency)}
              </span>
            ))}
          </strong>
        </div>
      </div>
      <div className="investment-list">
        {investments.map((investment) => {
          const metrics = calculateMetrics(investment)
          const currency = getInvestmentCurrency(investment)
          return (
            <article className="investment-row" key={investment.id}>
              <span className="investment-icon">
                {getInvestmentIcon(investment.investmentType)}
              </span>
              <div className="investment-copy">
                <div className="investment-title">
                  <strong>{investment.name}</strong>
                  {investment.ticker && (
                    <span className="investment-ticker">
                      {investment.ticker}
                    </span>
                  )}
                </div>
                <p>
                  {getInvestmentTypeLabel(investment.investmentType)} ·{' '}
                  {investment.quantity} units @{' '}
                  {formatCurrency(
                    Number(
                      investment.currentValue ?? investment.purchasePrice ?? 0
                    ),
                    currency
                  )}{' '}
                  {getCurrencyCode(currency)}
                </p>
                <span
                  className={
                    metrics.gainLoss >= 0 ? 'amount-income' : 'amount-loss'
                  }
                >
                  {metrics.gainLoss >= 0 ? '+' : ''}
                  {formatCurrency(metrics.gainLoss, currency)} (
                  {metrics.gainLossPercent.toFixed(2)}%)
                </span>
              </div>
              <strong className="investment-value">
                {formatCurrency(metrics.current, currency)}
              </strong>
              <div className="investment-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onEdit(investment)}
                  aria-label={`Edit ${investment.name}`}
                >
                  <EditIcon size={18} /> Edit
                </button>
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => handleDelete(investment)}
                  aria-label={`Delete ${investment.name}`}
                >
                  <TrashIcon size={18} /> Delete
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default InvestmentsTable
