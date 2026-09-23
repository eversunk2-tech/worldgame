// Player mesh ↔ PlayerState sync. Read-only w.r.t. state.
import * as THREE from 'three';
import type { GameState } from '../../shared/types';
import { ATTACK_ANIM_TIME, INVULN_TIME } from '../../shared/constants';
import { createCharacter, type CharacterMesh } from './meshFactory';

const PLAYER_COLOR = 0x42a5f5;
const HIT_COLOR = new THREE.Color(0xff5252);

export class PlayerView {
  private readonly mesh: CharacterMesh;
  private readonly baseColors: THREE.Color[];
  private flashing = false;

  constructor(scene: THREE.Scene) {
    this.mesh = createCharacter(PLAYER_COLOR);
    this.baseColors = this.mesh.materials.map((m) => m.color.clone());
    scene.add(this.mesh.group);
  }

  sync(state: GameState, _dt: number): void {
    const p = state.player;
    const g = this.mesh.group;
    g.position.set(p.pos.x, p.pos.y, p.pos.z);
    g.rotation.y = p.yaw;
    g.visible = p.alive;

    // attack swing: right arm rotates forward then back
    const t = p.attackAnim > 0 ? 1 - p.attackAnim / ATTACK_ANIM_TIME : 0;
    const swing = Math.sin(t * Math.PI) * -1.8;
    this.mesh.armR.rotation.x = swing;
    this.mesh.armL.rotation.x = swing * 0.3;

    // hit flash: blink during the invulnerability window
    const shouldFlash = p.invulnTimer > 0 && Math.floor((INVULN_TIME - p.invulnTimer) / 0.08) % 2 === 0;
    if (shouldFlash !== this.flashing) {
      this.flashing = shouldFlash;
      this.mesh.materials.forEach((m, i) => m.color.copy(shouldFlash ? HIT_COLOR : this.baseColors[i]!));
    }
  }
}
