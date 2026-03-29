import DataTable from './DataTable'
import { useConfirm } from '../contexts/useConfirm'
import { FolderIcon } from './Icons'

function formatInterval(subscription) {
  if (subscription.intervalType === 'custom') {
    return `Every ${subscription.customIntervalDays} days`
  }

  return subscription.intervalType ? `${subscription.intervalType[0].toUpperCase()}${subscription.intervalType.slice(1)}` : 'Monthly'
}

export default function SubscriptionsTable({
  subscriptions = [],
  wallets = [],
  onEditSubscription,
  onDeleteSubscription
}) {
  const confirm = useConfirm()
  const walletNameById = (walletId) => wallets.find((wallet) => wallet.id === walletId)?.name || 'Unknown wallet'

  const columns = [
    { key: 'name', header: 'Subscription', className: 'col-name', width: '220px', render: (row) => row.name, sortable: true },
    { key: 'walletId', header: 'Wallet', className: 'col-wallet', width: '160px', render: (row) => walletNameById(row.walletId), sortable: true, sortValue: (row) => walletNameById(row.walletId) },
    { key: 'amount', header: 'Amount', className: 'amount', width: '120px', render: (row) => `${row.currency || ''} ${Number(row.amount || 0).toFixed(2)}`, sortable: true, sortValue: (row) => Number(row.amount || 0) },
    { key: 'startDate', header: 'First Charge', className: 'col-date', width: '140px', render: (row) => row.startDate, sortable: true },
    { key: 'interval', header: 'Interval', className: 'col-interval', width: '140px', render: (row) => formatInterval(row), sortable: true, sortValue: (row) => formatInterval(row) },
    { key: 'actions', header: 'Actions', className: 'col-actions actions', width: '120px', render: (row) => (
      <>
        <button className="edit-btn" onClick={() => onEditSubscription?.(row)}>Edit</button>
        <button
          className="delete-btn"
          onClick={async () => {
            const ok = await confirm({
              title: 'Delete subscription',
              description: `Delete subscription "${row.name}"? Future expenses will stop auto-logging.`,
              confirmText: 'Delete',
              cancelText: 'Cancel'
            })

            if (ok) {
              await onDeleteSubscription?.(row.id)
            }
          }}
        >
          Delete
        </button>
      </>
    ) }
  ]

  return (
    <DataTable
      tableClassName="table table--subscriptions"
      columns={columns}
      data={subscriptions}
      rowKey={(row) => row.id}
      emptyState={(
        <div className="empty-state">
          <div className="icon"><FolderIcon size={22} /></div>
          <p>No subscriptions yet</p>
        </div>
      )}
    />
  )
}
