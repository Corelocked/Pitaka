const DEFAULT_BILLING_API_BASE = '/api'

function getBillingApiBase() {
  const configuredBase = import.meta.env.VITE_BILLING_API_BASE
  return configuredBase || DEFAULT_BILLING_API_BASE
}

export async function createProCheckoutSession({ userId, email, name }) {
  const response = await fetch(`${getBillingApiBase()}/billing/paymongo/checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      email,
      name
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || 'Failed to start checkout')
  }

  return data
}
