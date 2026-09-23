// Game loop (fixed timestep), input → Command, sim step, view/HUD sync, save trigger.
import * as THREE from 'three';
import type { Command, GameState, SimEvent } from '../shared/types';
import { FIXED_DT, MAX_FRAME_DT, MAX_STEPS_PER_FRAME } from '../shared/constants';
import { createState } from '../shared/sim/createState';
import { stepSimulation } from '../shared/sim/step';
import { Input, KEYS, type InputSnapshot } from './Input';
import { CameraController } from './CameraController';
import { WorldView } from './view/WorldView';
import { PlayerView } from './view/PlayerView';
import { MonsterView } from './view/MonsterView';
import { NPCView } from './view/NPCView';
import { HUD } from './ui/HUD';
import * as persistence from './persistence';

/**
 * Convert WASD into a world-space direction relative to camera yaw.
 * Camera sits at +Z (yaw=0) behind the player, so "forward" (W) is -Z:
 *   yaw=0,   W → (0, -1)    D → (1, 0)    (looking down -Z, screen-right is +X)
 *   yaw=π/2, W → (-1, 0)    D → (0, -1)   (camera at +X looking toward -X)
 */
export function buildCommand(input: InputSnapshot, cameraYaw: number, pending?: PendingEdges): Command {
  let fwd = 0;
  let right = 0;
  if (input.keysDown.has(KEYS.forward)) fwd += 1;
  if (input.keysDown.has(KEYS.back)) fwd -= 1;
  if (input.keysDown.has(KEYS.right)) right += 1;
  if (input.keysDown.has(KEYS.left)) right -= 1;

  let x = 0;
  let z = 0;
  if (fwd !== 0 || right !== 0) {
    // camera forward on XZ (from camera toward target): (-sin(yaw), -cos(yaw))
    const fx = -Math.sin(cameraYaw);
    const fz = -Math.cos(cameraYaw);
    // camera right = forward rotated -90° about Y: (-fz, fx)
    const rx = -fz;
    const rz = fx;
    x = fx * fwd + rx * right;
    z = fz * fwd + rz * right;
    const len = Math.hypot(x, z);
    if (len > 1e-6) { x /= len; z /= len; }
  }
  return {
    move: { x, z },
    jump: (pending?.jump ?? false) || input.keysPressed.has(KEYS.jump),
    attack: (pending?.attack ?? false) || input.keysPressed.has(KEYS.attack),
    interact: (pending?.interact ?? false) || input.keysPressed.has(KEYS.interact),
  };
}

/**
 * Edge inputs (jump/attack/interact) held until a simulation step consumes them.
 * Without this, a frame that runs zero fixed steps (common at 120Hz rAF) would drop the press.
 */
export interface PendingEdges { jump: boolean; attack: boolean; interact: boolean }

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly cameraCtl: CameraController;
  private readonly input: Input;
  private readonly hud: HUD;
  private readonly playerView: PlayerView;
  private readonly monsterView: MonsterView;
  private readonly npcView: NPCView;
  private readonly state: GameState;
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private readonly frameEvents: SimEvent[] = [];
  private readonly pending: PendingEdges = { jump: false, attack: false, interact: false };

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 300);
    this.cameraCtl = new CameraController(this.camera);
    this.input = new Input(canvas);

    // state: fresh, then overlay saved progress (the one place outside sim that writes state)
    this.state = createState();
    const loaded = persistence.load(this.state);

    new WorldView(this.scene);
    this.playerView = new PlayerView(this.scene);
    this.monsterView = new MonsterView(this.scene);
    this.npcView = new NPCView(this.scene);
    this.hud = new HUD();
    persistence.setOnSaved(() => this.hud.showSaved());
    if (loaded) this.hud.pushLog(`저장된 진행을 불러왔습니다 (Lv ${this.state.player.level})`, 'quest');

    this.hud.resetBtn.addEventListener('click', () => {
      if (window.confirm('저장된 진행을 삭제하고 처음부터 시작할까요?')) {
        persistence.clear();
        this.running = false;  // do not let beforeunload re-save
        window.location.reload();
      }
      this.canvas.focus();
    });
    window.addEventListener('beforeunload', () => {
      if (this.running) persistence.save(this.state);
    });

    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.canvas.focus();
    requestAnimationFrame(this.frame);
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private frame = (now: number): void => {
    if (!this.running) return;
    requestAnimationFrame(this.frame);

    let frameDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (frameDt > MAX_FRAME_DT) frameDt = MAX_FRAME_DT;
    if (frameDt < 0) frameDt = 0;

    // 1. input → command
    const snap = this.input.poll();
    this.cameraCtl.applyDrag(snap.dragDelta.dx, snap.dragDelta.dy);
    this.cameraCtl.applyWheel(snap.wheelDelta);
    // Edge presses are OR-accumulated into `pending` so a zero-step frame does not lose them.
    let cmd = buildCommand(snap, this.cameraCtl.yaw, this.pending);
    this.pending.jump = cmd.jump;
    this.pending.attack = cmd.attack;
    this.pending.interact = cmd.interact;

    // 2. fixed steps
    const events = this.frameEvents;
    events.length = 0;
    this.accumulator += frameDt;
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
      const out = stepSimulation(this.state, cmd, FIXED_DT);
      for (const e of out) events.push(e);
      this.accumulator -= FIXED_DT;
      steps++;
      if (cmd.jump || cmd.attack || cmd.interact) {
        // first step consumed the edges: clear both the command and the pending buffer
        cmd = { ...cmd, jump: false, attack: false, interact: false };
        this.pending.jump = false; this.pending.attack = false; this.pending.interact = false;
      }
    }
    if (steps === MAX_STEPS_PER_FRAME) this.accumulator = 0;  // drop backlog after a long stall

    // 3–5. camera, views, HUD
    this.cameraCtl.update(this.state.player, frameDt);
    this.playerView.sync(this.state, frameDt);
    this.monsterView.sync(this.state, frameDt);
    this.npcView.sync(this.state, frameDt);
    this.hud.update(this.state, events, frameDt);

    // 6. save
    persistence.maybeSave(this.state, events, frameDt);

    // 7. render
    this.renderer.render(this.scene, this.camera);
  };
}
