import { Capacitor } from '@capacitor/core';

export async function canRequestAds(module) {
  if (module.AD_CONFIG?.USE_TEST_ADS) return true;
  try {
    let info = await module.AdMob.requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === module.AdmobConsentStatus.REQUIRED) {
      info = await module.AdMob.showConsentForm();
    }
    return Boolean(info.canRequestAds);
  } catch {
    return false;
  }
}

export async function showPrivacyOptions() {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.showPrivacyOptionsForm();
    return true;
  } catch {
    return false;
  }
}