import { generateLevel } from './levelGenerator.js';
import { LEVEL_COUNT } from './constants.js';

export const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, index) => generateLevel(index + 1));

export function getLevel(id) {
  if (!Number.isInteger(id) || id < 1) return null;
  return LEVELS[id - 1] ?? null;
}

export function getLevelBand(id) {
  if (id <= 15) return 'Easy';
  if (id <= 29) return 'Medium';
  return 'Hard';
}