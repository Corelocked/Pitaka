import React from 'react'

function WalletSummary({ wallets = [], incomes = [], expenses = [] }) {
  // calculate current balance per wallet = startingBalance + incomes - expenses
  const balances = wallets.map(w => {
    const starting = parseFloat(w.startingBalance || 0)
    const inflows = incomes.filter(i => i.walletId === w.id).reduce((s, it) => s + parseFloat(it.amount || 0), 0)
    const outflows = expenses.filter(e => e.walletId === w.id).reduce((s, it) => s + parseFloat(it.amount || 0), 0)
    const balance = starting + inflows - outflows
    return { id: w.id, name: w.name, balance }
  })

  if (!wallets || wallets.length === 0) {
    return <div className="wallet-summary empty">No wallets available</div>
  }

  return (
    <div className="wallet-summary-list">
      {balances.map(w => (
        <div key={w.id} className="summary-item">
          <h3>{w.name}</h3>
          <p className="amount">₱{Number(w.balance || 0).toFixed(2)}</p>
        </div>
      ))}
    </div>
  )
}

export default WalletSummary
