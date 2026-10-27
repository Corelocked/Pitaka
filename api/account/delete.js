import { getPaymentsConfig } from '../../server/payments/config.js'
import {
  getAdminAuth,
  getFirestore
} from '../../server/payments/firebaseAdmin.js'
import { deleteAccountData } from '../../server/accountDeletion.js'

export default async function handler(req, res) {
  const origin = req.headers.origin
  const allowed = new Set(
    [
      'https://localhost',
      'capacitor://localhost',
      process.env.PAYMONGO_APP_URL,
      ...String(process.env.PITAKA_ACCOUNT_ALLOWED_ORIGINS || '')
        .split(',')
        .map((value) => value.trim())
    ].filter(Boolean)
  )
  if (origin && allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  }
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }
  const token = /^Bearer (.+)$/i.exec(
    String(req.headers.authorization || '')
  )?.[1]
  if (!token) {
    res
      .status(401)
      .json({ ok: false, error: 'Sign in again before deleting your account.' })
    return
  }
  const config = getPaymentsConfig()
  let identity
  try {
    identity = await getAdminAuth(config).verifyIdToken(token, true)
  } catch {
    res
      .status(401)
      .json({ ok: false, error: 'Sign in again before deleting your account.' })
    return
  }
  if (!identity.auth_time || Date.now() / 1000 - identity.auth_time > 300) {
    res
      .status(401)
      .json({
        ok: false,
        error: 'Confirm your identity again to delete this account.'
      })
    return
  }
  try {
    await deleteAccountData(getFirestore(config), identity.uid, (uid) =>
      getAdminAuth(config).deleteUser(uid)
    )
    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Account deletion failed:', error.code || 'unknown')
    res
      .status(500)
      .json({
        ok: false,
        error:
          'Deletion could not finish. Your account is locked to protect your records. Please try again or contact support.'
      })
  }
}
