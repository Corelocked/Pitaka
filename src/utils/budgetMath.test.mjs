import assert from 'node:assert/strict'
import { computeWalletBalance, computeWalletBalances, isVisibleManagedExpense, moneyNumber } from './budgetMath.js'

const wallet = { id: 'cash', startingBalance: 100 }
const entries = {
  incomes: [{ walletId: 'cash', amount: 25 }],
  expenses: [
    { walletId: 'cash', amount: 10 },
    { walletId: 'cash', amount: 99, subscriptionId: 'hidden' }
  ],
  transfers: [
    { fromWalletId: 'cash', amount: 5 },
    { toWalletId: 'cash', amount: 15 }
  ]
}

assert.equal(moneyNumber('bad'), 0)
assert.equal(isVisibleManagedExpense({ subscriptionId: 'sub' }), false)
assert.equal(computeWalletBalance(wallet, entries), 125)
assert.deepEqual(computeWalletBalances([wallet], entries), [{ ...wallet, balance: 125 }])

console.log('budgetMath checks passed')
