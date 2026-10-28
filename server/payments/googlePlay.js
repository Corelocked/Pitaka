import { createHash } from 'node:crypto'
import { JWT, OAuth2Client } from 'google-auth-library'
import { getFirestore, verifyFirebaseIdToken } from './firebaseAdmin.js'

const PLAY_SCOPE = 'https://www.googleapis.com/auth/androidpublisher'
const PLAY_API = 'https://androidpublisher.googleapis.com/androidpublisher/v3'

function bearerToken(header = '') {
  const match = /^Bearer\s+(.+)$/i.exec(String(header))
  return match?.[1] || ''
}

function parseServiceAccount(value) {
  try {
    const account = JSON.parse(value)
    if (!account.client_email || !account.private_key) throw new Error()
    return account
  } catch {
    throw new Error('Google Play purchase verification is not configured.')
  }
}

function accountIdHash(uid) {
  return createHash('sha256').update(uid).digest('hex')
}

export async function verifyGooglePlayPurchase(config, authorization, purchaseToken) {
  const idToken = bearerToken(authorization)
  if (!idToken) return { status: 401, body: { ok: false, error: 'Sign in to verify your purchase.' } }
  if (typeof purchaseToken !== 'string' || purchaseToken.length < 20 || purchaseToken.length > 4096) {
    return { status: 400, body: { ok: false, error: 'Invalid Google Play purchase token.' } }
  }
  if (!config.googlePlayServiceAccount || !config.googlePlayProductId || !config.googlePlayPackageName) {
    return { status: 503, body: { ok: false, error: 'Google Play purchases are not configured yet.' } }
  }

  const identity = await verifyFirebaseIdToken(config, idToken)
  const serviceAccount = parseServiceAccount(config.googlePlayServiceAccount)
  const publisher = new JWT({ email: serviceAccount.client_email, key: serviceAccount.private_key, scopes: [PLAY_SCOPE] })
  const purchaseUrl = `${PLAY_API}/applications/${encodeURIComponent(config.googlePlayPackageName)}/purchases/productsv2/tokens/${encodeURIComponent(purchaseToken)}`
  const { data: purchase } = await publisher.request({ url: purchaseUrl, method: 'GET' })
  const lineItems = purchase.productLineItem || purchase.productLineItems || []
  const ownsProProduct = lineItems.some((item) => item.productId === config.googlePlayProductId)

  if (purchase.purchaseStateContext?.purchaseState !== 'PURCHASED' || !ownsProProduct) {
    return { status: 409, body: { ok: false, error: 'This Google Play purchase is not a completed Pitaka Pro purchase.' } }
  }
  if (purchase.obfuscatedExternalAccountId !== accountIdHash(identity.uid)) {
    return { status: 409, body: { ok: false, error: 'This purchase belongs to a different Pitaka account. Sign in to the account used when buying Pro.' } }
  }

  const db = getFirestore(config)
  const tokenHash = createHash('sha256').update(purchaseToken).digest('hex')
  const purchaseRef = db.collection('playPurchases').doc(tokenHash)
  const userRef = db.collection('users').doc(identity.uid)
  await db.runTransaction(async (transaction) => {
    const [purchaseSnapshot, userSnapshot] = await Promise.all([
      transaction.get(purchaseRef),
      transaction.get(userRef)
    ])
    if (purchaseSnapshot.exists && purchaseSnapshot.data().userId !== identity.uid) {
      throw new Error('This purchase has already been linked to another Pitaka account.')
    }
    if (!userSnapshot.exists || userSnapshot.data().deletionPending) {
      throw new Error('This Pitaka account is unavailable. Sign in again and retry.')
    }
    const profile = userSnapshot.data()
    const tags = Array.isArray(profile.tags) ? profile.tags : []
    const existingSources = Array.isArray(profile.planSources) ? profile.planSources : (profile.plan === 'pro' ? ['legacy'] : [])
    transaction.set(userRef, {
      plan: 'pro',
      tags: [...new Set([...tags, 'pro'])],
      planSources: [...new Set([...existingSources, 'google_play'])],
      updatedAt: new Date()
    }, { merge: true })
    transaction.set(purchaseRef, {
      userId: identity.uid,
      productId: config.googlePlayProductId,
      status: 'purchased',
      orderId: purchase.orderId || '',
      regionCode: purchase.regionCode || '',
      purchaseTime: purchase.purchaseCompletionTime || '',
      updatedAt: new Date()
    }, { merge: true })
  })

  if (purchase.acknowledgementState !== 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED') {
    const acknowledgeUrl = `${PLAY_API}/applications/${encodeURIComponent(config.googlePlayPackageName)}/purchases/products/${encodeURIComponent(config.googlePlayProductId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`
    try {
      await publisher.request({ url: acknowledgeUrl, method: 'POST', data: {} })
    } catch (error) {
      console.error('Google Play purchase acknowledgement failed', error.code || error.response?.status || 'unknown')
    }
  }

  return { status: 200, body: { ok: true } }
}

