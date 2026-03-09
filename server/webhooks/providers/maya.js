function parseAmount(payload = {}) {
  const amount = payload.amount || payload.totalAmount || payload.total_amount
  if (amount === undefined || amount === null) return { value: null, currency: null }

  if (typeof amount === 'object') {
    return {
      value: Number(amount.value ?? amount.amount ?? 0),
      currency: amount.currency || amount.currencyCode || null
    }
  }

  return {
    value: Number(amount),
    currency: payload.currency || payload.currencyCode || null
  }
}

function mapStatus(payload = {}) {
  const status = String(payload.status || payload.paymentStatus || '').toUpperCase()
  if (!status) return 'unknown'
  if (status.includes('COMPLETED') || status.includes('PAID')) return 'completed'
  if (status.includes('PENDING') || status.includes('PROCESSING')) return 'pending'
  if (status.includes('FAILED') || status.includes('DECLINED') || status.includes('CANCEL')) return 'failed'
  return status.toLowerCase()
}

export function verifyMayaSignature({ headers, config }) {
  const signature = headers['x-paymaya-signature'] || headers['x-maya-signature']
  if (!signature && !config.allowInsecureWebhooks) {
    return { ok: false, reason: 'Missing Maya signature header' }
  }

  if (!signature && config.allowInsecureWebhooks) {
    return { ok: true, reason: 'Skipped Maya signature verification in insecure mode' }
  }

  // Add HMAC verification here with MAYA_WEBHOOK_SECRET once your account setup confirms hash format.
  return { ok: true }
}

export function normalizeMayaEvent(body) {
  const payload = body.data || body
  const { value, currency } = parseAmount(payload)

  return {
    provider: 'maya',
    eventId: body.id || payload.id || payload.requestReferenceNumber || crypto.randomUUID(),
    eventType: body.event || body.type || payload.event || 'UNKNOWN',
    occurredAt: body.createdAt || payload.updatedAt || payload.createdAt || new Date().toISOString(),
    amount: value,
    currency,
    status: mapStatus(payload),
    reference: payload.requestReferenceNumber || payload.paymentId || payload.id || null,
    payer: payload.buyer?.email || payload.buyer?.id || null,
    raw: body
  }
}
