import assert from 'node:assert/strict'
import { buildTransactionFeed, splitExpenseAmount } from './transactions.js'

const feed = buildTransactionFeed({
  incomes: [{ id: 'same', source: 'Salary', date: '2026-10-01', amount: 300 }],
  expenses: [{ id: 'same', description: 'Lunch', walletId: 'usd', date: '2026-10-03', amount: 5 }],
  transfers: [{ id: 'fund', fromWalletId: 'usd', date: '2026-10-02', amount: 50 }],
  wallets: [{ id: 'usd', name: 'Travel', currency: 'USD' }]
})
assert.deepEqual(feed.map((entry) => entry.type), ['expense', 'transfer', 'income'])
assert.equal(new Set(feed.map((entry) => entry.key)).size, 3)
assert.equal(feed[0].currency, 'USD')
assert.equal(feed[1].account, 'Travel → Savings goal')
assert.equal(feed[1].title, 'Savings contribution')
assert.deepEqual(splitExpenseAmount('0.30', '0.10'), [0.2, 0.1])
for (const split of [0, -1, 10, 11, NaN, Infinity]) assert.throws(() => splitExpenseAmount(10, split))
console.log('transaction feed and split checks passed')
