import express from 'express'
import { getWebhookConfig } from './config.js'
import { createEventSink } from './sink.js'
import { resolveAdapter } from './router.js'

const app = express()
const config = getWebhookConfig()
const sink = createEventSink(config)

app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8')
    }
  })
)

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'webhooks', sinkMode: config.sinkMode })
})

app.post('/webhooks/:provider', async (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase()
  const adapter = resolveAdapter(provider)

  if (!adapter) {
    res.status(404).json({ ok: false, error: `Unsupported provider: ${provider}` })
    return
  }

  try {
    const verification = await adapter.verify({
      headers: req.headers,
      body: req.body,
      rawBody: req.rawBody,
      config
    })

    if (!verification.ok) {
      res.status(401).json({ ok: false, error: verification.reason || 'Verification failed' })
      return
    }

    const normalizedEvent = adapter.normalize(req.body)
    await sink.save(normalizedEvent)

    res.status(200).json({ ok: true, eventId: normalizedEvent.eventId })
  } catch (error) {
    console.error(`Webhook processing failed for provider=${provider}`, error)
    res.status(500).json({ ok: false, error: 'Webhook processing failed' })
  }
})

app.listen(config.port, () => {
  console.log(`Webhook server listening at http://localhost:${config.port}`)
  console.log(`Sink mode: ${config.sinkMode}`)
})
