import test from 'node:test';
import assert from 'node:assert/strict';
import { addCoins, canAfford, getCoins, removeCoins } from '../js/economy.js';
import { getLives, consumeLife, LIFE_REGEN_MS } from '../js/lives.js';
import { getDailyLevel, getDailyStatus, completeDailyChallenge } from '../js/dailyChallenge.js';
import { resetSave, updateSave } from '../js/storage.js';
import { recordLevelCompletion } from '../js/progression.js';
import { scoreLevel } from '../js/scoring.js';
import { buyHint } from '../js/hints.js';
import { getSettings, setSetting, THEMES } from '../js/settings.js';
import { PLAYERS } from '../js/players.js';
import { LEVEL_COUNT } from '../js/constants.js';

test('coins and hints reject overspending and only award positive integer coins', () => {
  resetSave();
  assert.equal(getCoins(), 50);
  assert.equal(removeCoins(51), false);
  assert.equal(buyHint('highlight'), true);
  assert.equal(getCoins(), 30);
  addCoins(4.8);
  assert.equal(getCoins(), 34);
  assert.equal(canAfford(35), false);
  assert.equal(removeCoins(30), true);
  assert.equal(getCoins(), 4);
});

test('lives regenerate one at a time and stop at the five-life cap', () => {
  resetSave();
  const now = Date.now();
  assert.equal(consumeLife(now), true);
  assert.deepEqual(getLives(now + LIFE_REGEN_MS), { lives: 5, nextLifeAt: null });
  assert.equal(consumeLife(now + LIFE_REGEN_MS), true);
  assert.equal(getLives(now + LIFE_REGEN_MS).lives, 4);
});

test('consuming a life resets the regeneration timer from the current moment', () => {
  resetSave();
  const now = Date.now();
  updateSave((save) => ({ ...save, lives: 5, livesUpdatedAt: now - LIFE_REGEN_MS * 2 }));
  assert.equal(consumeLife(now), true);
  assert.deepEqual(getLives(now + LIFE_REGEN_MS), { lives: 5, nextLifeAt: null });
  assert.equal(getLives(now + LIFE_REGEN_MS * 2).lives, 5);
});

test('daily streaks and save metadata normalize numeric strings safely', () => {
  resetSave();
  updateSave((save) => ({ ...save, daily: { ...save.daily, streak: '4' } }));
  assert.equal(getDailyStatus().streak, 4);
});

test('daily puzzle is date-seeded and its reward can only be claimed once per date', () => {
  resetSave();
  const date = new Date(2026, 8, 28, 12);
  assert.deepEqual(getDailyLevel(date), getDailyLevel(date));
  const first = completeDailyChallenge(date);
  assert.equal(first.claimed, true);
  assert.equal(first.reward, 10);
  assert.equal(completeDailyChallenge(date).claimed, false);
  assert.equal(getDailyStatus(date).completed, true);
  assert.equal(getCoins(), 60);
});

test('replaying levels does not repeat coin rewards and cannot lower unlocked progress', () => {
  resetSave();
  recordLevelCompletion(1, 900, 2, 4);
  updateSave((save) => ({ ...save, currentLevel: 12, highestUnlocked: 12 }));
  assert.equal(recordLevelCompletion(1, 850, 1, 5), 0);
  assert.equal(recordLevelCompletion(1, 950, 3, 3), 10);
  const save = updateSave((state) => state);
  assert.equal(save.currentLevel, 12);
  assert.equal(save.highestUnlocked, 12);
  assert.equal(save.completed[1].stars, 3);
  assert.equal(getCoins(), 75);
});

test('invalid saved current level falls back to level 1', () => {
  resetSave();
  updateSave((save) => ({ ...save, currentLevel: 0 }));
  assert.equal(updateSave((save) => save).currentLevel, 1);
});

test('saved progress and completion stop at level 100', () => {
  resetSave();
  recordLevelCompletion(99, 900, 2, 20);
  assert.equal(updateSave((save) => save).currentLevel, LEVEL_COUNT);
  assert.equal(updateSave((save) => save).highestUnlocked, LEVEL_COUNT);
  updateSave((save) => ({ ...save, currentLevel: 101, highestUnlocked: 101 }));
  assert.equal(updateSave((save) => save).currentLevel, LEVEL_COUNT);
  assert.equal(updateSave((save) => save).highestUnlocked, LEVEL_COUNT);
  recordLevelCompletion(LEVEL_COUNT, 900, 2, 20);
  assert.equal(updateSave((save) => save).currentLevel, LEVEL_COUNT);
  assert.equal(updateSave((save) => save).highestUnlocked, LEVEL_COUNT);
});

test('score and star ratings never become negative', () => {
  assert.deepEqual(scoreLevel({ levelId: 1, moves: 3, par: 3, seconds: 0, hints: 0 }), { score: 1004, stars: 3 });
  assert.deepEqual(scoreLevel({ levelId: 1, moves: 100, par: 1, seconds: 9999, hints: 99 }), { score: 0, stars: 1 });
});

