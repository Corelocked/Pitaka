## iOS Setup

This repo now includes a Capacitor iOS project in `ios/`.

What is already prepared:

- `@capacitor/ios` is installed in `package.json`
- the Capacitor iOS app shell was scaffolded with `npx cap add ios`
- iOS web assets can be refreshed with:

```bash
npm run build:ios
```

- the Xcode workspace can be opened with:

```bash
npm run ios:open
```

### Current scope

The shared Pitaka app UI and business logic are already available to iOS through the Capacitor web layer.

What still needs native iOS work for feature parity with Android:

- native Google Sign-In plugin equivalent to `NativeGoogleAuth`
- iOS home screen widgets equivalent to the Android `DashboardWidgets` integration
- Apple signing, provisioning, and App Store / TestFlight setup
- Firebase iOS native configuration if native Google Sign-In is added

### Required Mac / Xcode steps

These steps must be completed on a Mac:

1. Install Xcode.
2. Open `ios/App/App.xcodeproj` or run `npm run ios:open`.
3. Set the Team and signing identity for the `App` target.
4. Confirm the bundle identifier is `com.pitaka.budgetbook` or change it if needed.
5. Build and run on a simulator/device.

### Firebase / Google Sign-In for iOS

If you want native Google Sign-In on iOS like Android, you will need to:

1. Add an iOS app in Firebase for the same project.
2. Download `GoogleService-Info.plist`.
3. Add that file to the Xcode project.
4. Configure Google Sign-In URL schemes in `Info.plist`.
5. Implement an iOS Capacitor plugin matching the JS plugin name `NativeGoogleAuth`.

Until that native plugin exists, the current app will still use the web Firebase auth flow on non-Android platforms.

### Widgets

Android widgets do not carry over directly to iOS.

For iOS widgets, you will need a separate WidgetKit extension in Xcode and a native bridge for sharing summary data from the Capacitor app to the widget extension.

### Useful commands

```bash
npm run build
npm run build:ios
npm run ios:open
npx cap sync ios
```
