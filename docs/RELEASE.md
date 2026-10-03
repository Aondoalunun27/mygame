# Release Builds

## Signed Android APK

Create a private upload keystore locally and store the encoded keystore and passwords as GitHub Actions encrypted secrets. Never commit the keystore or passwords.

Required secrets:

- `ANDROID_KEYSTORE_BASE64`
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

The **Build release APK** workflow decodes the keystore in the runner's temporary directory, builds `assembleRelease`, signs the APK with Android `apksigner`, and uploads `color-grid-puzzle-release.apk`. The signing file is removed when the job exits.

If those four secrets are missing, the workflow builds and uploads a debug APK instead. Debug APKs are for testing and are not suitable for Play Store release.

## Before Distribution

- Set the developer-owned AdMob app/unit variables and `VITE_ADS_LIVE=true` only after consent and test-mode verification.
- Set `ADMOB_APP_ID` for Android manifest generation.
- Replace `[Developer contact email]` in `PRIVACY_POLICY.md` with a monitored address.
- Verify the final package ID, version code, version name, orientation, privacy disclosures, and store listing.
- Install and exercise the signed APK on supported Android devices.