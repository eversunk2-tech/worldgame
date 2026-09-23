// Monster mesh pool ↔ MonsterState[] sync, with head-mounted HP bar sprites.
import * as THREE from 'three';
import type { GameState, MonsterState } from '../../shared/types';
import { getMonsterDef } from '../../shared/data/monsters';
import { createMonsterMesh, type MonsterMesh } from './meshFactory';
import { LabelSprite } from './labelSprite';

const HIT_COLOR = new THREE.Color(0xff1744);

interface Entry {
  mesh: MonsterMesh;
  bar: LabelSprite;
  baseColor: THREE.Color;
  flashing: boolean;
}

export class MonsterView {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly scene: THREE.Scene) {}

  private ensure(m: MonsterState): Entry {
    let e = this.entries.get(m.id);
    if (e) return e;
    const def = getMonsterDef(m.typeId);
    const mesh = createMonsterMesh(def.color, def.size);
    const bar = new LabelSprite({ width: 128, height: 24, scale: 1.4 });
    bar.sprite.position.y = def.size.y + 0.4;
    mesh.group.add(bar.sprite);
    this.scene.add(mesh.group);
    e = { mesh, bar, baseColor: new THREE.Color(def.color), flashing: false };
    this.entries.set(m.id, e);
    return e;
  }

  sync(state: GameState, _dt: number): void {
    for (const m of state.monsters) {
      const e = this.ensure(m);
      const g = e.mesh.group;
      if (m.ai === 'dead') {
        if (g.visible) g.visible = false;
        continue;
      }
      if (!g.visible) g.visible = true;
      g.position.set(m.pos.x, m.pos.y, m.pos.z);
      g.rotation.y = m.yaw;

      // slime-style idle bob makes the box world feel alive
      const bob = m.ai === 'idle' ? Math.sin(state.time * 3 + m.pos.x) * 0.03 : 0;
      e.mesh.body.scale.y = 1 + bob;

      const flashing = m.hitFlash > 0;
      if (flashing !== e.flashing) {
        e.flashing = flashing;
        e.mesh.material.color.copy(flashing ? HIT_COLOR : e.baseColor);
      }
      e.bar.setBar(m.hp / m.maxHp);
    }
  }
}
