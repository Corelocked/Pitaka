import { useConfirm } from '../contexts/ConfirmContext'
import { ActivityIcon, TransferIcon, TrashIcon } from './Icons'
import './Table.css'

function TransfersTable({ transfers, wallets, onDelete }) {
  const confirm = useConfirm()

  const getWalletName = (walletId) => {
    const wallet = wallets.find(w => w.id === walletId)
    return wallet ? wallet.name : 'Unknown'
  }

  const handleDelete = async (transfer) => {
    const ok = await confirm({
      title: 'Delete Transfer',
      description: `Are you sure you want to delete this transfer of ₱${parseFloat(transfer.amount).toFixed(2)}?`,
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
        <h3 className="card-title"><TransferIcon size={18} /> Transfers</h3>
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
      <h3 className="card-title"><TransferIcon size={18} /> Transfers ({transfers.length})</h3>
      <div className="transaction-list">
        {transfers.map((transfer) => (
          <div key={transfer.id} className="transaction-item">
            <div className="transaction-icon transfer">
              <ActivityIcon size={20} />
            </div>
            <div className="transaction-details">
              <div className="transaction-title">
                {getWalletName(transfer.fromWalletId)} → {getWalletName(transfer.toWalletId)}
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
                ₱{parseFloat(transfer.amount).toFixed(2)}
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
        ))}
      </div>
    </div>
  )
}

export default TransfersTable
