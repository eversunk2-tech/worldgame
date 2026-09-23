// Keyboard + mouse state collection. No pointer lock; left-drag rotates the camera.

export const KEYS = {
  forward: 'KeyW',
  back: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  jump: 'Space',
  attack: 'KeyF',
  interact: 'KeyE',
} as const;

const SCROLL_BLOCK = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export interface InputSnapshot {
  keysDown: ReadonlySet<string>;
  keysPressed: ReadonlySet<string>;
  dragDelta: { dx: number; dy: number };
  wheelDelta: number;
}

export class Input {
  readonly keysDown = new Set<string>();
  private keysPressed = new Set<string>();
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private dragDx = 0;
  private dragDy = 0;
  private wheel = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    // Key events on window so focus never gets stuck on the HUD button.
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mouseleave', this.onMouseUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Read and clear per-frame accumulators. */
  poll(): InputSnapshot {
    const snap: InputSnapshot = {
      keysDown: this.keysDown,
      keysPressed: new Set(this.keysPressed),
      dragDelta: { dx: this.dragDx, dy: this.dragDy },
      wheelDelta: this.wheel,
    };
    this.keysPressed.clear();
    this.dragDx = 0; this.dragDy = 0;
    this.wheel = 0;
    return snap;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (SCROLL_BLOCK.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    this.keysDown.add(e.code);
    this.keysPressed.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.code);
  };

  private onBlur = (): void => {
    this.keysDown.clear();
    this.dragging = false;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    this.dragging = true;
    this.lastX = e.clientX; this.lastY = e.clientY;
    this.canvas.focus();
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.dragging) return;
    this.dragDx += e.clientX - this.lastX;
    this.dragDy += e.clientY - this.lastY;
    this.lastX = e.clientX; this.lastY = e.clientY;
  };

  private onMouseUp = (): void => {
    this.dragging = false;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.wheel += e.deltaY;
  };
}
