// Phaser game configuration (spec 2). Scene order = boot order; all scenes are registered here.
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { CityScene } from './scenes/CityScene';
import { HudScene } from './scenes/HudScene';
import { QuizScene } from './scenes/minigames/QuizScene';
import { OxScene } from './scenes/minigames/OxScene';
import { MatchScene } from './scenes/minigames/MatchScene';
import { MapFindScene } from './scenes/minigames/MapFindScene';
import { OrderScene } from './scenes/minigames/OrderScene';
import { BlankScene } from './scenes/minigames/BlankScene';
import { AvatarRoomScene } from './scenes/AvatarRoomScene';
import { DebugAtlasScene } from './scenes/DebugAtlasScene';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game',
  backgroundColor: '#1b1b2f',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  // minigame scenes come after Hud so they draw on top of it
  scene: [BootScene, TitleScene, WorldMapScene, CityScene, HudScene, QuizScene, OxScene, MatchScene, MapFindScene, OrderScene, BlankScene, AvatarRoomScene, DebugAtlasScene],
};
