import React from 'react'
import { useBudget } from '../hooks/useBudget'
import SavingsForm from '../components/SavingsForm'
import AddToSavingsForm from '../components/AddToSavingsForm'
import PageLayout from '../components/PageLayout'
import WalletSummary from '../components/WalletSummary'

export default function SavingsPage() {
  const { savings = [], addSavings, updateSavings, deleteSavings, editSavings, editingSavings, wallets = [], incomes = [], expenses = [] } = useBudget()

  const SavingsList = (
    <div style={{ width: '100%' }}>
      <div className="table-wrapper">
        <h3 style={{ marginTop: 0 }}>Savings</h3>
        {savings.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No savings goals yet</div>}
        {savings.map(s => {
          const current = parseFloat(s.currentAmount || 0)
          const target = parseFloat(s.targetAmount || 0) || 1
          const pct = Math.min(100, Math.round((current / target) * 1000) / 10)
          return (
            <div key={s.id} style={{ marginBottom: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{s.goal}</strong>
                <span>₱{current.toFixed(2)}</span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                style={{
                  height: 16,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg,var(--accent),#38bdf8)',
                    boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.16)',
                    transition: 'width 420ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: pct > 16 ? 'flex-end' : 'flex-start',
                    paddingRight: 10,
                    paddingLeft: 10
                  }}
                >
                  <span style={{ fontSize: 12, color: '#ffffff', fontWeight: 800, textShadow: '0 1px 0 rgba(0,0,0,0.4)' }}>{pct}%</span>
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                {pct}% of ₱{target.toFixed(2)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ width: '100%' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 'min-content', gap: 18, width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: 12, width: '100%' }}>
          <div style={{ background: 'var(--card-bg)', padding: 12, borderRadius: 8, boxShadow: 'var(--card-shadow)', width: '100%' }}>
            <h3 style={{ marginTop: 0 }}>Add Savings</h3>
            <div style={{ width: '100%' }}>
              <SavingsForm
                onAddSavings={addSavings}
                editingSavings={editingSavings}
                onUpdateSavings={updateSavings}
                onCancelEdit={() => editSavings(null)}
              />
            </div>
          </div>

          <div style={{ background: 'var(--card-bg)', padding: 12, borderRadius: 8, boxShadow: 'var(--card-shadow)', width: '100%' }}>
            <h3 style={{ marginTop: 0 }}>Add To Savings</h3>
            <div style={{ width: '100%' }}>
              <AddToSavingsForm
                savings={savings}
                onAddToSavings={async (id, amount) => {
                  const found = savings.find(s => s.id === id)
                  if (!found) return
                  try {
                    await updateSavings({ id, currentAmount: parseFloat(found.currentAmount) + parseFloat(amount) })
                  } catch (err) {
                    console.error('Add to savings failed', err)
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ width: '100%', overflow: 'auto' }}>
          {SavingsList}
        </div>
      </div>
    </div>
  )
}
