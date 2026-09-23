// Third-person orbit camera: yaw / pitch / distance with smooth follow.
import * as THREE from 'three';
import type { PlayerState } from '../shared/types';
import { clamp } from '../shared/vec';

const PITCH_MIN = -0.1;
const PITCH_MAX = 1.2;
const DIST_MIN = 3;
const DIST_MAX = 16;
const ROT_SPEED = 0.005;
const ZOOM_SPEED = 0.01;
const FOLLOW_RATE = 12;

export class CameraController {
  yaw = 0;
  pitch = 0.35;
  distance = 8;

  private readonly target = new THREE.Vector3();
  private readonly desired = new THREE.Vector3();
  private initialized = false;

  constructor(readonly camera: THREE.PerspectiveCamera) {}

  applyDrag(dx: number, dy: number): void {
    this.yaw -= dx * ROT_SPEED;
    this.pitch = clamp(this.pitch + dy * ROT_SPEED, PITCH_MIN, PITCH_MAX);
  }

  applyWheel(deltaY: number): void {
    this.distance = clamp(this.distance + deltaY * ZOOM_SPEED, DIST_MIN, DIST_MAX);
  }

  update(player: PlayerState, dt: number): void {
    this.target.set(player.pos.x, player.pos.y + 1.5, player.pos.z);

    // Spherical offset: at yaw=0 the camera sits at +Z behind the target looking toward -Z... we
    // define "forward" as -Z so WASD forward (W) walks away from the camera. See Game.buildCommand.
    const cp = Math.cos(this.pitch);
    this.desired.set(
      this.target.x + Math.sin(this.yaw) * cp * this.distance,
      this.target.y + Math.sin(this.pitch) * this.distance,
      this.target.z + Math.cos(this.yaw) * cp * this.distance,
    );

    if (!this.initialized) {
      this.camera.position.copy(this.desired);
      this.initialized = true;
    } else {
      const t = 1 - Math.exp(-FOLLOW_RATE * dt);
      this.camera.position.lerp(this.desired, t);
    }
    this.camera.lookAt(this.target);
  }

  /** Teleport the camera to its desired position on the next update (e.g. after respawn). */
  snap(): void {
    this.initialized = false;
  }
}
