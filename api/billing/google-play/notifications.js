import { getPaymentsConfig } from '../../../server/payments/config.js'
import { processGooglePlayNotification, verifyGooglePlayNotification } from '../../../server/payments/googlePlay.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  try {
    const config = getPaymentsConfig()
    const auth = await verifyGooglePlayNotification(config, req.headers.authorization || '')
    if (auth.status !== 200) return res.status(auth.status).json(auth.body)

    const encoded = req.body?.message?.data
    if (typeof encoded !== 'string') return res.status(400).json({ ok: false, error: 'Invalid notification.' })
    const payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
    await processGooglePlayNotification(config, payload)
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Google Play notification failed', error.code || error.response?.status || 'unknown')
    return res.status(500).json({ ok: false, error: 'Could not process Google Play notification.' })
  }
}
