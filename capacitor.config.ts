import type { CapacitorConfig } from '@capacitor/cli';
import { APP_CONFIG } from './config/appConfig.js';
import { AD_CONFIG } from './config/adConfig.js';

const config: CapacitorConfig = {
  appId: APP_CONFIG.appId,
  appName: APP_CONFIG.appName,
  webDir: 'dist',
  plugins: {
    AdMob: {
      appId: AD_CONFIG.APP_ID,
      androidAppId: AD_CONFIG.APP_ID,
      iosAppId: AD_CONFIG.APP_ID,
      testingDevices: [],
    },
  },
};

export default config;