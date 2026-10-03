import { getLevel, getLevelBand } from './levels.js';
import { LEVEL_COUNT } from './constants.js';
import { createGame, isSolved, performMove } from './game.js';
import { loadSave, updateSave } from './storage.js';
import { getCoins } from './economy.js';
import { consumeLife, getLives } from './lives.js';
import { buyHint, nextSolutionCell } from './hints.js';
import { completeDailyChallenge, getDailyLevel, getDailyStatus } from './dailyChallenge.js';
import { getSettings, resetProgress, setSetting, THEMES } from './settings.js';
import { playSound, setMusicEnabled, vibrate } from './audio.js';
import { hideBanner, isNativeAdPlatform, onLevelCompleted, showBanner, showRewardedAd } from '../ads/service.js';
import { showPrivacyOptions } from '../ads/consent.js';
import { setDailyReminder } from './notifications.js';
import { scoreLevel } from './scoring.js';
import { recordLevelCompletion } from './progression.js';
import { trackEvent } from './analytics.js';
import PRIVACY_POLICY from '../PRIVACY_POLICY.md?raw';
import TERMS_OF_USE from '../TERMS_OF_USE.md?raw';

const root = document.querySelector('#app');
const app = { screen: 'splash', overlay: null, game: null, toastTimer: null, clockTimer: null, continuing: false };

function logo(markClass = '') {
  return `<div class="logo-lockup"><img class="logo-ball ${markClass}" src="/assets/icons/football.svg" alt="" aria-hidden="true" /><span class="logo-word">BALLER GRID<small>SLIDE INTO THE LEGEND</small></span></div>`;
}

function pieceImageStyle(tile, player) {
  const position = tile - 1;
  const column = position % 4;
  const row = Math.floor(position / 4);
  return `--piece-x:${column * 100 / 3}%;--piece-y:${row * 100 / 3}%;--piece-image:url('${player.image}')`;
}

function photoBoardMarkup(board, player, className = 'photo-board') {
  const tiles = board.map((tile, index) => tile === 0
    ? '<span class="empty-space" aria-label="Empty space"></span>'
    : `<span class="photo-piece" style="${pieceImageStyle(tile, player)}" aria-label="${player.name}, photo piece ${tile}"></span>`).join('');
  return `<div class="${className}" role="img" aria-label="Scrambled 15-piece photo puzzle of ${player.name}">${tiles}</div>`;
}

function homeScreen() {
  const save = loadSave();
  const level = Math.max(1, save.currentLevel);
  const completed = Object.keys(save.completed).filter((id) => Number(id) <= LEVEL_COUNT).length;
  const settings = getSettings();
  return `<section class="screen">
    <header class="topbar">${logo()}<div class="topbar__group">
      <span class="stat-pill" aria-label="${getCoins()} coins"><span class="stat-pill__icon" aria-hidden="true">◆</span>${getCoins()}</span>
      <span class="stat-pill" aria-label="${getLives().lives} lives"><span class="stat-pill__icon" aria-hidden="true">♥</span>${getLives().lives}/5</span>
      <button class="btn btn--icon btn--soft" data-action="settings" aria-label="Settings" title="Settings">⚙</button>
    </div></header>
    <div class="hero-home">
      <div class="home-brand"><img class="home-hero-ball" src="/assets/icons/football.svg" alt="Football" /><div><h1 class="home-wordmark">BALLER<span>GRID.</span></h1><p class="home-tagline">Slide into the legend.</p></div></div>
      <div class="home-level-card">
        <div class="home-level-meta"><span>YOUR JOURNEY</span><span>${completed} / ${LEVEL_COUNT}</span></div>
        <div class="progress-track" aria-label="${completed} of ${LEVEL_COUNT} levels complete"><i style="width:${Math.min(100, completed * 100 / LEVEL_COUNT)}%"></i></div>
        <div class="row"><span><span class="eyebrow">UP NEXT</span><br><strong>Level ${String(level).padStart(2, '0')}</strong></span><span class="eyebrow">${getLevelBand(level)}</span></div>
      </div>
      <button class="btn btn--primary btn--large btn--wide" data-action="play">${app.game && !app.game.finished && app.game.level.id === level ? 'RESUME PUZZLE' : 'PLAY'} <span aria-hidden="true">→</span></button>
      <div class="menu-grid">
        <button class="btn btn--dark" data-action="levels">▦ &nbsp; LEVELS</button>
        <button class="btn btn--mint" data-action="daily">✦ &nbsp; DAILY GRID</button>
        <button class="btn btn--soft" data-action="tutorial">← &nbsp; BACK TO TUTORIAL</button>
        <button class="btn btn--soft" data-action="about">i &nbsp; ABOUT</button>
      </div>
    </div>
    <div class="spacer"></div><p class="eyebrow" style="text-align:center;margin:22px 0 0">${settings.sound ? 'SOUND ON' : 'SOUND OFF'} &nbsp;·&nbsp; ${settings.music ? 'MUSIC ON' : 'MUSIC OFF'} &nbsp;·&nbsp; ${settings.vibration ? 'HAPTICS ON' : 'HAPTICS OFF'}</p>
  </section>`;
}

