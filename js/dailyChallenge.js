import { generateLevel } from './levelGenerator.js';
import { addCoins } from './economy.js';
import { loadSave, updateSave } from './storage.js';

export function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyLevel(date = new Date()) {
  const dateKey = getLocalDate(date);
  return { ...generateLevel(12, `daily-${dateKey}`), dateKey };
}

export function getDailyStatus(date = new Date()) {
  const dateKey = getLocalDate(date);
  const save = loadSave();
  return { dateKey, completed: save.daily.lastCompleted === dateKey, streak: save.daily.streak };
}

export function completeDailyChallenge(date = new Date()) {
  const dateKey = getLocalDate(date);
  const status = getDailyStatus(date);
  if (status.completed) return { claimed: false, reward: 0, streak: status.streak };
  const yesterday = new Date(`${dateKey}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const consecutive = loadSave().daily.lastCompleted === getLocalDate(yesterday);
  const streak = consecutive ? status.streak + 1 : 1;
  const rewards = [10, 15, 20, 25, 30, 40, 100];
  const reward = rewards[(streak - 1) % rewards.length];
  updateSave((save) => ({ ...save, daily: { lastCompleted: dateKey, streak } }));
  addCoins(reward);
  return { claimed: true, reward, streak };
}