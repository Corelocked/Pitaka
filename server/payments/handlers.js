import { createCheckoutSession, verifyWebhookSignature } from './paymongo.js'
import { markCheckoutSessionPaid, savePendingCheckoutSession } from './firebaseAdmin.js'

export async function handleCheckoutSessionRequest(config, body = {}) {
  const { userId, email, name } = body

  if (!userId || !email) {
    return {
      status: 400,
      body: { ok: false, error: 'userId and email are required' }
    }
  }

  const successUrl = `${config.appUrl}/?view=pro&billing=success`
  const cancelUrl = `${config.appUrl}/?view=pro&billing=cancelled`

  const checkoutSession = await createCheckoutSession(config, {
    billing: {
      name: name || email,
      email
    },
    send_email_receipt: true,
    show_description: true,
    show_line_items: true,
    description: config.planDescription,
    line_items: [
      {
        currency: config.priceCurrency,
        amount: config.priceAmount,
        name: config.planName,
        description: config.planDescription,
        quantity: 1
      }
    ],
    payment_method_types: config.paymentMethodTypes,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      plan: 'pro',
      source: 'pitaka-web'
    }
  })

  await savePendingCheckoutSession(config, {
    id: checkoutSession.id,
    userId,
    email,
    name: name || '',
    plan: 'pro',
    status: 'pending',
    checkoutUrl: checkoutSession.attributes?.checkout_url || '',
    livemode: Boolean(checkoutSession.attributes?.livemode)
  })

  return {
    status: 200,
    body: {
      ok: true,
      id: checkoutSession.id,
      checkoutUrl: checkoutSession.attributes?.checkout_url || ''
    }
  }
}

export async function handlePaymongoWebhookRequest(config, { body = {}, rawBody = '', signatureHeader = '' }) {
  const eventType = body?.data?.attributes?.type || ''
  const livemode = Boolean(body?.data?.attributes?.livemode)
  const verification = verifyWebhookSignature({
    config,
    rawBody: rawBody || JSON.stringify(body || {}),
    signatureHeader,
    livemode
  })

  if (!verification.ok) {
    return {
      status: 401,
      body: { ok: false, error: verification.reason || 'Webhook verification failed' }
    }
  }

  if (eventType === 'checkout_session.payment.paid') {
    const checkoutSessionId = body?.data?.attributes?.data?.id

    if (!checkoutSessionId) {
      return {
        status: 400,
        body: { ok: false, error: 'Missing checkout session id' }
      }
    }

    await markCheckoutSessionPaid(config, checkoutSessionId, body)
  }

  return {
    status: 200,
    body: { ok: true }
  }
}
