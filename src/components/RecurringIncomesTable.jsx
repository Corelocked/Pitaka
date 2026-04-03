import DataTable from './DataTable'
import { useConfirm } from '../contexts/useConfirm'
import { IncomeIcon } from './Icons'
import { DEFAULT_CURRENCY, formatCurrency, getWalletCurrency } from '../utils/currency'

function formatInterval(recurringIncome) {
  if (recurringIncome.intervalType === 'custom') {
    return `Every ${recurringIncome.customIntervalDays} days`
  }

  return recurringIncome.intervalType
    ? `${recurringIncome.intervalType[0].toUpperCase()}${recurringIncome.intervalType.slice(1)}`
    : 'Monthly'
}

function formatAuditStatus(row) {
  if (row.lastPostedAt || row.lastPostedDate) {
    return {
      label: `Posted ${row.lastPostedAt || row.lastPostedDate}`,
      tone: 'post'
    }
  }

  if (row.lastSkippedAt || row.lastSkippedDate) {
    return {
      label: `Skipped ${row.lastSkippedAt || row.lastSkippedDate}`,
      tone: 'skip'
    }
  }

  return {
    label: 'No runs yet',
    tone: 'pending'
  }
}

export default function RecurringIncomesTable({
  recurringIncomes = [],
  wallets = [],
  onEditRecurringIncome,
  onDeleteRecurringIncome,
  selectable = false,
  onBulkDelete
}) {
  const confirm = useConfirm()
  const walletNameById = (walletId) => wallets.find((wallet) => wallet.id === walletId)?.name || 'No wallet'
  const currencyFor = (row) => {
    const wallet = wallets.find((entry) => entry.id === row.walletId)
    return row.currency || getWalletCurrency(wallet) || DEFAULT_CURRENCY
  }

  const columns = [
    {
      key: 'source',
      header: 'Source',
      className: 'col-name',
      width: '220px',
      render: (row) => {
        const audit = formatAuditStatus(row)

        return (
          <div className="table-row-primary">
            <span className="table-row-primary-text">{row.source}</span>
            <span className={`table-audit-chip table-audit-chip--${audit.tone}`}>{audit.label}</span>
          </div>
        )
      },
      sortable: true,
      sortValue: (row) => row.source
    },
    { key: 'walletId', header: 'Wallet', className: 'col-wallet', width: '160px', render: (row) => walletNameById(row.walletId), sortable: true, sortValue: (row) => walletNameById(row.walletId) },
    { key: 'amount', header: 'Amount', className: 'amount', width: '120px', render: (row) => formatCurrency(row.amount || 0, currencyFor(row)), sortable: true, sortValue: (row) => Number(row.amount || 0) },
    { key: 'startDate', header: 'First Payout', className: 'col-date', width: '140px', render: (row) => row.startDate, sortable: true },
    { key: 'interval', header: 'Interval', className: 'col-interval', width: '140px', render: (row) => formatInterval(row), sortable: true, sortValue: (row) => formatInterval(row) },
    { key: 'nextDueDate', header: 'Next Run', className: 'col-date', width: '140px', render: (row) => row.nextDueDate || 'Pending', sortable: true },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      className: 'col-date table-audit-cell',
      width: '160px',
      render: (row) => {
        const audit = formatAuditStatus(row)
        return <span className={`table-audit-chip table-audit-chip--${audit.tone}`}>{audit.label}</span>
      },
      sortable: true,
      sortValue: (row) => row.lastPostedAt || row.lastPostedDate || row.lastSkippedAt || row.lastSkippedDate || ''
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'col-actions actions',
      width: '128px',
      render: (row) => (
        <>
          <button className="edit-btn" onClick={() => onEditRecurringIncome?.(row)}>Edit</button>
          <button
            className="delete-btn"
            onClick={async () => {
              const ok = await confirm({
                title: 'Delete recurring income',
                description: `Delete recurring income "${row.source}"? Future auto-posting will stop.`,
                confirmText: 'Delete',
                cancelText: 'Cancel'
              })

              if (ok) {
                await onDeleteRecurringIncome?.(row.id)
              }
            }}
          >
            Delete
          </button>
        </>
      )
    }
  ]

  return (
    <DataTable
      tableClassName="table table--recurring-incomes"
      columns={columns}
      data={recurringIncomes}
      rowKey={(row) => row.id}
      emptyState={(
        <div className="table-empty-state table-empty-state--transactions">
          <div className="table-empty-state-icon"><IncomeIcon size={22} /></div>
          <p className="table-empty-state-text">No recurring income schedules yet</p>
        </div>
      )}
      selectable={selectable}
      onBulkDelete={onBulkDelete}
    />
  )
}
