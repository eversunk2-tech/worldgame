// NPC meshes + name tags + quest indicator (! available, ? completed/turn-in) above the head.
import * as THREE from 'three';
import type { GameState, NPCDef } from '../../shared/types';
import { NPCS } from '../../shared/data/npcs';
import { createCharacter, type CharacterMesh } from './meshFactory';
import { LabelSprite } from './labelSprite';

interface Entry {
  def: NPCDef;
  mesh: CharacterMesh;
  name: LabelSprite;
  marker: LabelSprite;
  lastMarker: string;
}

export class NPCView {
  private readonly entries: Entry[] = [];

  constructor(scene: THREE.Scene) {
    for (const def of NPCS) {
      const mesh = createCharacter(def.color, 1.8);
      mesh.group.position.set(def.pos.x, def.pos.y, def.pos.z);
      // face the village center (player spawn) so NPCs look toward the player at start
      mesh.group.rotation.y = Math.atan2(0 - def.pos.x, 6 - def.pos.z);

      const name = new LabelSprite({ width: 256, height: 64, scale: 2.2, font: 'bold 30px sans-serif' });
      name.setText(def.name);
      name.sprite.position.y = 2.2;
      mesh.group.add(name.sprite);

      const marker = new LabelSprite({
        width: 64, height: 64, scale: 0.7, font: 'bold 48px sans-serif', color: '#ffeb3b', background: 'rgba(0,0,0,0)',
      });
      marker.sprite.position.y = 2.85;
      marker.sprite.visible = false;
      mesh.group.add(marker.sprite);

      scene.add(mesh.group);
      this.entries.push({ def, mesh, name, marker, lastMarker: '' });
    }
  }

  sync(state: GameState, _dt: number): void {
    for (const e of this.entries) {
      let symbol = '';
      for (const qid of e.def.questIds) {
        const s = state.quests[qid]?.status;
        if (s === 'completed') { symbol = '?'; break; }
        if (s === 'available') symbol = '!';
      }
      if (symbol !== e.lastMarker) {
        e.lastMarker = symbol;
        e.marker.sprite.visible = symbol !== '';
        if (symbol) e.marker.setText(symbol);
      }
      // gentle arm idle so they don't look frozen
      e.mesh.armL.rotation.x = Math.sin(state.time * 1.5) * 0.15;
      e.mesh.armR.rotation.x = -Math.sin(state.time * 1.5) * 0.15;
    }
  }
}
