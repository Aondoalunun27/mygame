import { loadSave, updateSave } from './storage.js';

function asFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
}

export function getCoins() {
  return Math.max(0, Math.floor(Number(loadSave().coins) || 0));
}

export function canAfford(amount) {
  const numeric = asFiniteNumber(amount);
  return Number.isFinite(numeric) && numeric >= 0 && getCoins() >= numeric;
}

export function addCoins(amount) {
  const numeric = asFiniteNumber(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) return getCoins();
  return updateSave((save) => ({ ...save, coins: save.coins + Math.floor(numeric) })).coins;
}

export function removeCoins(amount) {
  const numeric = asFiniteNumber(amount);
  if (!Number.isFinite(numeric) || numeric < 0 || !canAfford(numeric)) return false;
  updateSave((save) => ({ ...save, coins: save.coins - Math.floor(numeric) }));
  return true;
}