// Box-only mesh builders. Only Three.js primitive geometries are used.
import * as THREE from 'three';
import type { BoxDef, Vec3 } from '../../shared/types';

export function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

/** A static box for obstacles / platforms. */
export function createBox(def: BoxDef): THREE.Mesh {
  const geo = new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z);
  const mesh = new THREE.Mesh(geo, lambert(def.color));
  mesh.position.set(def.center.x, def.center.y, def.center.z);
  mesh.name = def.id;
  return mesh;
}

/** Cylinder used for the well (collision remains an AABB). */
export function createCylinder(def: BoxDef): THREE.Mesh {
  const r = Math.min(def.size.x, def.size.z) / 2;
  const geo = new THREE.CylinderGeometry(r, r, def.size.y, 16);
  const mesh = new THREE.Mesh(geo, lambert(def.color));
  mesh.position.set(def.center.x, def.center.y, def.center.z);
  mesh.name = def.id;
  return mesh;
}

export interface CharacterMesh {
  group: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  materials: THREE.MeshLambertMaterial[];
}

/**
 * Blocky humanoid: body + head + two arms, feet at group origin (y=0).
 * Faces +Z in local space, which matches yaw = atan2(x, z).
 */
export function createCharacter(color: number, height = 1.8): CharacterMesh {
  const group = new THREE.Group();
  const bodyMat = lambert(color);
  const skinMat = lambert(0xffe0b2);
  const legMat = lambert(0x3e4a5c);

  const legH = height * 0.4;
  const bodyH = height * 0.35;
  const headH = height * 0.25;
  const w = height * 0.33;

  const legs = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, legH, w * 0.6), legMat);
  legs.position.y = legH / 2;
  group.add(legs);

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, bodyH, w * 0.6), bodyMat);
  body.position.y = legH + bodyH / 2;
  group.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, headH, w * 0.8), skinMat);
  head.position.y = legH + bodyH + headH / 2;
  group.add(head);

  // eyes so you can tell the facing direction
  const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
  const eyeMat = lambert(0x222222);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(sx * w * 0.2, head.position.y + headH * 0.1, w * 0.4);
    group.add(eye);
  }

  const armGeo = new THREE.BoxGeometry(w * 0.25, bodyH, w * 0.25);
  // pivot at the shoulder so rotation swings the arm
  armGeo.translate(0, -bodyH / 2, 0);
  const armL = new THREE.Mesh(armGeo, bodyMat);
  armL.position.set(-w * 0.65, legH + bodyH, 0);
  const armR = new THREE.Mesh(armGeo, bodyMat);
  armR.position.set(w * 0.65, legH + bodyH, 0);
  group.add(armL, armR);

  return { group, body, head, armL, armR, materials: [bodyMat, skinMat, legMat] };
}

export interface MonsterMesh {
  group: THREE.Group;
  body: THREE.Mesh;
  material: THREE.MeshLambertMaterial;
}

/** Box monster with two eyes; feet at origin, faces +Z. */
export function createMonsterMesh(color: number, size: Vec3): MonsterMesh {
  const group = new THREE.Group();
  const material = lambert(color);
  const body = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  body.position.y = size.y / 2;
  group.add(body);

  const eyeGeo = new THREE.BoxGeometry(size.x * 0.12, size.y * 0.12, 0.05);
  const eyeMat = lambert(0x111111);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(sx * size.x * 0.22, size.y * 0.68, size.z / 2 + 0.02);
    group.add(eye);
  }
  return { group, body, material };
}

/** Yellow ring lying flat + a sign post, marking a reach point. */
export function createReachMarker(radius: number): THREE.Group {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.6, 0.08, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffeb3b }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), lambert(0x6d4c41));
  post.position.set(0, 0.8, -0.6);
  group.add(post);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.08), lambert(0xffcc80));
  board.position.set(0, 1.5, -0.6);
  group.add(board);
  return group;
}

/** Faint translucent disc for a monster spawn zone. */
export function createZoneDisc(radius: number, color: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  return mesh;
}