function levelsScreen() {
  const save = loadSave();
  const cells = Array.from({ length: LEVEL_COUNT }, (_, index) => {
    const id = index + 1;
    const record = save.completed[id];
    const locked = id > save.highestUnlocked;
    const stars = record ? '★'.repeat(record.stars) + '☆'.repeat(3 - record.stars) : '';
    const label = locked ? `Level ${id}, locked` : `Level ${id}${record ? `, ${record.stars} stars` : ''}`;
    return `<button class="level-cell ${locked ? 'level-cell--locked' : ''} ${id === save.currentLevel ? 'level-cell--current' : ''}" data-level="${id}" ${locked ? 'disabled' : ''} aria-label="${label}">
      <span>${locked ? '⌑' : record ? '✓' : String(id).padStart(2, '0')}</span><span class="level-cell__stars" aria-hidden="true">${stars}</span></button>`;
  }).join('');
  return `<section class="screen"><header class="topbar"><div class="topbar__group"><button class="btn btn--icon btn--soft" data-action="home" aria-label="Back to home" title="Back to home">⌂</button><button class="btn btn--icon btn--soft" data-action="tutorial" aria-label="Back to tutorial" title="Back to tutorial">←</button></div><span class="stat-pill">◆ ${getCoins()}</span></header><h1 class="screen-title">Level path</h1><p class="screen-subtitle">${save.highestUnlocked} unlocked · ${Object.keys(save.completed).length} cleared</p><div class="level-grid">${cells}</div><div class="bottom-nav"><button class="btn btn--soft" data-action="daily">✦ Daily grid</button><button class="btn btn--dark" data-action="play">Continue →</button></div></section>`;
}

function dailyScreen() {
  const status = getDailyStatus();
  const dailyLevel = getDailyLevel();
  return `<section class="screen"><header class="topbar"><button class="btn btn--icon btn--soft" data-action="home" aria-label="Back to home">←</button><span class="stat-pill">◆ ${getCoins()}</span></header><div class="spacer"></div><div class="result-hero"><span class="result-hero__mark" style="background:#fff0da;color:#bd8421">✦</span><span class="eyebrow">${status.dateKey}</span><h1 class="screen-title" style="margin:0">Daily challenge</h1><p class="screen-subtitle">A new football legend every day.</p>${photoBoardMarkup(dailyLevel.startingBoard, dailyLevel.player, 'photo-board photo-board--mini')}<strong>${dailyLevel.player.name}</strong><span class="stars">${status.completed ? '✓' : `DAY ${status.streak + 1}`}</span><span>${status.completed ? 'Today’s reward is claimed.' : 'Restore the photo to earn coins.'}</span></div><div class="stack" style="margin-top:20px"><button class="btn btn--primary btn--large btn--wide" data-action="start-daily" ${status.completed ? 'disabled' : ''}>${status.completed ? 'COMPLETED TODAY' : 'PLAY DAILY CHALLENGE'}</button><p class="screen-subtitle" style="text-align:center">Current streak: ${status.streak} ${status.streak === 1 ? 'day' : 'days'}</p></div><div class="spacer"></div></section>`;
}

