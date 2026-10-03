import { loadSave, updateSave } from './storage.js';

export const MAX_LIVES = 5;
export const LIFE_REGEN_MS = 30 * 60 * 1000;

export function getLives(now = Date.now()) {
  const save = loadSave();
  const lives = Math.min(MAX_LIVES, Math.max(0, Number(save.lives) || 0));
  if (lives >= MAX_LIVES) return { lives: MAX_LIVES, nextLifeAt: null };
  const elapsed = Math.max(0, now - (Number(save.livesUpdatedAt) || now));
  const gained = Math.floor(elapsed / LIFE_REGEN_MS);
  const currentLives = Math.min(MAX_LIVES, lives + gained);
  const livesUpdatedAt = currentLives === MAX_LIVES
    ? now
    : (Number(save.livesUpdatedAt) || now) + gained * LIFE_REGEN_MS;
  if (currentLives !== save.lives || livesUpdatedAt !== save.livesUpdatedAt) {
    updateSave((state) => ({ ...state, lives: currentLives, livesUpdatedAt }));
  }
  return {
    lives: currentLives,
    nextLifeAt: currentLives < MAX_LIVES ? livesUpdatedAt + LIFE_REGEN_MS : null,
  };
}

export function consumeLife(now = Date.now()) {
  const current = getLives(now);
  if (current.lives <= 0) return false;
  updateSave((save) => ({
    ...save,
    lives: current.lives - 1,
    livesUpdatedAt: now,
  }));
  return true;
}

export function awardLife() {
  const current = getLives();
  if (current.lives >= MAX_LIVES) return false;
  updateSave((save) => ({ ...save, lives: current.lives + 1, livesUpdatedAt: Date.now() }));
  return true;
}