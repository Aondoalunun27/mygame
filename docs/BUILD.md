# Build and Run

## Requirements

- Node.js 22 or newer and npm 10 or newer.
- For local Android builds: Java 21, Android SDK Platform 36, Android build-tools 36.0.0, and `ANDROID_HOME` set to the SDK directory.
- Android Studio is optional. GitHub Actions can build the APK without a local Android IDE.

## Web Development

```sh
npm ci
npm test
npm run start
```

Open `http://localhost:5173`. Vite listens on all interfaces for Codespaces port forwarding. The web app uses browser local storage and a service worker; the first web visit must load online to install the offline cache. Capacitor's packaged game assets work offline immediately.

## Production Web Bundle

```sh
npm run build
npm run preview
```

The deployable static bundle is in `dist/`.

## Android Debug APK

```sh
npm ci
npm run android:sync
npm run android:debug
```

`android:debug` builds and syncs the web bundle before invoking Gradle. The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

Install on a connected device with USB debugging enabled:

```sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Or copy the APK to the device and open it. Android may ask permission to install from that source.

## GitHub Actions

The **Build debug APK** workflow installs Node 22, Java 21, Android SDK 36, builds the web assets, syncs Capacitor, builds the debug variant, and uploads `color-grid-puzzle-debug.apk`. The build-release workflow signs a release only when signing secrets are configured; otherwise it produces a debug artifact.

## Offline Behavior

All levels, puzzle logic, saves, sound effects, music, hints, and daily puzzle generation are local. The browser service worker caches fetched app assets after the first online load. Ad requests are optional and are skipped when unavailable or offline.