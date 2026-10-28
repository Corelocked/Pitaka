# Pitaka Play Store release work

Updated October 28, 2026. ESLint and the production web build pass. Native Android compilation and a Play Billing transaction still require a working Android SDK, signing setup, and Play Console configuration.

## Deploy the security and deletion changes together

1. Deploy the updated `firestore.rules`. The entitlement fix is ineffective until those rules are live.
2. Deploy `api/account/delete.js` to the existing Vercel backend with Firebase Admin credentials, using the same project as the app. It derives the account exclusively from a verified Firebase token and requires authentication within five minutes.
3. Set frontend `VITE_ACCOUNT_API_BASE` to the deployed API root, including `/api` on Vercel. `VITE_BILLING_API_BASE` remains a fallback. Native builds otherwise use the repository's existing Pitaka Vercel domain. Firebase Hosting serves static files and does not host this new API automatically.
4. Set backend `PITAKA_ACCOUNT_ALLOWED_ORIGINS` to any additional frontend origins, separated by commas. The handler already supports Android `https://localhost`, iOS `capacitor://localhost`, and the configured `PAYMONGO_APP_URL`.
5. Verify `/delete-account` on the actual public site, and test deletion with a disposable account on the deployed backend. Verify email/password and native Google reauthentication separately. No live account was deleted during this work.
6. Review large-account deletion against the host's execution limit. Records are removed in batches of 400. Interrupted deletion locks new writes and can be retried while the identity remains. Move this work to a durable job if expected account sizes can outlast the request timeout. Monitor failed final identity/profile cleanup operationally.

The local payments server also serves `POST /account/delete`, using the same handler. Configure the frontend API base to that server for local integration testing.

The deletion flow removes owned finance documents (including legacy lendings), Pitaka billing sessions, the Firebase sign-in, and the cloud profile. It clears this device's per-user summary and display-preference entries. Downloaded exports, other devices' local files, and payment providers' independent retention are outside this deletion operation. Review provider retention and account-support procedures before finalizing the published privacy policy.

Google requires an in-app deletion entry and an external web resource for apps with account creation. Put the deployed deletion URL in Play Console's data-deletion field. [Google's account-deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en-EN).

## Configure Pro purchases

Android Pro purchases use a Google Play one-time in-app product. The app displays the localized price returned by Play and sends the purchase token to the backend; Firebase account access is granted only after the backend verifies the purchase with the Google Play Developer API. The website continues to use PayMongo, with a default one-time price of PHP 500.

Before offering purchases to testers or users:

1. Build a signed Android App Bundle that includes `com.android.vending.BILLING`, then upload it to an internal or closed testing track. Play Console requires an uploaded build with this permission before it allows product setup.
2. In Play Console, create and activate the one-time product `pitaka_pro_lifetime` for `com.pitaka.budgetbook`. Set the US price to USD 10.00 and the Philippines price to PHP 500.00; add or review other country prices as desired. The app does not hard-code the Android price.
3. Create a Google Cloud service account, enable the Google Play Android Developer API, and grant the account the Play Console permissions needed to view and acknowledge orders. Set Vercel's server-side `GOOGLE_PLAY_SERVICE_ACCOUNT` to its JSON credentials. Never add this key to a `VITE_` variable or the app bundle.
4. Set Vercel `GOOGLE_PLAY_PACKAGE_NAME=com.pitaka.budgetbook` and `GOOGLE_PLAY_PRO_PRODUCT_ID=pitaka_pro_lifetime`.
5. Configure Play Console real-time developer notifications to a Pub/Sub topic and an authenticated push subscription targeting `https://pitaka-sigma.vercel.app/api/billing/google-play/notifications`. Set `GOOGLE_PLAY_PUBSUB_AUDIENCE` to that endpoint URL and `GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT` to the email of the OIDC token service account. Grant Pub/Sub permission to push as that account. This endpoint removes the Play entitlement for canceled pending purchases and full voided/refunded one-time purchases.
6. Deploy the Vercel API and current Firestore rules. Verify the app can load the product price, complete a Play license-test purchase, restore a purchase, and process a test notification before production. Use Play license testers; don't make a live purchase for validation.

For the website, set `VITE_PITAKA_PRO_PRICE_AMOUNT=50000`, `VITE_PITAKA_PRO_PRICE_CURRENCY=PHP`, `PITAKA_PRO_PRICE_AMOUNT=50000`, and `PITAKA_PRO_PRICE_CURRENCY=PHP` in the appropriate frontend/backend environments. PayMongo still needs valid production credentials and webhook configuration. Google's billing guidance requires digital purchases in Play-distributed apps to use Play Billing unless an applicable program or exception permits otherwise: [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en), [one-time purchase lifecycle](https://developer.android.com/google/play/billing/lifecycle/one-time), and [real-time developer notifications](https://developer.android.com/google/play/billing/rtdn-reference).

## Produce and validate the signed Android build

- Install/configure an Android SDK. `android/local.properties` currently points to `C:\Users\Cedric\AppData\Local\Android\Sdk`; `JAVA_HOME` must point to an installed JDK compatible with the Android Gradle Plugin.
- Run `npm run lint` and `npm run build`.
- Run `npm run build:android`, then the project's debug/release build scripts. Native compilation and release signing were not performed here.
- Verify the configured app ID, release certificate, Google OAuth client, Firebase release SHA fingerprints, privacy URLs, and a version code greater than any uploaded version. Do not change the release key merely to resolve a local build issue.
- Test the signed build on real Android hardware with gesture and button navigation, a display cutout, the software keyboard, rotation, large system text, dark mode, and TalkBack.
- Test cold launch, Google/email sign-in, password recovery, offline writes/reconnection, month changes, edit/delete, account transfers, savings funding, recurring posting, import/export and backup downloads, and deletion with a disposable account.
- Confirm export files are actually saved/shared from the target WebView. A browser download test does not prove this native behavior.
- Check background privacy and home-screen widgets on the device. Browser blurring cannot guarantee every OEM's app-switcher snapshot behavior.

## Complete the Play Console listing

Provide the publisher's actual identity/contact details and a reviewed public privacy policy. Reconcile Data safety answers with Firebase Auth/Firestore/Analytics, Vercel analytics and speed insights, EmailJS contact messages, PayMongo web billing, and any production logging actually enabled. Supply the app-access instructions, screenshots of the final signed build, and the declarations that Play Console requests for this app.

No deployment, live billing transaction, release signing, Play Console upload, or production-data deletion was performed by this change.

## Reproduce local tests

```powershell
npm install
npx playwright install chromium
npm run verify
npm run test:ui

# Requires the Firebase CLI and Java 21. The demo project cannot reach live data.
$env:FIREBASE_EMULATORS_PATH = Join-Path (Get-Location) '.cache/firebase-emulators'
npm run test:rules
```

If Chromium is already installed elsewhere, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to that executable. This review used the installed Chromium 1234 executable through that setting. The security test emulator uses its own `firebase.test.json` and never deploys rules.
