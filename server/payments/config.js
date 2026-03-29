export function getPaymentsConfig() {
  return {
    port: Number(process.env.PAYMENTS_PORT || 8788),
    appUrl: process.env.PAYMONGO_APP_URL || 'http://localhost:5173',
    apiBase: process.env.PAYMONGO_API_BASE || 'https://api.paymongo.com/v1',
    secretKey: process.env.PAYMONGO_SECRET_KEY || '',
    webhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET || '',
    priceAmount: Number(process.env.PITAKA_PRO_PRICE_AMOUNT || 19900),
    priceCurrency: String(process.env.PITAKA_PRO_PRICE_CURRENCY || 'PHP').toUpperCase(),
    planCode: process.env.PITAKA_PRO_PLAN_CODE || 'pitaka-pro',
    planName: process.env.PITAKA_PRO_PLAN_NAME || 'Pitaka Pro',
    planDescription: process.env.PITAKA_PRO_PLAN_DESCRIPTION || 'Unlock Pitaka Pro features and expanded currency support.',
    paymentMethodTypes: String(process.env.PAYMONGO_PAYMENT_METHOD_TYPES || 'gcash,paymaya,card')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    allowInsecureWebhooks: String(process.env.ALLOW_INSECURE_PAYMONGO_WEBHOOKS || 'false').toLowerCase() === 'true',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY
  }
}
