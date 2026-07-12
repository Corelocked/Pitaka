import assert from 'node:assert/strict'
import { buildSavingsPlan, getMonthsUntil } from './savingsPlan.js'

const today = new Date('2026-07-11T00:00:00')

assert.equal(getMonthsUntil('2026-10-10', today), 3)
assert.equal(getMonthsUntil('2026-10-12', today), 4)

assert.deepEqual(buildSavingsPlan({
  currentAmount: 250,
  targetAmount: 1000,
  targetDate: '2026-10-10'
}, today), {
  current: 250,
  target: 1000,
  remaining: 750,
  monthsLeft: 3,
  monthlyNeeded: 250,
  progress: 25,
  status: 'Needs funding'
})

console.log('savingsPlan checks passed')
