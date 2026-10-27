# Pitaka app review and reorganization

Reviewed October 27, 2026. The app is a React 19 personal finance tracker, backed by Firebase and packaged for Android/iOS with Capacitor. This review applies accessibility and layout foundations from the Apple design skill to an Android-first product; it does not impose iOS-only visual conventions.

## Product structure

The central job is to answer “where is my money, what changed this month, and what should I plan for?” Keep frequent entry actions beside the financial overview. Give planning and account controls their own destinations.

| Destination | Responsibilities |
| --- | --- |
| Home | Current account balance; monthly income, expenses, and net cash flow; savings; recent activity |
| Activity | Combined timeline, search, account/type filters, edit/delete, progressive transaction details |
| Accounts | Account balances, types, starting balances, and credit information |
| Plan | Budgets and categories, savings goals, bills, recurring income, investments |
| More | Account deletion, support, privacy, backups, import/export, appearance preferences |

Savings and investment destinations are separate. Finance screens expose expense, income, and transfer actions; settings and planning screens show actions relevant to their task. The desktop sidebar and mobile bar use the same navigation definition and active-parent mapping.

## Findings addressed

| Priority | Finding | Change |
| --- | --- | --- |
| Critical | Owners could assign themselves Pro through profile writes. | New profiles must be Basic; client updates cannot modify entitlements or the deletion lock. Billing remains an Admin operation. |
| High | Regular account creation sent nullable credit properties that rules rejected. | Only optional credit fields accept null. Money amounts still reject null, strings, and negative values. |
| High | Budgets submitted amount strings and combined currencies. | Numeric budget writes, explicit budget currency, and spending matched to that currency. |
| High | Forms could clear input or report success before writes finished. | Await writes, preserve failed entries, show errors, and disable repeated submissions. |
| High | Split expenses used separate writes and floating-point subtraction. | One database batch and cent-based splitting. |
| High | Current balances could overwrite historical net worth while browsing months. | Wait for subscribed data, skip incomplete/offline/pending states, and write only the current calendar month's snapshot. |
| High | Snapshot acknowledgements triggered repeated saves and a flashing sync banner. | Skip unchanged snapshots and show sync status outside normal layout flow. Browser fixtures reproduce pending-write acknowledgements and check that balances stay stationary. |
| High | Account deletion was absent. | Identity confirmation, a dedicated public route, authenticated server deletion, and a write lock while deletion proceeds. |
| High | Android exposed external digital upgrade checkout. | Native Pro screen has no checkout or purchase link. Web checkout remains on the web. |
| High | Dialog keyboard focus could escape; closed forms remained in the DOM. | Focus containment/restoration, background inertness for sheets, body scroll locking, Escape, and conditional mounting. |
| High | Loading listener failures could resemble empty finances. | Track initial subscription readiness, display load failures, and show cached/pending sync states. |
| Medium | Direct links could reset to Home on refresh; privacy lacked a route alias. | Initialize from the route, map privacy, and preserve browser navigation history. |
| Medium | A desktop pointer could hide bottom navigation on a narrow screen. | Navigation changes with viewport width. |
| Medium | A new entry could reopen a previous edit. | Clear editing state for new-entry actions. |
| Medium | Inline account edits had a no-op save; tables offered nonfunctional Undo. | Use the working edit form; only offer Undo when a handler exists. |
| Medium | Removing accounts could leave transaction references behind. | Block removal while linked records remain, and surface failures. |
| Medium | Long dashboards, duplicated desktop/mobile widget markup, and retired CSS complicated maintenance. | Focused screen components, one responsive overview grid, and removal of retired dashboard selectors. |
| Medium | Older screens retained different spacing, buttons, headings, and dialog colors. | Shared layout and control styles, theme-aware dialogs, compact summaries, and consistent investment and savings surfaces. |
| Medium | Some deletions asked for confirmation twice. | Keep the table's confirmation and pass the deletion handler directly. |
| Medium | Phone lists hid balances and recurring amounts behind an expansion. | Show the relevant amount in the collapsed row and retain the other details on expansion. |
| Medium | Budgets followed category maintenance; settings mixed frequent and occasional tasks. | Put monthly budgets first, separate category management, and group profile, appearance, support, and backup tools. |
| Medium | Expense entry and account setup exposed optional fields before the main task was complete. | Disclose notes/tags/splits and account colors, keep save actions within reach, and acknowledge successful saves. |
| Medium | Reporting months required repeated arrow clicks and subpages lacked an obvious return path. | Direct month selection, a current-month shortcut, parent navigation, and heading focus/scroll reset on navigation. |
| Medium | Sign-in fields inherited nearly invisible light-mode colors. | Theme-aware fields and buttons, password visibility controls, and a focused phone sign-in screen. |
| Medium | Password recovery and form label associations were missing. | Reset-email flow and explicit control labels. |
| Medium | Cached native financial state could enter Android system backups. | Disable Android application backup; cloud finance sync and user-requested exports remain available. |

