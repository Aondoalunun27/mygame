import { addCoins } from './economy.js';
import { loadSave, updateSave } from './storage.js';
import { LEVEL_COUNT } from './constants.js';

export function recordLevelCompletion(levelId, score, stars, moves) {
  const save = loadSave();
  const previous = save.completed[levelId];
  let coins = previous ? 0 : 15;
  if (stars === 3 && (previous?.stars ?? 0) < 3) coins += 10;
  if (coins > 0) addCoins(coins);

  updateSave((state) => ({
    ...state,
    currentLevel: Math.min(LEVEL_COUNT, Math.max(state.currentLevel, levelId + 1)),
    highestUnlocked: Math.min(LEVEL_COUNT, Math.max(state.highestUnlocked, levelId + 1)),
    completed: {
      ...state.completed,
      [levelId]: {
        stars: Math.max(previous?.stars ?? 0, stars),
        score: Math.max(previous?.score ?? 0, score),
        bestMoves: Math.min(previous?.bestMoves ?? Infinity, moves),
      },
    },
    gamesCompleted: state.gamesCompleted + 1,
    totalScore: state.totalScore + score,
  }));
  return coins;
}