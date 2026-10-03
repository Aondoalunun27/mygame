import { PLAYERS } from './players.js';

const BOARD_SIZE = 4;

const randomFrom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

function seedForLevel(seedLabel) {
  let seed = 2166136261;
  for (const character of seedLabel) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619);
  return seed >>> 0;
}

function scrambleRange(id) {
  if (id <= 15) return [3, 8];
  if (id <= 29) return [9, 16];
  return [17, 30];
}

export function createSolvedBoard(size = BOARD_SIZE) {
  const tileCount = size * size;
  return Array.from({ length: tileCount }, (_, index) => index === tileCount - 1 ? 0 : index + 1);
}

export function adjacentCells(index, size = BOARD_SIZE) {
  const row = Math.floor(index / size);
  const column = index % size;
  return [
    row > 0 ? index - size : -1,
    row < size - 1 ? index + size : -1,
    column > 0 ? index - 1 : -1,
    column < size - 1 ? index + 1 : -1,
  ].filter((cell) => cell >= 0);
}

export function swapWithEmpty(board, index, size = BOARD_SIZE) {
  const emptyIndex = board.indexOf(0);
  if (!Number.isInteger(index) || index < 0 || index >= board.length || !adjacentCells(emptyIndex, size).includes(index)) return null;
  const next = [...board];
  [next[emptyIndex], next[index]] = [next[index], next[emptyIndex]];
  return next;
}

// Legal scrambles stay solvable; reversing blank positions gives a hint path.
export function generateLevel(id, seedLabel = `baller-grid-${id}`) {
  if (!Number.isInteger(id) || id < 1) throw new RangeError('Level id must be a positive integer.');
  const [minimum, maximum] = scrambleRange(id);
  const seed = seedForLevel(seedLabel);
  const random = randomFrom(seed);
  const scrambleCount = minimum + Math.floor(random() * (maximum - minimum + 1));
  const startingBoard = createSolvedBoard();
  const blankHistory = [];
  let blank = startingBoard.length - 1;
  let previousBlank = -1;

  for (let step = 0; step < scrambleCount; step += 1) {
    const candidates = adjacentCells(blank).filter((cell) => cell !== previousBlank);
    const tileCell = candidates[Math.floor(random() * candidates.length)];
    blankHistory.push(blank);
    [startingBoard[blank], startingBoard[tileCell]] = [startingBoard[tileCell], startingBoard[blank]];
    previousBlank = blank;
    blank = tileCell;
  }

  const difficulty = id <= 15 ? 'Easy' : id <= 29 ? 'Medium' : 'Hard';
  return {
    id,
    size: BOARD_SIZE,
    player: PLAYERS[(id - 1) % PLAYERS.length],
    difficulty,
    target: createSolvedBoard(),
    startingBoard,
    solutionMoves: blankHistory.reverse(),
    par: scrambleCount,
    scrambleCount,
    scrambleRange: [minimum, maximum],
  };
}