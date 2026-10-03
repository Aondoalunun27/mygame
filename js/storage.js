import { LEVEL_COUNT } from './constants.js';

const STORAGE_KEY = 'colorGrid_save_v1';
const LEGACY_KEY = 'colorGrid_save_v0';
const memoryStore = new Map();

function coerceFiniteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function coerceInteger(value, fallback, min, max) {
  const numeric = Math.trunc(coerceFiniteNumber(value, fallback));
  return Math.min(max, Math.max(min, numeric));
}

export const DEFAULT_SAVE = Object.freeze({
  version: 1,
  currentLevel: 1,
  highestUnlocked: 1,
  coins: 50,
  lives: 5,
  livesUpdatedAt: Date.now(),
  completed: {},
  settings: { sound: true, music: false, vibration: true, notifications: false, theme: 'classic' },
  tutorialComplete: false,
  daily: { lastCompleted: '', streak: 0 },
  gamesCompleted: 0,
  totalScore: 0,
});

function browserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function readRaw(key) {
  const storage = browserStorage();
  if (storage) {
    try {
      return storage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  }
  return memoryStore.get(key) ?? null;
}

function writeRaw(key, value) {
  memoryStore.set(key, value);
  const storage = browserStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
    } catch {
      // Keep the in-memory save available for this session when storage is full.
    }
  }
}

function mergeSave(saved) {
  const safeSave = saved && typeof saved === 'object' ? saved : {};
  return {
    ...DEFAULT_SAVE,
    ...safeSave,
    version: 1,
    currentLevel: coerceInteger(safeSave.currentLevel, 1, 1, LEVEL_COUNT),
    highestUnlocked: coerceInteger(safeSave.highestUnlocked, 1, 1, LEVEL_COUNT),
    coins: coerceInteger(safeSave.coins, DEFAULT_SAVE.coins, 0, Number.MAX_SAFE_INTEGER),
    lives: coerceInteger(safeSave.lives, DEFAULT_SAVE.lives, 0, 5),
    livesUpdatedAt: coerceFiniteNumber(safeSave.livesUpdatedAt, Date.now()),
    settings: { ...DEFAULT_SAVE.settings, ...safeSave.settings },
    completed: safeSave.completed && typeof safeSave.completed === 'object' ? safeSave.completed : {},
    daily: {
      ...DEFAULT_SAVE.daily,
      ...(safeSave.daily && typeof safeSave.daily === 'object' ? safeSave.daily : {}),
      lastCompleted: typeof safeSave.daily?.lastCompleted === 'string' ? safeSave.daily.lastCompleted : DEFAULT_SAVE.daily.lastCompleted,
      streak: coerceInteger(safeSave.daily?.streak, DEFAULT_SAVE.daily.streak, 0, Number.MAX_SAFE_INTEGER),
    },
    gamesCompleted: coerceInteger(safeSave.gamesCompleted, 0, 0, Number.MAX_SAFE_INTEGER),
    totalScore: coerceInteger(safeSave.totalScore, 0, 0, Number.MAX_SAFE_INTEGER),
  };
}

export function loadSave() {
  const current = readRaw(STORAGE_KEY);
  if (current) {
    try {
      return mergeSave(JSON.parse(current));
    } catch {
      // A damaged save is kept out of the game's state and replaced safely.
    }
  }

  const legacy = readRaw(LEGACY_KEY);
  if (legacy) {
    try {
      const migrated = mergeSave(JSON.parse(legacy));
      saveGame(migrated);
      return migrated;
    } catch {
      // Fall through to a clean save if the older format is also invalid.
    }
  }

  const initial = { ...DEFAULT_SAVE, settings: { ...DEFAULT_SAVE.settings }, completed: {}, daily: { ...DEFAULT_SAVE.daily } };
  saveGame(initial);
  return initial;
}

export function saveGame(save) {
  writeRaw(STORAGE_KEY, JSON.stringify(mergeSave(save)));
}

export function updateSave(updater) {
  const current = loadSave();
  const updated = updater(current) ?? current;
  saveGame(updated);
  return loadSave();
}

export function resetSave() {
  const storage = browserStorage();
  try {
    storage?.removeItem(STORAGE_KEY);
    storage?.removeItem(LEGACY_KEY);
  } catch {
    // Reset the session copy even when the browser blocks storage access.
  }
  memoryStore.delete(STORAGE_KEY);
  return loadSave();
}