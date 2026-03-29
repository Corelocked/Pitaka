import { getPaymentsConfig } from '../../../../server/payments/config.js'
import { handlePaymongoWebhookRequest } from '../../../../server/payments/handlers.js'

async function readRawBody(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  return Buffer.concat(chunks).toString('utf8')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    const config = getPaymentsConfig()
    const rawBody = await readRawBody(req)
    const body = rawBody ? JSON.parse(rawBody) : {}
    const result = await handlePaymongoWebhookRequest(config, {
      body,
      rawBody,
      signatureHeader: req.headers['paymongo-signature'] || ''
    })

    res.status(result.status).json(result.body)
  } catch (error) {
    console.error('Failed to process PayMongo webhook', error)
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to process webhook'
    })
  }
}

export const config = {
  api: {
    bodyParser: false
  }
}