function tutorialScreen() {
  const example = getLevel(1);
  return `<section class="screen"><header class="topbar"><button class="btn btn--icon btn--soft" data-action="home" aria-label="Back to home" title="Back to home">←</button><span class="eyebrow">BALLER GRID · GUIDE</span></header><h1 class="screen-title">How to Play</h1><p class="screen-subtitle">Restore the football photo by sliding its pieces into place.</p><div class="panel stack" style="margin-top:16px"><div class="row"><span class="eyebrow">PUZZLE PREVIEW</span><strong>${example.player.name}</strong></div><img class="tutorial-reference" src="${example.player.image}" alt="${example.player.alt}" />${photoBoardMarkup([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15], example.player, 'photo-board photo-board--mini')}<ol class="tutorial-steps"><li><strong>Find the gap.</strong> Only a piece next to the empty space can move.</li><li><strong>Restore the photo.</strong> Tap a neighboring piece to slide it into the gap.</li><li><strong>Use hints if needed.</strong> Spend coins to reveal or play a helpful move.</li></ol></div><div class="spacer"></div><button type="button" class="btn btn--primary btn--large btn--wide" data-action="tutorial-done">START LEVEL 01 <span aria-hidden="true">→</span></button></section>`;
}

function settingsScreen() {
  const settings = getSettings();
  const toggle = (key, title, description) => `<div class="toggle-row"><span class="toggle-row__copy"><strong>${title}</strong><small>${description}</small></span><button type="button" class="switch" role="switch" aria-checked="${settings[key]}" aria-label="${title}" data-setting="${key}"></button></div>`;
  const themes = THEMES.map(({ id, label }) => `<button type="button" class="theme-option" data-theme="${id}" aria-pressed="${settings.theme === id}"><span class="theme-swatch theme-swatch--${id}" aria-hidden="true"></span>${label}</button>`).join('');
  const notificationDescription = isNativeAdPlatform()
    ? 'Daily reminder at 9:00 AM'
    : 'Daily reminder at 9:00 AM while the game is open';
  return `<section class="screen screen--settings"><header class="topbar"><button class="btn btn--icon btn--soft" data-action="home" aria-label="Back to home">←</button><span class="eyebrow">BALLER GRID</span></header><h1 class="screen-title">Settings</h1><div class="panel" style="margin-top:14px">${toggle('sound', 'Sound effects', 'Tile and reward sounds')}${toggle('music', 'Music', 'Background audio')}${toggle('vibration', 'Vibration', 'Short touch feedback')}${toggle('notifications', 'Notifications', notificationDescription)}<fieldset class="theme-picker"><legend>Game background</legend><div class="theme-options">${themes}</div></fieldset></div><div class="stack" style="margin-top:18px"><button class="btn btn--soft btn--wide" data-action="about">About · Version 1.0.0</button><button class="btn btn--soft btn--wide" data-action="privacy">Privacy policy</button><button class="btn btn--soft btn--wide" data-action="terms">Terms of use</button><button class="btn btn--soft btn--wide" data-action="reset-confirm" style="color:var(--danger)">Reset progress</button></div><div class="spacer"></div><p class="eyebrow" style="text-align:center">DEVELOPED BY BEMS</p></section>`;
}

