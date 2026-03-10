# Budget Book

Budget Book is a personal finance tracker built with React, Vite, and Firebase. The current primary UI is the mobile-first "Pitaka" experience in `src/ModernApp.jsx`, backed by Firestore for realtime data sync and Firebase Authentication for user access.

The repository also includes a small Express-based webhook ingestion service for external payment events from PayPal, Maya, and GCash.

## What the app does

- Tracks income and expenses per authenticated user.
- Organizes funds across wallets/accounts.
- Supports wallet-to-wallet transfers.
- Tracks investment holdings and basic performance values.
- Manages expense categories.
- Exports and imports data through an Excel-compatible CSV workflow.
- Shows dashboard summaries for balances, income, expenses, recent activity, and category breakdowns.

## Tech stack

- React 19
- Vite via `rolldown-vite`
- Firebase Auth
- Cloud Firestore
- Express 5 for webhook ingestion
- ESLint 9

## Repository layout

```text
src/
	ModernApp.jsx               Primary application shell
	firebase.js                 Firebase web app initialization
	contexts/                   Auth and confirmation providers
	hooks/useBudget.js          Main budget state and CRUD orchestration
	services/firebaseService.js Firestore CRUD subscriptions and writes
	components/                 Forms, tables, dashboard, auth UI
	utils/excelUtils.js         CSV import/export helpers

server/webhooks/
	index.js                    Express webhook server entry point
	config.js                   Environment-driven webhook config
	router.js                   Provider adapter resolution
	sink.js                     Log or Firestore persistence sink
	providers/                  PayPal, Maya, GCash verification + normalization
	test-normalizers.mjs        Normalization smoke tests
	.env.example                Example webhook environment variables

docs/
	WEBHOOK_INTEGRATIONS.md     Integration notes and production hardening checklist

FIREBASE_SETUP.md             Firebase setup notes
firebase.json                 Firebase Hosting + Firestore config
firestore.rules               Firestore access rules
firestore.indexes.json        Firestore composite indexes
```

## Getting started

### Prerequisites

- Node.js 20 or newer is recommended.
- An npm-compatible environment.
- A Firebase project with Firestore and Authentication enabled.

### Install dependencies

```bash
npm install
```

### Run the frontend

```bash
npm run dev
```

The Vite dev server will start locally and serve the React app.

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

### Lint the project

```bash
npm run lint
```

## Available scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run webhooks:dev
npm run webhooks:test
```

## Frontend architecture

### App entry

- `src/main.jsx` bootstraps the app.
- `FirebaseProvider` exposes auth state and auth actions.
- `ConfirmProvider` exposes confirmation dialogs used by destructive actions.
- `ModernApp.jsx` renders the current application shell.

### Core state flow

`src/hooks/useBudget.js` is the central orchestration layer. It:

- Subscribes to Firestore collections in realtime.
- Computes filtered monthly data and summary values.
- Exposes CRUD operations for incomes, expenses, savings, wallets, categories, transfers, lendings, and investments.
- Applies some domain behavior, such as adjusting wallet starting balances when lendings are created, updated, or deleted.

### Firestore collections in use

- `incomes`
- `expenses`
- `savings`
- `categories`
- `wallets`
- `lendings`
- `transfers`
- `investments`

Each document is scoped by `userId`, and the checked-in Firestore rules enforce owner-only access for those collections.

### Current UI surface

The main navigation currently exposes these views:

- Dashboard
- Transactions
- Accounts
- Categories
- Investments
- Settings and import/export tools

There are additional components and data services in the repo for savings and lendings, but they are not part of the main `ModernApp.jsx` navigation at the moment.

## Firebase setup

The app uses Firebase in two different ways:

### Client-side Firebase

The React app initializes Firebase in `src/firebase.js` for:

- Authentication
- Firestore
- Analytics

At the moment, the Firebase web config is committed directly in `src/firebase.js` rather than loaded from environment variables. That works for local development, but if you want cleaner environment separation, move those values into Vite environment variables later.

### Firebase project configuration files

This repo already contains:

- `firebase.json` for Hosting and Firestore configuration
- `firestore.rules` for document access rules
- `firestore.indexes.json` for composite indexes

See `FIREBASE_SETUP.md` for the existing Firebase setup notes.

### Authentication expectations

The current auth provider supports:

- Email/password login
- Email/password signup
- Google sign-in popup

Authentication state is managed in `src/contexts/FirebaseContext.jsx`.

## Webhook ingestion service

The backend under `server/webhooks/` is a separate lightweight Express server for normalizing external payment events.

### Supported providers

- PayPal
- Maya
- GCash

### Endpoints

- `GET /health`
- `POST /webhooks/:provider`

### Webhook behavior

For each request, the service:

1. Captures the raw request body.
2. Resolves the provider adapter.
3. Verifies the provider signature or shared secret.
4. Normalizes the payload into one event shape.
5. Writes the event either to logs or to Firestore.

### Webhook environment setup

Copy the values from `server/webhooks/.env.example` into your environment before starting the webhook server.

Relevant variables include:

- `WEBHOOK_PORT`
- `ALLOW_INSECURE_WEBHOOKS`
- `WEBHOOK_SINK_MODE`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_API_BASE`
- `MAYA_WEBHOOK_SECRET`
- `GCASH_WEBHOOK_SECRET`

### Run the webhook server

```bash
npm run webhooks:dev
```

### Run webhook normalizer tests

```bash
npm run webhooks:test
```

### Webhook sink modes

- `log`: prints normalized events to stdout for local testing
- `firestore`: writes to `externalTransactions/{provider}/events/{eventId}` using Firebase Admin credentials

See `docs/WEBHOOK_INTEGRATIONS.md` for integration notes and the production hardening checklist.

## Import and export workflow

The Settings view exposes three data tools:

- Export all current data to an Excel-compatible CSV file
- Import CSV data into accounts, categories, incomes, expenses, transfers, and investments
- Download a CSV import template

The implementation lives in `src/utils/excelUtils.js`.

## Deployment notes

The repository is already configured for Firebase Hosting:

- Hosting output directory: `dist`
- SPA rewrite target: `index.html`
- Firestore region in config: `asia-southeast1`

Typical deployment flow:

```bash
npm run build
firebase deploy
```

This assumes the Firebase CLI is installed and authenticated in your environment.

## Known gaps and caveats

- The frontend Firebase config is currently hardcoded in `src/firebase.js`.
- The webhook docs mention local environment setup, but provider verification for real production traffic should still be reviewed carefully before relying on it.
- GCash support is scaffolded and depends on the exact partner-approved webhook requirements.
- Some legacy or partially wired components remain in the repo alongside the current `ModernApp.jsx` flow.

## Useful files to read next

- `src/ModernApp.jsx`
- `src/hooks/useBudget.js`
- `src/services/firebaseService.js`
- `src/contexts/FirebaseContext.jsx`
- `server/webhooks/index.js`
- `docs/WEBHOOK_INTEGRATIONS.md`
- `FIREBASE_SETUP.md`
