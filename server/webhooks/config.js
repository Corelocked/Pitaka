export function getWebhookConfig() {
  return {
    port: Number(process.env.WEBHOOK_PORT || 8787),
    // Set to true only in local testing when provider signature checks are not yet wired.
    allowInsecureWebhooks: String(process.env.ALLOW_INSECURE_WEBHOOKS || 'false').toLowerCase() === 'true',
    sinkMode: process.env.WEBHOOK_SINK_MODE || 'firestore',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
    paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID,
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    paypalApiBase: process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com',
    mayaSharedSecret: process.env.MAYA_WEBHOOK_SECRET,
    gcashSharedSecret: process.env.GCASH_WEBHOOK_SECRET
  }
}