## Visual system

Retain Pitaka's teal identity and the woven-wallet motif on the balance panel. The user's preferred direction is borderless: open sections, clear currency amounts, and contextual actions replace repeated card containers. This is a personal ledger, so the largest emphasis belongs to actual balances rather than decorative illustrations or technical sync details.

Measured text contrast against the card surface:

| Role | Light | Contrast | Dark | Contrast |
| --- | --- | --- | --- | --- |
| Card surface | `#ffffff` | — | `#121c26` | — |
| Primary text | `#102a43` | 14.64:1 | `#f3f7fa` | 15.98:1 |
| Secondary text | `#526579` | 6.01:1 | `#b4c1cc` | 9.38:1 |
| Accent | `#0b6673` | 6.64:1 | `#6ed3cf` | 9.74:1 |
| Income | `#18794e` | 5.41:1 | `#67ce98` | 8.90:1 |
| Expense signal | `#b53b35` | 5.77:1 | `#ff9188` | 7.92:1 |

The balance card's secondary text `#d8eef0` on `#07515c` measures 7.44:1. These are token-pair measurements, not a claim that every inherited component has had an independent contrast audit.

Use the system font for controls and data, tabular numerals for amounts, approximately 16px body text, 12–14px supporting labels, and 32–52px balance text. New financial controls target 48 CSS pixels; keyboard focus stays visible. Color is reinforced with labels, signs, and icons. Reduced motion is honored.

`FinanceWorkspace.css` defines the shared content width, spacing, control dimensions, and typography. Page headers and content align across destinations. Content sections, planning tools, goals, preference rows, and summary groups have transparent backgrounds and no enclosing borders or shadows. Forms and confirmation dialogs retain distinct surfaces and the shared light/dark tokens. Debt planning lives with Accounts, while Home owns the monthly snapshot.

Task hierarchy now distinguishes the most frequent planning tools (budgets and goals) from recurring payments and investments. Home, Activity, Accounts, and Investments use the same borderless summary typography and spacing. Phone lists expose amounts without a tap, and single-page tables omit inactive pagination arrows. Activity keeps filter reset beside matching results. Account terminology, save states, and feedback are consistent across forms. The existing teal balance panel and woven motif remain the visual anchor.

Tables use plain rows with subtle horizontal separators, right-aligned amounts and headings, and quiet text actions with 48px hit targets. Expanded mobile details use open label-and-value rows instead of nested tiles, and stack naturally with enlarged text. The fixed action column, vertical divider, zebra fills, duplicate top count, and oversized full-width search have been removed. Empty account descriptions display a dash while exports preserve the original empty value.

`SettingsPreferences.jsx` replaces the wide preference tiles with aligned rows: a native radio group for theme, a Home layout selector, and labeled switches for privacy and notifications. Explanations are shorter, diagnostics has a separate action, and the page identifies preferences as device-local. Notification permission requests disable the switch while pending; blocked, unavailable, dismissed, and failed requests have explicit feedback. Turning alerts off does not request permission.

```text
Phone                         Desktop
Title                         Sidebar | Title + month
Month picker row
Expense / Income / Transfer           | Contextual actions
Current account balance               | Current account balance
Monthly metrics (2 × 2)               | Monthly metrics (4 columns)
Activity                              | Activity       Spending
Spending                              | Accounts       Goals
Accounts / Goals
Home Activity Accounts Plan More
```

On narrow phones, the reporting period sits below the full-width title. Summary metrics retain two columns at normal text sizes, with a compact transaction count in Activity; larger text can stack naturally. Quick-action icons keep their size. Navigation uses an opaque bottom bar that stays in the document flow and reserves its own height, so the last content can scroll fully above it. Sheet headers and save actions remain reachable in short viewports.

