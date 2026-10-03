import { Capacitor } from '@capacitor/core';
import { AD_CONFIG } from '../config/adConfig.js';
import { canRequestAds } from './consent.js';

let nativeAdMob;
let initialization;
let completedLevels = 0;
let lastInterstitialAt = 0;
let bannerRequestedFor = null;
let adsUnavailable = false;
let failedBannerFor = null;

export function isNativeAdPlatform() {
  return Capacitor.isNativePlatform();
}

async function getAdMob() {
  if (!isNativeAdPlatform() || adsUnavailable) return null;
  if (!initialization) {
    initialization = import('@capacitor-community/admob').then(async (module) => {
      nativeAdMob = module.AdMob;
      await nativeAdMob.initialize({ initializeForTesting: AD_CONFIG.USE_TEST_ADS });
      if (!await canRequestAds({ ...module, AD_CONFIG })) {
        nativeAdMob = null;
        adsUnavailable = true;
        return null;
      }
      return module;
    }).catch(() => {
      nativeAdMob = null;
      adsUnavailable = true;
      return null;
    });
  }
  return initialization;
}

export async function showBanner(screen) {
  if (!AD_CONFIG.BANNER_ENABLED || !['home', 'levels', 'result'].includes(screen)) return;
  if (bannerRequestedFor === screen || failedBannerFor === screen) return;
  bannerRequestedFor = screen;
  const module = await getAdMob();
  if (!module || !nativeAdMob) {
    bannerRequestedFor = null;
    return;
  }
  if (bannerRequestedFor !== screen) return;
  document.querySelector('.app-shell')?.classList.add('app-shell--banner');
  try {
    await nativeAdMob.showBanner({
      adId: AD_CONFIG.BANNER_AD_ID,
      adSize: module.BannerAdSize.ADAPTIVE_BANNER,
      position: module.BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: AD_CONFIG.USE_TEST_ADS,
    });
    if (bannerRequestedFor !== screen) {
      await nativeAdMob.hideBanner();
      return;
    }
  } catch {
    bannerRequestedFor = null;
    document.querySelector('.app-shell')?.classList.remove('app-shell--banner');
    failedBannerFor = screen;
    // Ad availability never blocks screens or navigation.
  }
}

export async function hideBanner() {
  const hadBanner = Boolean(bannerRequestedFor);
  bannerRequestedFor = null;
  failedBannerFor = null;
  document.querySelector('.app-shell')?.classList.remove('app-shell--banner');
  try {
    if (hadBanner && nativeAdMob) await nativeAdMob.hideBanner();
  } catch {
    // Native ads are optional.
  }
}

export async function onLevelCompleted() {
  completedLevels += 1;
  if (completedLevels % AD_CONFIG.INTERSTITIAL_EVERY !== 0) return false;
  if (Date.now() - lastInterstitialAt < AD_CONFIG.MIN_INTERSTITIAL_GAP_MS) return false;
  const module = await getAdMob();
  if (!module || !nativeAdMob) return false;
  try {
    await nativeAdMob.prepareInterstitial({ adId: AD_CONFIG.INTERSTITIAL_AD_ID, isTesting: AD_CONFIG.USE_TEST_ADS });
    await nativeAdMob.showInterstitial();
    lastInterstitialAt = Date.now();
    return true;
  } catch {
    return false;
  }
}

export async function showRewardedAd() {
  const module = await getAdMob();
  if (!module || !nativeAdMob) return false;
  let earned = false;
  let listener;
  try {
    listener = await nativeAdMob.addListener(module.RewardAdPluginEvents.Rewarded, (reward) => {
      earned = Number(reward?.amount) > 0;
    });
    await nativeAdMob.prepareRewardVideoAd({ adId: AD_CONFIG.REWARDED_AD_ID, isTesting: AD_CONFIG.USE_TEST_ADS });
    const result = await nativeAdMob.showRewardVideoAd();
    return earned && Number(result?.amount) > 0;
  } catch {
    return false;
  } finally {
    await listener?.remove();
  }
}