import { getSettings } from './settings.js';

let audioContext;
let musicTimer;
let musicNote = 0;

function context() {
  try {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    audioContext ??= AudioContextClass ? new AudioContextClass() : null;
    if (audioContext?.state === 'suspended') void audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
}

export function playSound(kind = 'tap') {
  if (!getSettings().sound) return;
  const audio = context();
  if (!audio) return;
  const notes = { tap: 420, success: 620, win: 740, coin: 880, error: 210, hint: 540 };
  try {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = notes[kind] ?? notes.tap;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + (kind === 'win' ? 0.28 : 0.12));
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.3);
  } catch {
    // Audio is an enhancement; blocked or unavailable audio never interrupts play.
  }
}

export function vibrate(pattern = 12) {
  if (!getSettings().vibration) return;
  try {
    globalThis.navigator?.vibrate?.(pattern);
  } catch {
    // Vibration is optional and not supported in every browser.
  }
}

export function setMusicEnabled(enabled) {
  if (!enabled) {
    clearInterval(musicTimer);
    musicTimer = null;
    return;
  }
  if (musicTimer) {
    context();
    return;
  }
  const notes = [196, 247, 294, 247, 220, 262, 330, 262];
  const playNote = () => {
    const audio = context();
    if (!audio) return;
    try {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = notes[musicNote++ % notes.length];
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.018, audio.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.62);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.65);
    } catch {
      // Background audio is optional.
    }
  };
  playNote();
  musicTimer = setInterval(playNote, 720);
}