function aboutScreen() {
  return `<section class="screen"><header class="topbar"><button class="btn btn--icon btn--soft" data-action="settings" aria-label="Back to settings">←</button>${logo()}</header><div class="spacer"></div><div class="result-hero"><img class="about-brand-ball" src="/assets/icons/football.svg" alt="" aria-hidden="true" /><h1 class="screen-title" style="margin:0">BALLER GRID</h1><p class="screen-subtitle">Version 1.0.0</p><div class="divider" style="width:100%"></div><span>Developed by <strong>BeMs</strong></span><span class="screen-subtitle">Made for curious minds.</span></div><div class="spacer"></div><button class="btn btn--dark btn--wide" data-action="settings">DONE</button></section>`;
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function legalScreen() {
  const privacy = app.legalDocument === 'privacy';
  return `<section class="screen"><header class="topbar"><button class="btn btn--icon btn--soft" data-action="settings" aria-label="Back to settings">←</button><span class="eyebrow">BALLER GRID</span></header><h1 class="screen-title">${privacy ? 'Privacy policy' : 'Terms of use'}</h1><p class="screen-subtitle">BeMs · Version 1.0.0</p><div class="legal-document" tabindex="0">${escapeHtml(privacy ? PRIVACY_POLICY : TERMS_OF_USE)}</div><button class="btn btn--dark btn--wide" data-action="settings" style="margin-top:12px">DONE</button></section>`;
}

function elapsedSeconds(game) {
  const now = game.pausedAt ?? Date.now();
  return Math.max(0, Math.floor((now - game.startedAt - game.pausedDuration) / 1000));
}

function formatTime(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function speakerIcon(enabled) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4h4l5 4V6l-5 4H4z"/>${enabled ? '<path d="M16 9a5 5 0 0 1 0 6M18.5 6.5a9 9 0 0 1 0 11"/>' : '<path d="m17 9 5 6m0-6-5 6"/>'}</svg>`;
}

function gameScreen() {
  const game = app.game;
  if (!game) return homeScreen();
  const level = game.level;
  const boardTiles = game.board.map((tile, index) => {
    const row = Math.floor(index / level.size) + 1;
    const column = index % level.size + 1;
    const preview = game.previewCell === index;
    const destination = game.previewTarget === index;
    if (tile === 0) return `<span class="empty-space ${destination ? 'empty-space--target' : ''}" role="img" aria-label="Empty space${destination ? ', highlighted tile home' : ''}"></span>`;
    const classes = ['tile', 'slide-tile', preview ? 'tile--preview' : '', destination ? 'tile--destination' : ''].filter(Boolean).join(' ');
    return `<button class="${classes}" style="${pieceImageStyle(tile, level.player)}" data-tile="${index}" aria-label="Row ${row}, column ${column}: ${level.player.name} photo piece ${tile}${destination ? ', this is the home square for the highlighted piece' : ''}"></button>`;
  }).join('');
  const soundEnabled = getSettings().sound;
  return `<section class="screen game-screen"><header class="game-head"><button class="btn btn--icon btn--soft" data-action="exit-game" aria-label="Exit puzzle">←</button><div class="game-heading"><strong>${game.isDaily ? 'DAILY CHALLENGE' : `LEVEL ${String(level.id).padStart(2, '0')}`}</strong><small>${level.player.name} · ${level.difficulty}</small></div><div class="game-head__actions"><button class="btn btn--icon btn--soft" data-action="toggle-sound" aria-label="${soundEnabled ? 'Turn sound off' : 'Turn sound on'}" aria-pressed="${soundEnabled}" title="${soundEnabled ? 'Sound on' : 'Sound off'}">${speakerIcon(soundEnabled)}</button><button class="btn btn--icon btn--soft" data-action="pause" aria-label="Pause">Ⅱ</button></div></header><div class="game-stats"><span class="stat-pill">◆ ${getCoins()}</span><span class="stat-pill">♥ ${getLives().lives}/5</span><span class="stat-pill">◷ <span id="game-timer">${formatTime(elapsedSeconds(game))}</span></span><span class="stat-pill">↗ ${game.moves}</span></div><div class="game-status" aria-live="polite">${game.status || 'Slide a photo piece beside the empty space.'}</div><figure class="photo-reference"><figcaption><span class="eyebrow">REFERENCE PHOTO</span><strong>${level.player.name}</strong></figcaption><img class="photo-reference__image" src="${level.player.image}" alt="${level.player.alt}" draggable="false" /></figure><div class="board-wrap"><div class="board board--sliding" style="--grid-size:${level.size}" role="group" aria-label="15-piece sliding photo puzzle of ${level.player.name}; move a piece beside the empty space">${boardTiles}</div></div><div class="game-controls"><button class="btn btn--soft" data-action="restart">↻ &nbsp;RESTART · 1 LIFE</button><button class="btn btn--mint" data-action="hints">✦ &nbsp;HINT</button><button class="btn btn--dark" data-action="pause">Ⅱ &nbsp;PAUSE</button></div></section>`;
}

function resultScreen() {
  const result = app.game.result;
  const finalLevel = !app.game.isDaily && app.game.level.id === LEVEL_COUNT;
  return `<section class="screen"><header class="topbar"><button class="btn btn--icon btn--soft" data-action="home" aria-label="Home">⌂</button>${logo()}</header><div class="spacer"></div><div class="result-hero"><span class="result-hero__mark">✓</span><span class="eyebrow">${app.game.isDaily ? 'DAILY CHALLENGE' : `LEVEL ${String(app.game.level.id).padStart(2, '0')}`}</span><h1 class="screen-title" style="margin:0">${app.game.isDaily ? 'Challenge cleared!' : 'Photo restored!'}</h1><div class="stars" aria-label="${result.stars} stars">${'★'.repeat(result.stars)}<span style="opacity:.25">${'★'.repeat(3 - result.stars)}</span></div><div class="result-score">${result.score.toLocaleString()} <span class="eyebrow">POINTS</span></div><div class="row" style="width:100%;justify-content:space-around"><span>${app.game.moves} moves</span><span>${formatTime(result.seconds)}</span><span>+${result.coins} ◆</span></div></div><div class="stack" style="margin-top:18px"><button class="btn btn--primary btn--large btn--wide" data-action="${app.game.isDaily || finalLevel ? 'home' : 'next'}" ${app.continuing ? 'disabled' : ''}>${app.game.isDaily ? 'BACK HOME' : finalLevel ? 'CAMPAIGN COMPLETE' : app.continuing ? 'LOADING…' : 'NEXT LEVEL →'}</button><div class="menu-grid"><button class="btn btn--soft" data-action="replay">↻ &nbsp;REPLAY</button><button class="btn btn--soft" data-action="home">⌂ &nbsp;HOME</button></div></div><div class="spacer"></div></section>`;
}

function renderScreen() {
  switch (app.screen) {
    case 'splash': return `<section class="screen screen--center"><div class="splash-brand">${logo('splash-mark')}</div></section>`;
    case 'home': return homeScreen();
    case 'levels': return levelsScreen();
    case 'daily': return dailyScreen();
    case 'tutorial': return tutorialScreen();
    case 'settings': return settingsScreen();
    case 'about': return aboutScreen();
    case 'legal': return legalScreen();
    case 'game': return gameScreen();
    case 'result': return resultScreen();
    default: return homeScreen();
  }
}

function overlayMarkup() {
  if (!app.overlay) return '';
  if (app.overlay === 'hints') {
    const options = [
      ['highlight', 'Point to the next slide', 'Highlights the next piece to move', 20],
      ['reveal', 'Show a piece’s home', 'Marks a piece and its solved position', 30],
      ['auto', 'Slide one piece for me', 'Performs the next solving move', 50],
    ];
    return `<div class="overlay" data-overlay-backdrop><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="row"><h2 id="dialog-title">Need a nudge?</h2><button class="btn btn--icon btn--soft" data-action="close-overlay" aria-label="Close">×</button></div><p>Your next step is always solvable. Coins: <strong>${getCoins()}</strong></p><div class="hint-actions">${options.map(([kind, title, description, cost]) => `<button class="btn btn--soft hint-option" data-hint="${kind}" ${getCoins() < cost ? 'disabled' : ''}><span><strong>${title}</strong><small>${description}</small></span><strong>${cost} ◆</strong></button>`).join('')}</div>${isNativeAdPlatform() ? '<button class="btn btn--mint btn--wide" data-action="rewarded-hint" style="margin-top:12px">WATCH AD FOR A FREE HINT</button>' : ''}</section></div>`;
  }
  if (app.overlay === 'pause') return `<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">Take a breather.</h2><p>The timer is paused. Your board is right where you left it.</p><div class="stack"><button class="btn btn--primary btn--wide" data-action="resume">RESUME</button><button class="btn btn--soft btn--wide" data-action="restart">RESTART · 1 LIFE</button><button class="btn btn--soft btn--wide" data-action="exit-game">EXIT TO HOME</button></div></section></div>`;
  if (app.overlay === 'reset-confirm') return `<div class="overlay"><section class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">Reset your progress?</h2><p>Are you sure? This will permanently reset your game progress on this device.</p><div class="dialog-actions"><button class="btn btn--soft" data-action="close-overlay">CANCEL</button><button class="btn btn--primary" data-action="reset-confirmed">RESET</button></div></section></div>`;
  if (app.overlay === 'privacy') return `<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">Privacy choices</h2><p>Core gameplay works offline. The game saves progress on this device. Ads may process device and advertising identifiers when enabled. Google’s consent form appears before production ad requests where required.</p><div class="dialog-actions"><button class="btn btn--soft" data-action="close-overlay">CLOSE</button><button class="btn btn--soft" data-action="full-policy">FULL POLICY</button><button class="btn btn--dark" data-action="privacy-options">MANAGE ADS</button></div></section></div>`;
  if (app.overlay === 'terms') return `<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">Terms of use</h2><p>Use the game for personal entertainment. Virtual coins have no cash value and cannot be transferred or redeemed.</p><div class="dialog-actions"><button class="btn btn--soft" data-action="close-overlay">CLOSE</button><button class="btn btn--dark" data-action="full-terms">FULL TERMS</button></div></section></div>`;
  return '';
}

function render({ animateScreen = true } = {}) {
  document.documentElement.dataset.theme = getSettings().theme;
  root.innerHTML = `<div class="app-shell">${renderScreen()}</div>${overlayMarkup()}${app.toast ? `<div class="toast" role="status">${app.toast}</div>` : ''}`;
  if (!animateScreen && app.screen === 'game') root.querySelector('.game-screen')?.classList.add('screen--static');
  root.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      handleAction(button.dataset.action);
    });
  });
  root.querySelectorAll('[data-setting]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      void toggleSetting(button.dataset.setting);
    });
  });
  root.querySelectorAll('[data-theme]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      setSetting('theme', button.dataset.theme);
      render();
    });
  });
  if (app.screen === 'game' && app.game && !app.overlay) startClock();
  else stopClock();
  if (['home', 'levels', 'result'].includes(app.screen)) void showBanner(app.screen);
  else void hideBanner();
}

