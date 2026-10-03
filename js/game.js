import { swapWithEmpty } from './levelGenerator.js';

export function createGame(level, { isDaily = false, now = Date.now() } = {}) {
  return {
    level,
    board: [...level.startingBoard],
    solutionMoves: [...level.solutionMoves],
    moves: 0,
    hints: 0,
    solutionCursor: 0,
    previewCell: null,
    previewMode: null,
    previewTarget: null,
    startedAt: now,
    pausedAt: null,
    pausedDuration: 0,
    isDaily,
    finished: false,
    status: '',
  };
}

export function isSolved(game) {
  return game.board.every((state, index) => state === game.level.target[index]);
}

export function performMove(game, index, { fromHint = false } = {}) {
  if (!game || game.finished || game.pausedAt || !Number.isInteger(index)) return false;
  const blank = game.board.indexOf(0);
  const nextBoard = swapWithEmpty(game.board, index, game.level.size);
  if (!nextBoard) return false;
  const expectedMove = game.solutionMoves[0];
  if (fromHint && index !== expectedMove) return false;
  game.board = nextBoard;
  game.moves += 1;
  game.previewCell = null;
  game.previewMode = null;
  game.previewTarget = null;
  if (fromHint || index === expectedMove) {
    game.solutionMoves.shift();
  } else {
    game.solutionMoves.unshift(blank);
  }
  game.solutionCursor = 0;
  return true;
}