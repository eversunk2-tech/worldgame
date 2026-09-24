import Phaser from 'phaser';
import { gameConfig } from './config';
import { audio } from './audio/AudioEngine';
import { bgm } from './audio/bgm';
import { session } from './session';

const game = new Phaser.Game(gameConfig);

// Web Audio is created on the first user gesture (spec 6.5); scenes that asked for music earlier get it now.
const unlock = () => {
  audio.unlock();
  audio.setMuted(session.muted);
  bgm.kick();
  window.removeEventListener('pointerdown', unlock, { capture: true });
  window.removeEventListener('keydown', unlock, { capture: true });
};
// capture phase: the context exists before Phaser's own (bubbling) canvas handlers play the click sound
window.addEventListener('pointerdown', unlock, { capture: true });
window.addEventListener('keydown', unlock, { capture: true });
session.events.on('settings.changed', (e: { muted: boolean }) => { audio.setMuted(e.muted); if (!e.muted) bgm.onUnmuted(); });

// Exposed for browser debugging / review tooling only (dev builds; v0.1 review low #10).
declare global {
  interface Window { __play1?: Phaser.Game; __play1Session?: typeof session }
}
if (import.meta.env.DEV) {
  window.__play1 = game;
  window.__play1Session = session; // same instance the scenes use (a dynamic import from the console may not be)
}