async function toggleSetting(key) {
  const value = !getSettings()[key];
  if (key === 'notifications') {
    try {
      const configured = await setDailyReminder(value);
      if (!configured) {
        showToast('Notifications are unavailable or permission was denied. Check your browser or device settings.');
        return;
      }
      setSetting(key, value);
      showToast(value ? 'Daily reminder set for 9:00 AM.' : 'Daily reminder turned off.');
    } catch (error) {
      console.error('Could not update the daily reminder setting.', error);
      showToast('Could not update notifications. Please try again.');
    }
    return;
  }
  setSetting(key, value);
  if (key === 'music') setMusicEnabled(value);
  if (key === 'sound' && value) playSound('success');
  if (key === 'vibration' && value) vibrate([18, 35, 18]);
  render();
}

function showToast(message) {
  app.toast = message;
  render();
  clearTimeout(app.toastTimer);
  app.toastTimer = setTimeout(() => { app.toast = null; render(); }, 2300);
}

function startClock() {
  if (app.clockTimer || !app.game || app.game.pausedAt) return;
  app.clockTimer = setInterval(() => {
    const timer = document.querySelector('#game-timer');
    if (timer && app.game) timer.textContent = formatTime(elapsedSeconds(app.game));
  }, 1000);
}

function stopClock() {
  clearInterval(app.clockTimer);
  app.clockTimer = null;
}

