import { useState } from 'react'
import MoneyLendingForm from '../components/MoneyLendingForm'
import { useBudget } from '../hooks/useBudget'
import LendingsTable from '../components/LendingsTable'

function formatDate(d) {
  try { return new Date(d).toLocaleDateString() } catch { return d }
}

export default function Lendings() {
  const { lendings = [], wallets = [], walletBalances = [], addLending, updateLending, deleteLending } = useBudget()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')

  const walletName = (id) => walletBalances.find(w => w.id === id)?.name || wallets.find(w => w.id === id)?.name || ''

  const totalLent = lendings.filter(l => l.direction === 'lent').reduce((s, l) => s + parseFloat(l.amount || 0), 0)
  const totalBorrowed = lendings.filter(l => l.direction === 'borrowed').reduce((s, l) => s + parseFloat(l.amount || 0), 0)
  const pendingCount = lendings.filter(l => l.status === 'pending').length
  const settledCount = lendings.filter(l => l.status === 'settled').length

  const filtered = lendings.filter(l => {
    if (!q) return true
    const qq = q.toLowerCase()
    return (l.description || '').toLowerCase().includes(qq) || (walletName(l.walletId) || '').toLowerCase().includes(qq) || String(l.amount || '').includes(qq)
  })

  const handleAdd = async (payload) => {
    await addLending(payload)
  }

  const handleUpdate = async (payload) => {
    await updateLending(payload)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return
    await deleteLending(id)
  }

  return (
    <div>
      <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:16}}>
        <div className="summary" style={{display:'flex', gap:12}}>
          <div className="summary-item">
            <h3>Total Lent</h3>
            <p className="amount">₱{totalLent.toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h3>Total Borrowed</h3>
            <p className="amount">₱{totalBorrowed.toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h3>Pending</h3>
            <p className="amount">{pendingCount}</p>
          </div>
          <div className="summary-item">
            <h3>Settled</h3>
            <p className="amount">{settledCount}</p>
          </div>
        </div>

        <div style={{marginLeft:'auto', display:'flex', gap:8, alignItems:'center'}}>
          <input placeholder="Search lendings..." value={q} onChange={e => setQ(e.target.value)} />
          <button className="export-btn" onClick={() => setShowForm(true)}>Add Lending</button>
        </div>
      </div>

      {showForm && (
        <div style={{marginBottom:16}}>
          <MoneyLendingForm
            wallets={walletBalances}
            onSubmit={async (payload) => {
              try {
                if (editing) {
                  await handleUpdate({ id: editing.id, ...payload })
                  setEditing(null)
                } else {
                  await handleAdd(payload)
                }
                setShowForm(false)
              } catch (err) {
                console.error(err)
              }
            }}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      <div>
        <LendingsTable
          lendings={filtered}
          wallets={wallets}
          onEdit={(row) => { setEditing(row); setShowForm(true) }}
          onDelete={(id) => handleDelete(id)}
        />
      </div>
    </div>
  )
}
