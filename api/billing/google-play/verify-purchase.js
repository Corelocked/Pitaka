import { getPaymentsConfig } from '../../../server/payments/config.js'
import { verifyGooglePlayPurchase } from '../../../server/payments/googlePlay.js'

function allowedOrigins() {
  const configured = [
    'https://localhost',
    'capacitor://localhost',
    process.env.PAYMONGO_APP_URL,
    ...String(process.env.PITAKA_ACCOUNT_ALLOWED_ORIGINS || '').split(',')
  ].filter(Boolean)
  return new Set(configured.map((value) => {
    try { return new URL(value).origin } catch { return value.replace(/\/$/, '') }
  }))
}

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin && allowedOrigins().has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  }
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  try {
    const result = await verifyGooglePlayPurchase(
      getPaymentsConfig(),
      req.headers.authorization || '',
      req.body?.purchaseToken
    )
    return res.status(result.status).json(result.body)
  } catch (error) {
    console.error('Google Play purchase verification failed', error.code || error.response?.status || 'unknown')
    const status = error.message?.startsWith('This purchase has already') || error.message?.startsWith('This Pitaka account') ? 409 : 500
    return res.status(status).json({ ok: false, error: error.message || 'Could not verify this Google Play purchase.' })
  }
}