test('numeric strings are normalized for save values and coin operations', () => {
  resetSave();
  assert.equal(addCoins('8'), 58);
  assert.equal(canAfford('58'), true);
  assert.equal(removeCoins('8'), true);
  assert.equal(getCoins(), 50);

  updateSave((save) => ({ ...save, currentLevel: '7', highestUnlocked: '9', gamesCompleted: '4' }));
  const normalized = updateSave((save) => save);
  assert.equal(normalized.currentLevel, 7);
  assert.equal(normalized.highestUnlocked, 9);
  assert.equal(normalized.gamesCompleted, 4);
});

test('roster contains exactly 100 unique players', () => {
  const normalized = PLAYERS.map((player) => ({
    id: player.id,
    name: player.name,
    image: player.image,
  }));
  const uniqueNames = new Set(normalized.map((player) => player.name.trim()));
  const uniqueIds = new Set(normalized.map((player) => player.id.trim()));

  assert.equal(normalized.length, 100);
  assert.equal(uniqueNames.size, 100);
  assert.equal(uniqueIds.size, 100);
});

test('roster matches the uploaded player image set', () => {
  const expectedIds = new Set([
    'achraf-hakimi',
    'ademola-lookman',
    'alessandro-bastoni',
    'alexander-isak',
    'alexis-mac-allister',
    'alisson-becker',
    'alphonso-davies',
    'antoine-griezmann',
    'antonio-rudiger',
    'aurelien-tchouameni',
    'benjamin-sesko',
    'bernardo-silva',
    'bradley-barcola',
    'bruno-fernandes',
    'bruno-guimaraes',
    'bukayo-saka',
    'christiano-ronaldo',
    'cole-palmer',
    'dayot-upamecano',
    'declan-rice',
    'desire-doue',
    'dominik-szoboszlai',
    'dusan-vlahovic',
    'eder-militao',
    'ederson',
    'eduardo-amavinga',
    'emiliano-martinez',
    'endrick',
    'enzo-fernandez',
    'erling-haaland',
    'fabian-ruiz',
    'federico-valverde',
    'florian-wirtz',
    'frenkie-de-jong',
    'gabriel-magalhaes',
    'gabriel-martinelli',
    'gianluigi-donnarumma',
    'harry-kane',
    'jamal-musiala',
    'jan-oblak',
    'joao-cancelo',
    'joao-neves',
    'joao-pedro',
    'john-stones',
    'joshua-kimmich',
    'jude-bellingham',
    'jules-kounde',
    'julian-alvarez',
    'kevin-de-bruyne',
    'khvicha-kvaratskhelia',
    'kylian-mbappe',
    'lamine-yamal',
    'lautaro-martinez',
    'leroy-sane',
    'lionel-messi',
    'luis-diaz',
    'manuel-neuer',
    'marc-cucurella',
    'marcus-thuram',
    'martin-odegaard',
    'martin-zubimendi',
    'michael-olise',
    'mike-maignan',
    'mohamed-salah',
    'nico-williams',
    'nicolo-barella',
    'nicolo-zaniolo',
    'nuno-mendes',
    'ousmane-dembele',
    'pau-cubarsi',
    'pedri',
    'phil-foden',
    'rafael-leao',
    'raphinha',
    'rasmus-hojlund',
    'reece-james',
    'riyad-mahrez',
    'robert-lewandowski',
    'rodri',
    'rodrigo-mora',
    'rodrygo',
    'ronald-araujo',
    'ruben-dias',
    'sadio-mane',
    'serhou-guirassy',
    'son-heung-min',
    'theo-hernandez',
    'thibaut-courtois',
    'trent-alexander-arnold',
    'victor-boniface',
    'victor-osimhen',
    'viktor-gyokeres',
    'vinicius-junior',
    'virgil-van-dijk',
    'vitinha',
    'warren-zaire-emery',
    'william-pacho',
    'william-saliba',
    'world-cup',
    'xavi-simons',
  ]);

  assert.deepEqual(
    [...new Set(PLAYERS.map((player) => player.id))].sort(),
    [...expectedIds].sort(),
  );
});

test('theme setting persists valid choices and ignores unknown themes', () => {
  resetSave();
  assert.equal(getSettings().theme, 'classic');
  assert.equal(setSetting('theme', 'night').theme, 'night');
  assert.equal(setSetting('theme', 'unknown').theme, 'night');
  assert.deepEqual(THEMES.map(({ id }) => id), ['classic', 'stadium', 'night', 'ocean', 'sunset', 'violet']);
});

test('sound, music, vibration, and notification settings can all be changed and persisted', () => {
  resetSave();
  for (const key of ['sound', 'music', 'vibration', 'notifications']) {
    assert.equal(setSetting(key, false)[key], false);
    assert.equal(setSetting(key, true)[key], true);
  }
});