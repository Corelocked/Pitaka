# Pitaka Play Store release work

Updated October 27, 2026. The source redesign is implemented and locally verified. Store submission is a separate release step; a clean build and browser tests cannot establish that every device or production integration is bug-free.

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

## Choose the Android purchase experience

The current native build offers free tracking and access to an existing Pro account. It does not offer Pro checkout or direct users to PayMongo. Web checkout continues on the web.

You can validate and ship that purchase-free native experience, or implement Google Play Billing and server-side purchase verification before selling Pro inside Android. Do not re-enable external digital checkout without checking the specific programs and exceptions that apply to your release. [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en).

## Produce and validate the signed Android build

- Install/configure an Android SDK. `android/local.properties` currently points to `C:\Users\Cedric\AppData\Local\Android\Sdk`, which is absent here. The environment's `JAVA_HOME` also points to an absent Android Studio installation; Java 21 is installed separately.
- Run `npm run verify`, `npm run test:ui`, and `npm run test:rules`.
- Run `npm run build:android`, then the project's debug/release build scripts. Android asset sync succeeded here, but native compilation and release signing were not performed.
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
