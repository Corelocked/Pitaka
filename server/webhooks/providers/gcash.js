function parseAmount(payload = {}) {
  const amount = payload.amount || payload.transactionAmount || payload.totalAmount
  if (amount === undefined || amount === null) return { value: null, currency: null }

  if (typeof amount === 'object') {
    return {
      value: Number(amount.value ?? amount.amount ?? 0),
      currency: amount.currency || amount.currencyCode || null
    }
  }

  return {
    value: Number(amount),
    currency: payload.currency || payload.currencyCode || 'PHP'
  }
}

function mapStatus(payload = {}) {
  const status = String(payload.status || payload.transactionStatus || '').toUpperCase()
  if (!status) return 'unknown'
  if (status.includes('SUCCESS') || status.includes('COMPLETED') || status.includes('PAID')) return 'completed'
  if (status.includes('PENDING') || status.includes('PROCESSING')) return 'pending'
  if (status.includes('FAILED') || status.includes('CANCEL') || status.includes('REJECT')) return 'failed'
  return status.toLowerCase()
}

export function verifyGCashSignature({ headers, config }) {
  const signature = headers['x-gcash-signature'] || headers['x-signature']
  if (!signature && !config.allowInsecureWebhooks) {
    return { ok: false, reason: 'Missing GCash signature header' }
  }

  if (!signature && config.allowInsecureWebhooks) {
    return { ok: true, reason: 'Skipped GCash signature verification in insecure mode' }
  }

  // Add HMAC verification here with GCASH_WEBHOOK_SECRET once your partner docs confirm signature scheme.
  return { ok: true }
}

export function normalizeGCashEvent(body) {
  const payload = body.data || body
  const { value, currency } = parseAmount(payload)

  return {
    provider: 'gcash',
    eventId: body.id || payload.id || payload.transactionId || payload.partnerTransactionId || crypto.randomUUID(),
    eventType: body.event || body.type || payload.event || 'UNKNOWN',
    occurredAt: body.createdAt || payload.transactionTime || payload.updatedAt || new Date().toISOString(),
    amount: value,
    currency,
    status: mapStatus(payload),
    reference: payload.partnerTransactionId || payload.transactionId || payload.orderId || null,
    payer: payload.buyer?.email || payload.msisdn || payload.customerId || null,
    raw: body
  }
}