function startGame(level, isDaily = false) {
  if (!level) return showToast('That level could not be loaded.');
  app.game = createGame(level, { isDaily });
  if (!isDaily) updateSave((save) => ({ ...save, currentLevel: Math.max(save.currentLevel, level.id) }));
  app.screen = 'game';
  app.overlay = null;
  trackEvent('game_started', { levelId: level.id, daily: isDaily });
  trackEvent(isDaily ? 'daily_challenge_started' : 'level_started', { levelId: level.id });
  render();
}

function completeLevel() {
  const game = app.game;
  if (!game || game.finished) return;
  game.finished = true;
  const seconds = elapsedSeconds(game);
  const { score, stars } = scoreLevel({
    levelId: game.level.id,
    moves: game.moves,
    par: game.level.par,
    seconds,
    hints: game.hints,
  });
  let coins = 0;

  if (game.isDaily) {
    const reward = completeDailyChallenge();
    coins = reward.reward;
    if (reward.claimed) trackEvent('daily_challenge_completed', { reward: coins, streak: reward.streak });
    if (!reward.claimed) showToast('Today’s reward has already been claimed.');
  } else {
    coins = recordLevelCompletion(game.level.id, score, stars, game.moves);
  }

  if (game.isDaily) updateSave((state) => ({ ...state, gamesCompleted: state.gamesCompleted + 1, totalScore: state.totalScore + score }));
  game.result = { score, stars, seconds, coins };
  trackEvent('level_completed', { levelId: game.level.id, score, stars, daily: game.isDaily });
  game.status = 'Photo restored!';
  app.overlay = null;
  app.screen = 'result';
  playSound('win');
  vibrate([25, 40, 30]);
  render();
}

function applyPlayerMove(index, fromHint = false) {
  const game = app.game;
  if (!game || game.finished || game.pausedAt || app.overlay) return;
  if (!performMove(game, index, { fromHint })) {
    game.status = 'Only pieces beside the empty space can slide.';
    playSound('error');
    vibrate(16);
    return render({ animateScreen: false });
  }
  game.status = fromHint ? 'Helpful move played.' : '';
  playSound('tap');
  vibrate(10);
  if (isSolved(game)) {
    completeLevel();
    return;
  }
  render({ animateScreen: false });
}

