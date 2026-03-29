import { getPaymentsConfig } from '../../../server/payments/config.js'
import { handleCheckoutSessionRequest } from '../../../server/payments/handlers.js'

async function readJsonBody(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')
  return rawBody ? JSON.parse(rawBody) : {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    const config = getPaymentsConfig()
    const body = await readJsonBody(req)
    const result = await handleCheckoutSessionRequest(config, body)
    res.status(result.status).json(result.body)
  } catch (error) {
    console.error('Failed to create PayMongo checkout session', error)
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to create checkout session'
    })
  }
}

export const config = {
  api: {
    bodyParser: false
  }
}
