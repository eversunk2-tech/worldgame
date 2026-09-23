import Phaser from 'phaser';
import { gameConfig } from './config';

const game = new Phaser.Game(gameConfig);

// Exposed for browser debugging / review tooling only (not used by game code).
declare global {
  interface Window { __play1?: Phaser.Game }
}
window.__play1 = game;
