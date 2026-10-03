# BALLER GRID

Baller Grid is an offline-first, portrait sliding-photo puzzle built with HTML, CSS, JavaScript, Vite, and Capacitor. Slide fifteen cropped football-player photo pieces into the open space until the image matches its reference. All 100 deterministic boards are guaranteed to be solvable.

## Features

- 100 progressively harder 4×4 puzzles featuring Lionel Messi, Cristiano Ronaldo, Kylian Mbappe, and Pele.
- Fifteen photo tiles, one empty space, an always-visible reference photo, and legal adjacent sliding.
- Coins, three hint types, regenerating lives, scoring, stars, replay, and unlocked levels.
- Date-seeded daily puzzle with a local streak and once-per-day coin reward.
- Local versioned saves, settings, synthesized sound/music, vibration, and offline PWA caching.
- Optional Capacitor AdMob banners, interstitials, and completion-verified rewarded hints. Development uses Google test ads.

## Stack

- Web: vanilla ES modules, CSS, Vite 7.
- Android: Capacitor 8, Android Gradle project, Google Mobile Ads via `@capacitor-community/admob`.
- Checks: Node's built-in test runner; GitHub Actions builds debug and signed release APK artifacts.

## Project Layout

`js/` contains the game controller and gameplay services. `css/` owns the theme and responsive screens. `ads/` and `config/` isolate monetization settings. `android/` is the generated native project. `docs/` contains game, build, release, assets, and AdMob guidance. `test/` covers generator, save, economy, lives, and daily behavior.

## Run in Codespaces

Open the repository in Codespaces, then:

```sh
npm ci
npm run start
```

Open port 5173. The game runs in the browser; its core gameplay has no network dependency. The service worker caches the app after its first online visit. Capacitor APKs can be built by GitHub Actions, so installing Android Studio in Codespaces is not required.

## Test and Build

```sh
npm test
npm run build
npm run android:sync
```

With Java 21 and Android SDK 36 installed and `ANDROID_HOME` configured, build locally with `npm run android:debug`. The debug APK is `android/app/build/outputs/apk/debug/app-debug.apk`. For a reproducible cloud build, run **Build debug APK** from GitHub Actions and download the `color-grid-puzzle-debug.apk` artifact.

See [docs/BUILD.md](docs/BUILD.md) for SDK setup, browser preview, and device installation. See [docs/RELEASE.md](docs/RELEASE.md) for signing.

## AdMob

Development is test-only. The app uses Google's official Android demo App ID and banner/interstitial/rewarded test units. For production, the supplied AdMob App ID and ad-unit IDs are configured in `config/adConfig.js`; production ads stay disabled unless `VITE_ADS_LIVE=true` is set for a production Vite build. The Android manifest uses Google's demo App ID by default and switches to the production App ID when `VITE_ADS_LIVE=true` is passed to Gradle, or when `ADMOB_APP_ID` is explicitly set. Configure UMP consent and verify your app before release; never test with live ads. Read [docs/ADMOB_SETUP.md](docs/ADMOB_SETUP.md).

## Privacy and Terms

The game stores progress locally. Google AdMob may process device and advertising information when enabled. Review [PRIVACY_POLICY.md](PRIVACY_POLICY.md) and [TERMS_OF_USE.md](TERMS_OF_USE.md) before distribution; replace the contact placeholder with a monitored contact address.

## License

Player photographs are credited and licensed in [docs/ASSETS.md](docs/ASSETS.md). The project source is provided without an assigned open-source license; add a license before redistribution if required.