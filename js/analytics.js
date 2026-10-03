const EVENTS = new Set([
  'game_started', 'level_started', 'level_completed', 'level_failed', 'hint_used',
  'rewarded_ad_started', 'rewarded_ad_completed', 'interstitial_shown',
  'daily_challenge_started', 'daily_challenge_completed',
]);

export function trackEvent(name, detail = {}) {
  if (!EVENTS.has(name) || typeof globalThis.CustomEvent !== 'function') return false;
  globalThis.dispatchEvent(new CustomEvent('colorgrid:analytics', { detail: { name, ...detail } }));
  return true;
}