export async function verifyGooglePlayNotification(config, authorization) {
  const idToken = bearerToken(authorization)
  if (!idToken || !config.googlePlayPubSubAudience || !config.googlePlayPubSubServiceAccount) {
    return { status: 401, body: { ok: false, error: 'Unauthorized notification.' } }
  }
  const ticket = await new OAuth2Client().verifyIdToken({ idToken, audience: config.googlePlayPubSubAudience })
  const claims = ticket.getPayload()
  if (!claims?.email_verified || claims.email !== config.googlePlayPubSubServiceAccount) {
    return { status: 401, body: { ok: false, error: 'Unauthorized notification.' } }
  }
  return { status: 200, body: { ok: true } }
}

export async function processGooglePlayNotification(config, notification) {
  if (notification.packageName !== config.googlePlayPackageName) return
  const oneTime = notification.oneTimeProductNotification
  const voided = notification.voidedPurchaseNotification
  const purchaseToken = oneTime?.purchaseToken || voided?.purchaseToken
  const isCancelled = oneTime?.sku === config.googlePlayProductId && oneTime.notificationType === 2
  const isVoided = voided?.productType === 2 && voided.refundType === 1
  if (!purchaseToken || (!isCancelled && !isVoided)) return

  const tokenHash = createHash('sha256').update(purchaseToken).digest('hex')
  const db = getFirestore(config)
  const purchaseRef = db.collection('playPurchases').doc(tokenHash)
  const snapshot = await purchaseRef.get()
  if (!snapshot.exists) return

  if (isCancelled) {
    const serviceAccount = parseServiceAccount(config.googlePlayServiceAccount)
    const publisher = new JWT({ email: serviceAccount.client_email, key: serviceAccount.private_key, scopes: [PLAY_SCOPE] })
    const purchaseUrl = `${PLAY_API}/applications/${encodeURIComponent(config.googlePlayPackageName)}/purchases/productsv2/tokens/${encodeURIComponent(purchaseToken)}`
    const { data: purchase } = await publisher.request({ url: purchaseUrl, method: 'GET' })
    if (purchase.purchaseStateContext?.purchaseState === 'PURCHASED') return
  }

  const userId = snapshot.data().userId
  const userRef = db.collection('users').doc(userId)
  await db.runTransaction(async (transaction) => {
    const [purchaseSnapshot, userSnapshot] = await Promise.all([
      transaction.get(purchaseRef),
      transaction.get(userRef)
    ])
    if (!purchaseSnapshot.exists || !userSnapshot.exists) return
    const profile = userSnapshot.data()
    const sources = Array.isArray(profile.planSources) ? profile.planSources.filter((source) => source !== 'google_play') : []
    const tags = Array.isArray(profile.tags) ? profile.tags.filter((tag) => tag !== 'pro') : []
    transaction.set(userRef, {
      plan: sources.length ? 'pro' : 'basic',
      tags: sources.length ? [...new Set([...tags, 'pro'])] : tags,
      planSources: sources,
      updatedAt: new Date()
    }, { merge: true })
    transaction.set(purchaseRef, { status: 'cancelled', updatedAt: new Date() }, { merge: true })
  })
}
