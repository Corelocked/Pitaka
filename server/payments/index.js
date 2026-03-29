import express from 'express'
import { getPaymentsConfig } from './config.js'
import { handleCheckoutSessionRequest, handlePaymongoWebhookRequest } from './handlers.js'

const app = express()
const config = getPaymentsConfig()

app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8')
    }
  })
)

app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'payments',
    plan: config.planCode,
    currency: config.priceCurrency,
    amount: config.priceAmount
  })
})

app.post('/billing/paymongo/checkout-session', async (req, res) => {
  try {
    const result = await handleCheckoutSessionRequest(config, req.body)
    res.status(result.status).json(result.body)
  } catch (error) {
    console.error('Failed to create PayMongo checkout session', error)
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to create checkout session'
    })
  }
})

app.post('/billing/paymongo/webhooks/paymongo', async (req, res) => {
  try {
    const result = await handlePaymongoWebhookRequest(config, {
      body: req.body,
      rawBody: req.rawBody || JSON.stringify(req.body || {}),
      signatureHeader: req.get('Paymongo-Signature') || ''
    })
    res.status(result.status).json(result.body)
  } catch (error) {
    console.error('Failed to process PayMongo webhook', error)
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to process webhook'
    })
  }
})

app.listen(config.port, () => {
  console.log(`Payments server listening at http://localhost:${config.port}`)
})
