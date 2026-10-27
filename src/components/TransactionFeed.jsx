import { useMemo, useState } from 'react'
import { ActivityIcon, IncomeIcon, ExpenseIcon, TransferIcon } from './Icons'
import {
  formatCurrency,
  formatCurrencySummary,
  summarizeByCurrency
} from '../utils/currency'
import { buildTransactionFeed } from '../utils/transactions'
import { useConfirm } from '../contexts/useConfirm'

const TYPES = [
  { id: 'all', label: 'All' },
  { id: 'expense', label: 'Expenses' },
  { id: 'income', label: 'Income' },
  { id: 'transfer', label: 'Transfers' }
]
const TYPE_ICONS = {
  income: IncomeIcon,
  expense: ExpenseIcon,
  transfer: TransferIcon
}

export default function TransactionFeed({
  incomes,
  expenses,
  transfers,
  wallets,
  onEdit,
  onDelete,
  onAdd
}) {
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')
  const [accountId, setAccountId] = useState('')
  const [limit, setLimit] = useState(30)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const confirm = useConfirm()
  const entries = useMemo(
    () => buildTransactionFeed({ incomes, expenses, transfers, wallets }),
    [incomes, expenses, transfers, wallets]
  )
  const filtered = entries.filter(
    (entry) =>
      (type === 'all' || entry.type === type) &&
      (!accountId ||
        [entry.walletId, entry.fromWalletId, entry.toWalletId].includes(
          accountId
        )) &&
      `${entry.title} ${entry.account} ${entry.category} ${entry.notes || ''} ${(entry.tags || []).join(' ')} ${entry.amount}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
  )
  const incomeTotal = formatCurrencySummary(
    summarizeByCurrency(
      filtered.filter((entry) => entry.type === 'income'),
      (entry) => entry.amount,
      (entry) => entry.currency
    )
  )
  const expenseTotal = formatCurrencySummary(
    summarizeByCurrency(
      filtered.filter((entry) => entry.type === 'expense'),
      (entry) => entry.amount,
      (entry) => entry.currency
    )
  )
  const hasFilters = Boolean(query.trim() || accountId || type !== 'all')
  const clearFilters = () => {
    setQuery('')
    setType('all')
    setAccountId('')
    setLimit(30)
  }

  const remove = async (entry) => {
    if (
      !(await confirm({
        title: `Delete ${entry.type}?`,
        description: `${entry.title} · ${formatCurrency(entry.amount, entry.currency)}. This will update your account balance and cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Keep transaction'
      }))
    )
      return
    setDeleting(entry.key)
    setError('')
    try {
      await onDelete(entry)
    } catch (err) {
      setError(err.message || 'Could not delete. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="activity-workspace">
      <div className="workspace-summary-stats activity-summary">
        <div className="workspace-stat">
          <span>Money in</span>
          <strong className="amount-income">{incomeTotal}</strong>
        </div>
        <div className="workspace-stat">
          <span>Money out</span>
          <strong>{expenseTotal}</strong>
        </div>
        <div className="workspace-stat">
          <span>Transactions</span>
          <strong>{filtered.length}</strong>
        </div>
      </div>
      <section className="card activity-card" aria-label="Transaction history">
        <div className="activity-tools">
          <label className="activity-search">
            <span className="sr-only">Search transactions</span>
            <ActivityIcon size={18} />
            <input
              type="search"
              value={query}
              placeholder="Search transactions…"
              onChange={(event) => {
                setQuery(event.target.value)
                setLimit(30)
              }}
            />
          </label>
          <label>
            <span className="sr-only">Filter by account</span>
            <select
              value={accountId}
              onChange={(event) => {
                setAccountId(event.target.value)
                setLimit(30)
              }}
            >
              <option value="">All accounts</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="activity-filters"
          role="group"
          aria-label="Transaction type"
        >
          {TYPES.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={type === option.id}
              className={type === option.id ? 'active' : ''}
              onClick={() => {
                setType(option.id)
                setLimit(30)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        {hasFilters && filtered.length > 0 && <div className="activity-filter-status">
          <span aria-live="polite">{filtered.length} matching transaction{filtered.length === 1 ? '' : 's'}</span>
          <button type="button" className="text-action" onClick={clearFilters}>Clear filters</button>
        </div>}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {filtered.length === 0 ? (
          <div className="finance-empty">
            <ActivityIcon size={36} />
            <h3>
              {entries.length
                ? 'No matching transactions'
                : 'Your money story starts here'}
            </h3>
            <p>
              {entries.length
                ? 'Try another search or account.'
                : 'Record your first expense or income to see it here.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() =>
                entries.length
                  ? clearFilters()
                  : onAdd()
              }
            >
              {entries.length ? 'Clear filters' : 'Add a transaction'}
            </button>
          </div>
        ) : (
          <div className="activity-list">
            {filtered.slice(0, limit).map((entry, index, visible) => {
              const Icon = TYPE_ICONS[entry.type]
              const dateLabel = new Date(
                `${entry.date}T00:00:00`
              ).toLocaleDateString('en-PH', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })
              return (
                <div key={entry.key}>
                  {(index === 0 || visible[index - 1].date !== entry.date) && (
                    <h3 className="activity-date">{dateLabel}</h3>
                  )}
                  <details className="activity-entry">
                    <summary>
                      <span
                        className={`activity-type activity-type--${entry.type}`}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="activity-entry-copy">
                        <strong>{entry.title}</strong>
                        <span>
                          {entry.category} · {entry.account}
                        </span>
                      </span>
                      <span className={`activity-amount amount-${entry.type}`}>
                        {entry.type === 'income'
                          ? '+'
                          : entry.type === 'expense'
                            ? '−'
                            : ''}
                        {formatCurrency(entry.amount, entry.currency)}
                      </span>
                      <span className="activity-expand" aria-hidden="true">
                        ⌄
                      </span>
                    </summary>
                    <div className="activity-entry-details">
                      <p>
                        {entry.notes || 'No notes'}
                        {entry.tags?.length > 0 &&
                          ` · ${entry.tags.join(', ')}`}
                      </p>
                      <div>
                        {entry.type !== 'transfer' && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => onEdit(entry)}
                          >
                            Edit {entry.type}
                          </button>
                        )}
                        <button
                          className="btn danger"
                          disabled={deleting === entry.key}
                          onClick={() => remove(entry)}
                        >
                          {deleting === entry.key ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              )
            })}
          </div>
        )}
        {filtered.length > 0 && (
          <div className="activity-footer">
            <span>
              {Math.min(limit, filtered.length)} of {filtered.length}{' '}
              transactions
            </span>
            {limit < filtered.length && (
              <button
                className="btn btn-secondary"
                onClick={() => setLimit(limit + 30)}
              >
                Show more
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
