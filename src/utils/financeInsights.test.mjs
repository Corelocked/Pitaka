import assert from 'node:assert/strict'
import { buildFinanceInsights, getMonthProgress } from './financeInsights.js'

assert.deepEqual(getMonthProgress(new Date('2026-07-11T00:00:00')), {
  day: 11,
  daysInMonth: 31,
  remainingDays: 20
})

const insights = buildFinanceInsights({
  cash: 1000,
  income: 3000,
  expenses: 1000,
  savings: 500,
  upcomingBills: 300,
  date: new Date('2026-07-10T00:00:00')
})

assert.equal(insights.projectedExpenses, 3400)
assert.equal(insights.projectedMonthEnd, 600)
assert.equal(insights.runwayDays, 10)
assert.equal(insights.status, 'Strong')

console.log('financeInsights checks passed')
