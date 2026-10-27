import assert from 'node:assert/strict'
import { getBudgetSpending } from './budgetSpending.js'

const expenses = [
  { categoryId: 'food', amount: 500, currency: 'PHP' },
  { category: 'Food', amount: 10, currency: 'USD' },
  { categoryId: 'food', amount: 20, walletId: 'travel' },
  { categoryId: 'rent', amount: 900, currency: 'PHP' }
]
const category = { id: 'food', name: 'Food' }
const wallets = [{ id: 'travel', currency: 'USD' }]
assert.equal(getBudgetSpending(category, expenses, wallets), 500)
assert.equal(getBudgetSpending(category, expenses, wallets, 'USD'), 30)
assert.equal(getBudgetSpending(category, expenses, wallets, 'EUR'), 0)
console.log('budget currency isolation checks passed')
