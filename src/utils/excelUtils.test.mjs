import assert from 'node:assert/strict'
import { parseExcelCsv } from './excelUtils.js'

const parsed = parseExcelCsv(`=== EXPENSES ===
Date,Description,Amount,Category,Wallet,Notes
2026-07-11,"Groceries, snacks",1200,Food,Main,"Line one
Line ""two"""
`)

assert.equal(parsed.expenses.length, 1)
assert.equal(parsed.expenses[0].description, 'Groceries, snacks')
assert.equal(parsed.expenses[0].notes, 'Line one\nLine "two"')

const unmapped = parseExcelCsv(`Date,Merchant,Amount
2026-07-11,Coffee,150
`)

assert.deepEqual(unmapped.unmapped.headers, ['Date', 'Merchant', 'Amount'])
assert.equal(unmapped.unmapped.rows.length, 1)

const zeroValueInvestment = parseExcelCsv(`=== INVESTMENTS ===
Name,Type,Ticker,Quantity,Purchase Price,Current Value,Purchase Date,Notes
Failed Holding,stock,FAIL,2,100,0,2026-07-11,
`)

assert.equal(zeroValueInvestment.investments[0].currentValue, 0)

console.log('excelUtils tests passed')
