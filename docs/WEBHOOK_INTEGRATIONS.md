# Webhook Integrations: PayPal, Maya, GCash

This project now includes a lightweight webhook ingestion service at `server/webhooks/`.

## What this gives you

- One endpoint pattern for all providers: `POST /webhooks/:provider`
- Provider adapters for:
  - `paypal`
  - `maya`
  - `gcash`
- Event normalization to one shape before storage.
- Storage sink choices:
  - `log` (local testing)
  - `firestore` (writes to `externalTransactions/{provider}/events/{eventId}`)

## Important notes

- PayPal supports official webhook delivery and signature verification APIs.
- Maya supports webhook/callback integrations for payments.
- GCash integrations are partner-gated; exact signature headers/algorithms vary by program. The adapter is scaffolded and must be finalized with your approved partner docs.

## Run locally

1. Copy `server/webhooks/.env.example` values into your shell environment.
2. Start webhook server:

```bash
npm run webhooks:dev
```

3. Health check:

```bash
curl http://localhost:8787/health
```

## Test normalizers

```bash
npm run webhooks:test
```

## Sample payload post

```bash
curl -X POST http://localhost:8787/webhooks/paypal \
  -H "Content-Type: application/json" \
  -H "paypal-transmission-id: demo" \
  -H "paypal-transmission-time: 2026-03-09T00:00:00Z" \
  -H "paypal-cert-url: https://api-m.sandbox.paypal.com" \
  -H "paypal-auth-algo: SHA256withRSA" \
  -H "paypal-transmission-sig: demo" \
  -d '{"id":"WH-1","event_type":"PAYMENT.CAPTURE.COMPLETED","resource":{"id":"CAP-123","amount":{"value":"10.00","currency_code":"USD"}}}'
```

## Production hardening checklist

- Implement full cryptographic signature verification for each provider.
- Enforce provider IP allowlists where required.
- Add retries and dead-letter handling if Firestore write fails.
- Add dedupe and replay protection using `eventId` + signature timestamp checks.
- Add auth between your frontend and any internal API that reads these ingested events.