Keyboard handling opts into Chrome’s content-resize behavior and uses visible viewport height/offset to size sheets and reveal the focused field. Chrome documents the [viewport resize options](https://developer.chrome.com/blog/viewport-resize-behavior/); Android documents [keyboard-driven visual viewport resizing in WebView](https://developer.android.com/develop/ui/views/layout/webapps/understand-window-insets). Browser simulations verify both layout-viewport resizing and visual-viewport-only resizing. Actual device keyboard and system-inset behavior remain unverified.

The reference behind scalable text is `accessibility.md › Vision`: “Support larger text sizes.” The navigation principle comes from `tab-bars.md › Best practices`: “Use a tab bar to support navigation, not to provide actions.” The 48px touch target follows the skill's Android translation. The choice of the woven balance surface and quieter surrounding panels is design judgment.

## Verification

- `npm run verify`: lint, finance/CSV/error-reporting tests, deletion batching/failure checks, webhook normalizers, and production build.
- `npm run test:ui`: 48 browser checks across phone and desktop, with intercepted authentication/database boundaries. Covers account, transfer, goal and budget writes; search and filtering; failed saves; edit reset; focus; route refresh; dark mode; 320px width and enlarged text; all finance destinations; public deletion entry; simulated Android Back/checkout behavior; currency isolation in native widget snapshots; stable layout during snapshot synchronization; shared control styles and alignment in both themes; account deletion with one confirmation; direct month selection; collapsed-row balances; budget editing focus; settings disclosure/theme controls; saved split details; save feedback; sign-in field colors/password visibility; consistent table rows/actions, sorting, filtering, and keyboard editing with nine sample accounts; persisted settings, keyboard radio/switch interaction, diagnostics download, and simulated notification permission outcomes. Native notification delivery has not been verified on a physical device.
- Mobile regression checks cover 320px, 360px, and 412px widths, negative cash flow, icon sizes, navigation clearance, 200% text, landscape, short forms, and visual-viewport-only keyboard resizing.
- Additional visual inspection checked populated finance screens at 320px with 200% text, plus phone/light and desktop/dark preview captures. No horizontal document overflow was observed in those finance views.
- The shared design checks also inspect visible content containers for transparent backgrounds, zero border widths, and no shadows across finance, support, privacy, Pro, Android access, and account deletion pages in both themes. Summary values must have matching typography across destinations.
- `npm run test:rules`: isolated Firestore emulator checks against `demo-pitaka-review`. Covers ownership, entitlement escalation, nullable wallet fields, money validation, and deletion locking.
- `npm audit`: zero reported vulnerabilities after compatible updates and targeted overrides. `@grpc/grpc-js` stays on its patched 1.x line; `uuid` uses the patched CJS-compatible 11.x line for existing server consumers. Browser builds do not bundle the server gRPC path.
- Capacitor Android asset/plugin sync completed. No signed APK/AAB or real-device testing was completed: the configured Android SDK is missing from this environment.

UI fixtures contain invented balances and cannot send writes to the live Firebase account. They do not prove production authentication, payment processing, deletion deployment, or real WebView behavior. See [release work](PLAY_STORE_RELEASE.md) before submission.

## Preview captures

These screenshots use invented test records, not a live account.

- [Phone overview](previews/home-phone.png)
- [Phone activity](previews/activity-phone.png)
- [Desktop overview](previews/home-desktop.png)
- [Accounts in dark mode](previews/accounts-desktop-dark.png)
- [Nine-account table in dark mode](previews/accounts-table-desktop-dark.png)
- [Expanded mobile accounts in dark mode](previews/accounts-expanded-phone-dark.png)
- [Savings in dark mode](previews/wealth-desktop-dark.png)
- [Investments in dark mode](previews/investments-desktop-dark.png)
- [Settings in dark mode](previews/settings-desktop-dark.png)
- [Plan in dark mode](previews/plan-desktop-dark.png)
- [Phone accounts](previews/accounts-phone.png)
- [Phone settings](previews/settings-phone.png)
- [Expanded desktop preferences](previews/preferences-desktop-dark.png)
- [Expanded phone preferences](previews/preferences-phone.png)
- [Phone expense entry](previews/expense-phone.png)
- [Phone sign-in](previews/signin-phone.png)
- [Phone sign-in in dark mode](previews/signin-phone-dark.png)

- [350px mobile Home](previews/mobile-dashboard-350-dark.png)
- [350px mobile Activity](previews/mobile-transactions-350-dark.png)
- [350px mobile More](previews/mobile-settings-350-dark.png)
- [Short-viewport expense form](previews/mobile-expense-short.png)
