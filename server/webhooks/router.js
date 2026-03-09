import { normalizePayPalEvent, verifyPayPalSignature } from './providers/paypal.js'
import { normalizeMayaEvent, verifyMayaSignature } from './providers/maya.js'
import { normalizeGCashEvent, verifyGCashSignature } from './providers/gcash.js'

const adapters = {
  paypal: {
    verify: verifyPayPalSignature,
    normalize: normalizePayPalEvent
  },
  maya: {
    verify: verifyMayaSignature,
    normalize: normalizeMayaEvent
  },
  gcash: {
    verify: verifyGCashSignature,
    normalize: normalizeGCashEvent
  }
}

export function resolveAdapter(provider) {
  return adapters[String(provider || '').toLowerCase()] || null
}
