import { Capacitor, registerPlugin } from '@capacitor/core'

const PlayBilling = registerPlugin('PlayBilling')
export const PITAKA_PRO_PRODUCT_ID = 'pitaka_pro_lifetime'

function getBillingApiBase() {
  return import.meta.env.VITE_BILLING_API_BASE || (Capacitor.isNativePlatform() ? 'https://pitaka-sigma.vercel.app/api' : '/api')
}

export async function getPlayProProduct() {
  return PlayBilling.getProduct({ productId: PITAKA_PRO_PRODUCT_ID })
}

async function obfuscateAccountId(uid) {
  const bytes = new TextEncoder().encode(uid)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function verifyPurchase(user, purchaseToken) {
  const response = await fetch(`${getBillingApiBase()}/billing/google-play/verify-purchase`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ purchaseToken })
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.ok) throw new Error(result.error || 'Google Play could not verify this purchase.')
  return result
}

export async function buyPitakaPro(user) {
  const { purchaseToken, state } = await PlayBilling.purchase({
    productId: PITAKA_PRO_PRODUCT_ID,
    obfuscatedAccountId: await obfuscateAccountId(user.uid)
  })
  if (state === 'cancelled') return { state }
  if (state === 'pending') return { state }
  await verifyPurchase(user, purchaseToken)
  return { state: 'purchased' }
}

export async function restorePitakaPro(user) {
  const { purchases } = await PlayBilling.restorePurchases({ productId: PITAKA_PRO_PRODUCT_ID })
  const purchased = purchases.filter((purchase) => purchase.state === 'purchased')
  for (const purchase of purchased) await verifyPurchase(user, purchase.purchaseToken)
  return { restored: purchased.length, pending: purchases.length - purchased.length }
}
