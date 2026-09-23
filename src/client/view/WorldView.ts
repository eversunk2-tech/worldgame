// Static world: ground, grid, lights, obstacles, platforms, reach markers, spawn zone discs.
import * as THREE from 'three';
import { MAP } from '../../shared/data/map';
import { MAP_SIZE } from '../../shared/constants';
import { getMonsterDef } from '../../shared/data/monsters';
import { createBox, createCylinder, createReachMarker, createZoneDisc } from './meshFactory';

export class WorldView {
  readonly root = new THREE.Group();

  constructor(scene: THREE.Scene) {
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 60, 160);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x556b2f, 0.9);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(30, 50, 20);
    scene.add(dir);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE),
      new THREE.MeshLambertMaterial({ color: 0x5cb85c }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.root.add(ground);

    const grid = new THREE.GridHelper(MAP_SIZE, MAP_SIZE / 4, 0x3f8f3f, 0x4fa04f);
    grid.position.y = 0.01;
    this.root.add(grid);

    for (const o of MAP.obstacles) {
      this.root.add(o.id === 'well' ? createCylinder(o) : createBox(o));
    }
    for (const p of MAP.platforms) {
      const mesh = createBox(p);
      // subtle edge lines so platform tops read clearly
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry),
        new THREE.LineBasicMaterial({ color: 0x555555 }),
      );
      mesh.add(edges);
      this.root.add(mesh);
    }
    for (const rp of MAP.reachPoints) {
      const marker = createReachMarker(rp.radius);
      marker.position.set(rp.pos.x, rp.pos.y, rp.pos.z);
      this.root.add(marker);
    }
    for (const zone of MAP.monsterSpawns) {
      const disc = createZoneDisc(zone.radius, getMonsterDef(zone.typeId).color);
      disc.position.x = zone.center.x;
      disc.position.z = zone.center.z;
      this.root.add(disc);
    }

    scene.add(this.root);
  }
}
