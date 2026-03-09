function parseAmount(resource = {}) {
  const amount = resource.amount || resource.seller_receivable_breakdown?.gross_amount
  if (!amount) return { value: null, currency: null }

  const value = Number(amount.value ?? amount.total ?? 0)
  const currency = amount.currency_code || amount.currency || null
  return { value, currency }
}

function mapStatus(eventType, resource = {}) {
  if (eventType.includes('COMPLETED')) return 'completed'
  if (eventType.includes('PENDING')) return 'pending'
  if (eventType.includes('DENIED') || eventType.includes('FAILED')) return 'failed'
  if (resource.status) return String(resource.status).toLowerCase()
  return 'unknown'
}

export async function verifyPayPalSignature({ headers, config }) {
  // For production, complete signature verification using PayPal's verify-webhook-signature API.
  const requiredHeaders = [
    'paypal-transmission-id',
    'paypal-transmission-time',
    'paypal-cert-url',
    'paypal-auth-algo',
    'paypal-transmission-sig'
  ]

  const hasHeaders = requiredHeaders.every((h) => Boolean(headers[h]))
  if (!hasHeaders && !config.allowInsecureWebhooks) {
    return { ok: false, reason: 'Missing PayPal signature headers' }
  }

  if (!hasHeaders && config.allowInsecureWebhooks) {
    return { ok: true, reason: 'Skipped PayPal signature verification in insecure mode' }
  }

  return { ok: true }
}

export function normalizePayPalEvent(body) {
  const resource = body.resource || {}
  const { value, currency } = parseAmount(resource)

  return {
    provider: 'paypal',
    eventId: body.id || resource.id || crypto.randomUUID(),
    eventType: body.event_type || 'UNKNOWN',
    occurredAt: body.create_time || new Date().toISOString(),
    amount: value,
    currency,
    status: mapStatus(body.event_type || '', resource),
    reference: resource.invoice_id || resource.id || null,
    payer: resource.payer?.email_address || resource.payer?.payer_id || null,
    raw: body
  }
}
