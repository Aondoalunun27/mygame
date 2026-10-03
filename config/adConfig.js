const env = import.meta.env ?? {};
const liveAdsRequested = env.PROD && env.VITE_ADS_LIVE === 'true';

export const AD_CONFIG = Object.freeze({
  USE_TEST_ADS: !liveAdsRequested,
  APP_ID: liveAdsRequested
    ? (env.VITE_ADMOB_APP_ID || 'ca-app-pub-8016464480865~7615951852')
    : 'ca-app-pub-3940256099942544~3347511713',
  BANNER_AD_ID: liveAdsRequested
    ? (env.VITE_BANNER_AD_ID || 'ca-app-pub-8016464480865565/6378806088')
    : 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL_AD_ID: liveAdsRequested
    ? (env.VITE_INTERSTITIAL_AD_ID || 'ca-app-pub-8016464480865565/1325875671')
    : 'ca-app-pub-3940256099942544/1033173712',
  REWARDED_AD_ID: liveAdsRequested
    ? (env.VITE_REWARDED_AD_ID || 'ca-app-pub-8016464480865565/9141709956')
    : 'ca-app-pub-3940256099942544/5224354917',
  BANNER_ENABLED: true,
  INTERSTITIAL_EVERY: 3,
  MIN_INTERSTITIAL_GAP_MS: 120_000,
});