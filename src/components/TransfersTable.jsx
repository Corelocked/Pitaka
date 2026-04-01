import { useConfirm } from '../contexts/useConfirm'
import { ActivityIcon, TransferIcon, TrashIcon } from './Icons'
import './Table.css'
import { DEFAULT_CURRENCY, formatCurrency, getWalletCurrency } from '../utils/currency'

function TransfersTable({ transfers, wallets, onDelete }) {
  const confirm = useConfirm()

  const getWalletName = (walletId) => {
    const wallet = wallets.find(w => w.id === walletId)
    return wallet ? wallet.name : 'Unknown'
  }

  const getTransferLabel = (transfer) => {
    const sourceName = getWalletName(transfer.fromWalletId)
    if (transfer.toSavingsId) {
      return `${sourceName} → ${transfer.savingsGoalName || 'Savings Goal'}`
    }
    return `${sourceName} → ${getWalletName(transfer.toWalletId)}`
  }

  const handleDelete = async (transfer) => {
    const currency = transfer.currency || getWalletCurrency(wallets.find((wallet) => wallet.id === transfer.fromWalletId)) || DEFAULT_CURRENCY
    const ok = await confirm({
      title: 'Delete Transfer',
      description: `Are you sure you want to delete this transfer of ${formatCurrency(transfer.amount, currency)}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })

    if (ok) {
      onDelete(transfer.id)
    }
  }

  if (!transfers || transfers.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-state-icon"><TransferIcon size={52} /></div>
          <div className="empty-state-title">No transfers yet</div>
          <div className="empty-state-description">
            Transfer money between your wallets to keep track of your funds
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="table-container">
      <div className="transaction-list">
        {transfers.map((transfer) => {
          const currency = transfer.currency || getWalletCurrency(wallets.find((wallet) => wallet.id === transfer.fromWalletId)) || DEFAULT_CURRENCY

          return (
          <div key={transfer.id} className="transaction-item">
            <div className="transaction-icon transfer">
              <ActivityIcon size={20} />
            </div>
            <div className="transaction-details">
              <div className="transaction-title">
                {getTransferLabel(transfer)}
              </div>
              <div className="transaction-subtitle">
                {new Date(transfer.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                {transfer.notes && ` • ${transfer.notes}`}
              </div>
            </div>
            <div className="transaction-actions">
              <div className="transaction-amount transfer">
                {formatCurrency(transfer.amount, currency)}
              </div>
              <button
                onClick={() => handleDelete(transfer)}
                className="icon-btn"
                style={{
                  background: '#fee',
                  color: '#ef4444',
                  width: '36px',
                  height: '36px',
                  fontSize: '16px'
                }}
                title="Delete transfer"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}

export default TransfersTable