function useHint(type) {
  const game = app.game;
  if (!game) return;
  const cell = nextSolutionCell(game.solutionMoves, game.solutionCursor);
  const revealCell = type === 'reveal'
    ? game.board.findIndex((tile, index) => tile !== 0 && tile !== index + 1)
    : -1;
  if (type !== 'reveal' && cell === null) return showToast('No move is needed.');
  if (type === 'reveal' && revealCell < 0) return showToast('Every photo piece is already home.');
  if (!buyHint(type)) {
    playSound('error');
    return showToast('Not enough coins for that hint.');
  }
  game.hints += 1;
  trackEvent('hint_used', { type, levelId: game.level.id });
  app.overlay = null;
  playSound('hint');
  vibrate(18);
  if (type === 'highlight') {
    game.previewCell = cell;
    game.previewMode = 'highlight';
    game.status = `Slide the piece at row ${Math.floor(cell / game.level.size) + 1}, column ${cell % game.level.size + 1}.`;
    render();
  } else if (type === 'reveal') {
    const tile = game.board[revealCell];
    game.previewCell = revealCell;
    game.previewMode = 'reveal';
    game.previewTarget = tile - 1;
    game.status = `Highlighted piece ${tile} belongs at row ${Math.floor((tile - 1) / game.level.size) + 1}, column ${(tile - 1) % game.level.size + 1}.`;
    render();
  } else {
    applyPlayerMove(cell, true);
  }
}

function grantRewardedHint() {
  if (!app.game) return;
  const cell = nextSolutionCell(app.game.solutionMoves, app.game.solutionCursor);
  if (cell === null) return showToast('No move is needed.');
  app.game.hints += 1;
  app.game.previewCell = cell;
  app.game.previewMode = 'highlight';
  app.game.status = 'Reward earned: a free hint is ready.';
  render();
}

function togglePause(paused) {
  if (!app.game || app.game.finished) return;
  if (paused && !app.game.pausedAt) {
    app.game.pausedAt = Date.now();
    app.overlay = 'pause';
  } else if (!paused && app.game.pausedAt) {
    app.game.pausedDuration += Date.now() - app.game.pausedAt;
    app.game.pausedAt = null;
    app.overlay = null;
  }
  render();
}

function restartGame() {
  if (!app.game) return;
  if (!consumeLife()) {
    app.overlay = null;
    render();
    const nextLife = getLives().nextLifeAt;
    const minutes = nextLife ? Math.ceil((nextLife - Date.now()) / 60_000) : 0;
    return showToast(`No lives left. Next life in ${minutes} min.`);
  }
  const { level, isDaily } = app.game;
  startGame(level, isDaily);
  showToast('Puzzle restarted. One life used.');
}

function openHome() {
  if (app.game?.pausedAt) {
    app.game.pausedDuration += Date.now() - app.game.pausedAt;
    app.game.pausedAt = null;
  }
  app.overlay = null;
  app.screen = 'home';
  render();
}

async function watchRewardedHint() {
  app.overlay = null;
  render();
  trackEvent('rewarded_ad_started', { levelId: app.game?.level.id ?? null });
  const rewarded = await showRewardedAd();
  if (rewarded) {
    trackEvent('rewarded_ad_completed', { levelId: app.game?.level.id ?? null });
    grantRewardedHint();
    playSound('coin');
    return showToast('Reward earned. A free hint is ready.');
  }
  showToast('No ad available. Your puzzle is still here.');
}

