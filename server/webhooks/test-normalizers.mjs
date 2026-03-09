import assert from 'node:assert/strict'
import { normalizePayPalEvent } from './providers/paypal.js'
import { normalizeMayaEvent } from './providers/maya.js'
import { normalizeGCashEvent } from './providers/gcash.js'

const paypal = normalizePayPalEvent({
  id: 'WH-1',
  event_type: 'PAYMENT.CAPTURE.COMPLETED',
  create_time: '2026-03-09T10:10:10Z',
  resource: {
    id: 'PAYPAL-123',
    amount: { value: '125.55', currency_code: 'USD' },
    payer: { email_address: 'payer@example.com' }
  }
})
assert.equal(paypal.provider, 'paypal')
assert.equal(paypal.amount, 125.55)
assert.equal(paypal.currency, 'USD')
assert.equal(paypal.status, 'completed')

const maya = normalizeMayaEvent({
  id: 'MAYA-WH-1',
  event: 'PAYMENT_SUCCESS',
  data: {
    id: 'MAYA-TX-1',
    amount: 399,
    currency: 'PHP',
    status: 'COMPLETED',
    requestReferenceNumber: 'ORD-100'
  }
})
assert.equal(maya.provider, 'maya')
assert.equal(maya.amount, 399)
assert.equal(maya.currency, 'PHP')
assert.equal(maya.status, 'completed')

const gcash = normalizeGCashEvent({
  id: 'GCASH-WH-1',
  type: 'PAYMENT_STATUS',
  data: {
    transactionId: 'GC-111',
    amount: { value: '149.95', currency: 'PHP' },
    transactionStatus: 'SUCCESS',
    partnerTransactionId: 'ORDER-200'
  }
})
assert.equal(gcash.provider, 'gcash')
assert.equal(gcash.amount, 149.95)
assert.equal(gcash.currency, 'PHP')
assert.equal(gcash.status, 'completed')

console.log('All webhook normalizer checks passed.')
