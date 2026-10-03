# AdMob Setup

## Development

The default configuration always uses Google's official test IDs, including production-mode web bundles. Do not click live advertisements while testing. Rewarded hints are granted only after the native plugin emits `RewardAdPluginEvents.Rewarded` and its show call resolves with a reward amount.

The test values are:

- Android App ID: `ca-app-pub-3940256099942544~3347511713`
- Banner: `ca-app-pub-3940256099942544/6300978111`
- Interstitial: `ca-app-pub-3940256099942544/1033173712`
- Rewarded: `ca-app-pub-3940256099942544/5224354917`

`config/adConfig.js` owns ad-unit configuration. `android/app/build.gradle` defaults the native manifest resource to the demo App ID. `ads/consent.js` integrates the plugin's Google UMP consent-info and consent-form methods before production requests.

## Production Checklist

1. Create an AdMob account and register the Android package `com.bems.ballergrid`.
2. Verify the app in AdMob and create banner, interstitial, and rewarded ad units.
3. Configure UMP privacy messages and verify regional consent behavior in test mode.
4. The supplied production App ID and ad-unit IDs are already configured. Set the repository variable `VITE_ADS_LIVE=true` to enable them in a signed release workflow. Optional `VITE_ADMOB_APP_ID`, `VITE_BANNER_AD_ID`, `VITE_INTERSTITIAL_AD_ID`, `VITE_REWARDED_AD_ID`, and `ADMOB_APP_ID` values can override the configured IDs.
5. For a local production build, make `VITE_ADS_LIVE=true` available to both Vite and Gradle (or pass `-P VITE_ADS_LIVE=true` to Gradle). Gradle then places the production App ID in Android's manifest; an explicit `ADMOB_APP_ID` environment variable or Gradle property overrides it. Leave live ads off for development and test builds.
6. Remove all test-device overrides only after testing is complete; validate using test devices/demo ads first.
7. Confirm consent, ad placement, frequency, store disclosures, and the privacy policy before publishing.

The interstitial cadence is configured as once per three completed levels with a two-minute cooldown. Banners are restricted to non-gameplay screens. Ads failing to load never block play. The rewarded callback, not the ad-open event, controls bonuses. The community plugin also exposes `showPrivacyOptionsForm()` for a user's later consent choices.

The supplied production App ID and ad-unit IDs are configured in `config/adConfig.js`. Development builds continue using Google's official test IDs. The Android manifest switches to the production App ID only when `VITE_ADS_LIVE=true` is provided to the Gradle build (or when `ADMOB_APP_ID` is explicitly set). Do not enable live ads until the app is verified, UMP messages and platform disclosures are reviewed, and the app is ready for production traffic.