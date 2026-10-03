import { loadSave, resetSave, updateSave } from './storage.js';

export const THEMES = Object.freeze([
  { id: 'classic', label: 'Classic' },
  { id: 'stadium', label: 'Stadium' },
  { id: 'night', label: 'Night' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'violet', label: 'Violet' },
]);

const themeIds = new Set(THEMES.map(({ id }) => id));

export function getSettings() {
  const settings = { ...loadSave().settings };
  const theme = String(settings.theme ?? '').toLowerCase();
  if (!themeIds.has(theme)) settings.theme = 'classic';
  else settings.theme = theme;
  return settings;
}

export function setSetting(key, value) {
  if (key === 'theme') {
    const theme = String(value ?? '').toLowerCase();
    if (!themeIds.has(theme)) return getSettings();
    updateSave((save) => ({ ...save, settings: { ...save.settings, theme } }));
    return getSettings();
  }
  if (!['sound', 'music', 'vibration', 'notifications'].includes(key)) return getSettings();
  updateSave((save) => ({ ...save, settings: { ...save.settings, [key]: Boolean(value) } }));
  return getSettings();
}

export function resetProgress() {
  return resetSave();
}