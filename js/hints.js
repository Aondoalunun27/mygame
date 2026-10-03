import { canAfford, removeCoins } from './economy.js';

export const HINT_COSTS = Object.freeze({ highlight: 20, reveal: 30, auto: 50 });

export function buyHint(type) {
  const cost = HINT_COSTS[type];
  if (!cost || !canAfford(cost) || !removeCoins(cost)) return false;
  return true;
}

export function nextSolutionCell(solutionMoves, cursor = 0) {
  return solutionMoves[cursor] ?? null;
}