import crypto from 'crypto'

function getAuthorizationHeader(secretKey) {
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${encoded}`
}

async function readJsonResponse(response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { raw: text }
  }
}

export async function createCheckoutSession(config, payload) {
  if (!config.secretKey) {
    throw new Error('Missing PAYMONGO_SECRET_KEY')
  }

  const response = await fetch(`${config.apiBase}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Authorization: getAuthorizationHeader(config.secretKey),
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      data: {
        attributes: payload
      }
    })
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const message = data?.errors?.[0]?.detail || data?.raw || 'PayMongo checkout session creation failed'
    throw new Error(message)
  }

  return data?.data
}

function parseSignatureHeader(headerValue = '') {
  return headerValue
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((accumulator, entry) => {
      const [key, value = ''] = entry.split('=')
      accumulator[key] = value
      return accumulator
    }, {})
}

export function verifyWebhookSignature({ config, rawBody, signatureHeader, livemode }) {
  if (config.allowInsecureWebhooks) {
    return { ok: true }
  }

  if (!config.webhookSecret) {
    return { ok: false, reason: 'Missing PAYMONGO_WEBHOOK_SECRET' }
  }

  const parsed = parseSignatureHeader(signatureHeader)
  const timestamp = parsed.t
  const expectedSignature = livemode ? parsed.li : parsed.te

  if (!timestamp || !expectedSignature) {
    return { ok: false, reason: 'Invalid PayMongo signature header' }
  }

  const signedPayload = `${timestamp}.${rawBody}`
  const computedSignature = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(signedPayload)
    .digest('hex')

  const matches = crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(expectedSignature)
  )

  return matches
    ? { ok: true }
    : { ok: false, reason: 'PayMongo signature verification failed' }
}
