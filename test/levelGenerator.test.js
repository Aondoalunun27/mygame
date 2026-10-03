import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYERS } from '../js/players.js';
import { LEVELS, getLevel } from '../js/levels.js';
import { LEVEL_COUNT } from '../js/constants.js';
import { createSolvedBoard, generateLevel, adjacentCells } from '../js/levelGenerator.js';
import { createGame, isSolved, performMove } from '../js/game.js';

test('the 100 generated levels are valid, solvable, and use the requested difficulty bands', () => {
  assert.equal(LEVELS.length, LEVEL_COUNT);
  assert.equal(LEVELS.length, 100);
  assert.equal(getLevel(101), null);
  assert.equal(getLevel(0), null);
  assert.equal(LEVELS[0].difficulty, 'Easy');
  assert.equal(LEVELS[14].difficulty, 'Easy');
  assert.equal(LEVELS[15].difficulty, 'Medium');
  assert.equal(LEVELS[28].difficulty, 'Medium');
  assert.equal(LEVELS[29].difficulty, 'Hard');
  assert.equal(LEVELS[99].difficulty, 'Hard');

  for (const level of LEVELS) {
    assert.equal(level.startingBoard.length, level.size ** 2);
    assert.equal(level.startingBoard.filter((tile) => tile === 0).length, 1);
    assert.deepEqual(
      [...level.startingBoard].sort((left, right) => left - right),
      Array.from({ length: level.size ** 2 }, (_, index) => index),
    );
    const game = createGame(level);
    for (const move of level.solutionMoves) {
      assert.ok(adjacentCells(game.board.indexOf(0), level.size).includes(move), `level ${level.id} legal solution move`);
      assert.equal(performMove(game, move, { fromHint: true }), true);
    }
    assert.deepEqual(game.board, level.target, `level ${level.id} solution`);
    assert.equal(isSolved(game), true);
    assert.equal(level.startingBoard.some((tile, index) => tile !== level.target[index]), true);
  }
});

test('level generation is deterministic and supports extension', () => {
  assert.deepEqual(generateLevel(37), generateLevel(37));
  assert.equal(getLevel(LEVEL_COUNT + 1), null);
  assert.equal(getLevel(0), null);
});

test('all 100 levels each feature a different player', () => {
  assert.equal(PLAYERS.length, 100);
  assert.equal(new Set(LEVELS.map((level) => level.player.id)).size, LEVEL_COUNT);
  assert.deepEqual(LEVELS.map((level) => level.player.id), PLAYERS.map((player) => player.id));
});

test('only tiles adjacent to the empty space can move', () => {
  const level = generateLevel(1);
  const game = createGame(level);
  const blank = game.board.indexOf(0);
  const legal = adjacentCells(blank, level.size)[0];
  const before = [...game.board];
  assert.equal(performMove(game, legal), true);
  assert.equal(game.board[blank], before[legal]);
  assert.equal(game.board[legal], 0);
  assert.equal(game.moves, 1);
  const afterMove = [...game.board];
  const illegal = Array.from({ length: game.board.length }, (_, index) => index)
    .find((index) => index !== 0 && !adjacentCells(game.board.indexOf(0), level.size).includes(index));
  assert.equal(performMove(game, illegal), false);
  assert.deepEqual(game.board, afterMove);
});

test('automatic hints and the remaining stored solution finish a sliding board', () => {
  const level = generateLevel(32);
  const game = createGame(level);
  while (game.solutionMoves.length > 0) {
    const next = game.solutionMoves[0];
    assert.equal(performMove(game, next, { fromHint: true }), true);
  }
  assert.equal(isSolved(game), true);
});