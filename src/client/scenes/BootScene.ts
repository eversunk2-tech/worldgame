// Boot: load/generate textures, restore the save, go to Title (spec 5).
import Phaser from 'phaser';
import { validateContent } from '../../shared/content';
import { ASSETS, CHAR_FRAME, TEX } from '../assets/manifest';
import { createAllPlaceholders } from '../assets/placeholders';
import { session } from '../session';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Only real files listed in the manifest are loaded; everything else is generated in create().
    if (ASSETS.tiles.source) this.load.spritesheet(TEX.tiles, ASSETS.tiles.source, { frameWidth: ASSETS.tiles.frame, frameHeight: ASSETS.tiles.frame });
    if (ASSETS.worldmap.source) this.load.image(TEX.worldmap, ASSETS.worldmap.source);
    for (const [itemId, src] of Object.entries(ASSETS.charLayers.sources)) {
      if (src) this.load.spritesheet(TEX.layer(itemId), src, { frameWidth: CHAR_FRAME, frameHeight: CHAR_FRAME });
    }
    for (const [id, src] of Object.entries(ASSETS.monsters.sources)) {
      if (src) this.load.spritesheet(TEX.monster(id), src, { frameWidth: ASSETS.monsters.frame, frameHeight: ASSETS.monsters.frame });
    }
    for (const [name, src] of Object.entries(ASSETS.icons.sources)) {
      if (src) this.load.image(TEX.icon(name), src);
    }
  }

  create(): void {
    createAllPlaceholders(this);
    const problems = validateContent();
    console.assert(problems.length === 0, '[content] validation problems:', problems);
    session.init();
    this.scene.start('Title');
  }
}