function handleAction(action) {
  if (action !== 'toggle-sound') {
    try {
      playSound('tap');
    } catch {
      // Optional audio must never block game navigation.
    }
  }
  switch (action) {
    case 'toggle-sound': setSetting('sound', !getSettings().sound); render(); break;
    case 'home': openHome(); break;
    case 'play': {
      const save = loadSave();
      const level = getLevel(save.currentLevel) ?? getLevel(1);
      if (app.game && !app.game.finished && app.game.level.id === save.currentLevel && !app.game.isDaily) {
        app.screen = 'game'; app.overlay = null; render();
      } else startGame(level);
      break;
    }
    case 'levels': app.screen = 'levels'; render(); break;
    case 'daily': app.screen = 'daily'; render(); break;
    case 'settings': app.screen = 'settings'; render(); break;
    case 'about': app.screen = 'about'; render(); break;
    case 'privacy': app.overlay = 'privacy'; render(); break;
    case 'terms': app.overlay = 'terms'; render(); break;
    case 'full-policy': app.legalDocument = 'privacy'; app.overlay = null; app.screen = 'legal'; render(); break;
    case 'full-terms': app.legalDocument = 'terms'; app.overlay = null; app.screen = 'legal'; render(); break;
    case 'privacy-options':
      void showPrivacyOptions().then((opened) => {
        app.overlay = null; render(); showToast(opened ? 'Privacy options closed.' : 'Privacy options are available in the Android app.');
      });
      break;
    case 'tutorial': app.screen = 'tutorial'; render(); break;
    case 'tutorial-done': {
      const save = updateSave((state) => ({ ...state, tutorialComplete: true }));
      startGame(getLevel(save.currentLevel));
      break;
    }
    case 'start-daily': startGame(getDailyLevel(), true); break;
    case 'pause': togglePause(true); break;
    case 'resume': togglePause(false); break;
    case 'restart': restartGame(); break;
    case 'exit-game': openHome(); break;
    case 'hints': app.overlay = 'hints'; render(); break;
    case 'close-overlay': app.overlay = null; render(); break;
    case 'reset-confirm': app.overlay = 'reset-confirm'; render(); break;
    case 'reset-confirmed':
      resetProgress(); setMusicEnabled(false); void setDailyReminder(false); app.game = null; app.overlay = null; app.screen = 'home'; render(); showToast('Progress reset on this device.');
      break;
    case 'next': {
      if (app.continuing || app.game?.isDaily) break;
      app.continuing = true;
      render();
      void onLevelCompleted().finally(() => {
        app.continuing = false;
        if (app.screen === 'result') startGame(getLevel(app.game.level.id + 1));
      });
      break;
    }
    case 'replay': startGame(app.game.level, app.game.isDaily); break;
    case 'rewarded-hint': void watchRewardedHint(); break;
    default: break;
  }
}

root.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : event.target.parentElement;
  if (!target) return;
  const tile = target.closest('[data-tile]');
  if (tile) return applyPlayerMove(Number(tile.dataset.tile));
  const hint = target.closest('[data-hint]');
  if (hint) return useHint(hint.dataset.hint);
  const level = target.closest('[data-level]');
  if (level && !level.disabled) return startGame(getLevel(Number(level.dataset.level)));
  const action = target.closest('[data-action]');
  if (target.matches('[data-overlay-backdrop]')) {
    app.overlay = null;
    render();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && app.game && app.screen === 'game' && !app.game.pausedAt && !app.game.finished) togglePause(true);
  if (!document.hidden) setMusicEnabled(getSettings().music);
});

function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  if (import.meta.env.PROD) {
    if (location.protocol.startsWith('http')) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    return;
  }

  if (!import.meta.env.DEV) return;
  void (async () => {
    try {
      const workerUrl = new URL('/sw.js', location.origin).href;
      const registrations = await navigator.serviceWorker.getRegistrations();
      const appRegistrations = registrations.filter((registration) => {
        const workers = [registration.active, registration.waiting, registration.installing];
        return workers.some((worker) => worker?.scriptURL === workerUrl);
      });
      await Promise.all(appRegistrations.map((registration) => registration.unregister()));
      if ('caches' in globalThis) {
        const cacheNames = await caches.keys();
        const appCaches = cacheNames.filter((name) => name.startsWith('baller-grid-'));
        await Promise.all(appCaches.map((name) => caches.delete(name)));
      }
    } catch {
      // Service worker cleanup must never prevent the game from starting.
    }
  })();
}

function initialize() {
  const save = loadSave();
  if (save.settings.music) setMusicEnabled(true);
  if (save.settings.notifications) {
    void setDailyReminder(true, { requestPermission: false }).then((configured) => {
      if (!configured) setSetting('notifications', false);
    }).catch((error) => {
      console.error('Could not restore the daily reminder setting.', error);
      setSetting('notifications', false);
    });
  }
  render();
  setupServiceWorker();

  setTimeout(() => {
    if (app.screen !== 'splash') return;
    app.screen = loadSave().tutorialComplete ? 'home' : 'tutorial';
    render();
  }, 700);
}

initialize();