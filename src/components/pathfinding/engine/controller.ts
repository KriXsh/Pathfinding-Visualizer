import {OP_VISIT, search, type SearchResult} from './algorithms';
import {
  type AlgorithmId,
  EMPTY,
  FRONTIER,
  type Kind,
  type MazeId,
  PATH,
  type Status,
  type Tool,
  VISITED,
  WALL,
  WEIGHT,
  WEIGHT_COST,
} from './constants';
import {GridStore} from './grid-store';
import {generateMaze} from './mazes';

export type UiSnapshot = {
  store: GridStore;
  status: Status;
  algorithm: AlgorithmId;
  tool: Tool;
  speed: number;
  dragging: 'start' | 'end' | null;
  visited: number;
  pathLength: number;
  cost: number;
  timeMs: number | null;
  /** 0-1 through the current replay. */
  progress: number;
};

const odd = (x: number) => Math.max(1, x % 2 ? x : x - 1);

/** Slider 0-100 → visited nodes per second, roughly 6 to 1,500 on a log scale. */
export const stepsPerSecond = (speed: number) => 6 * Math.pow(250, speed / 100);

function defaultMarkers(rows: number, cols: number) {
  const r = odd(Math.floor(rows / 2));
  const inset = Math.floor(cols / 5);
  return {start: r * cols + odd(inset), end: r * cols + odd(cols - 1 - inset)};
}

/**
 * Owns the grid, the replay loop and user edits. Algorithms run to completion
 * in well under a millisecond; what the user watches is a replay of the
 * recorded ops, paced by requestAnimationFrame against the *current* speed so
 * moving the slider mid-run never restarts or stutters the animation.
 */
export class Controller {
  private store: GridStore;
  private status: Status = 'idle';
  private algorithm: AlgorithmId = 'dijkstra';
  private tool: Tool = 'wall';
  private speed = 55;
  private dragging: 'start' | 'end' | null = null;

  private result: SearchResult | null = null;
  private placements: number[] = [];
  private phase: 'search' | 'path' | 'maze' | null = null;
  private cursor = 0;
  private visitsShown = 0;
  private pathShown = 0;
  private costShown = 0;
  private budget = 0;
  private hold = 0;
  private raf = 0;
  private last = 0;

  private paintKind: Kind | null = null;
  private lastIdx = -1;

  private listeners = new Set<() => void>();
  private snap: UiSnapshot;

  constructor(rows: number, cols: number) {
    const {start, end} = defaultMarkers(rows, cols);
    this.store = new GridStore(rows, cols, start, end);
    this.snap = this.buildSnapshot();
  }

  // --- external store ------------------------------------------------------

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  };

  getSnapshot = () => this.snap;

  private buildSnapshot(): UiSnapshot {
    const r = this.result;
    const total =
      this.phase === 'maze'
        ? this.placements.length
        : r
          ? r.ops.length + r.path.length
          : 0;
    const done =
      this.phase === 'maze'
        ? this.cursor
        : this.phase === 'path'
          ? (r?.ops.length ?? 0) + this.pathShown
          : this.cursor;
    return {
      store: this.store,
      status: this.status,
      algorithm: this.algorithm,
      tool: this.tool,
      speed: this.speed,
      dragging: this.dragging,
      visited: this.visitsShown,
      // Moves, not cells: a path of n cells is n - 1 steps long.
      pathLength: Math.max(0, this.pathShown - 1),
      cost: this.costShown,
      timeMs: r ? r.timeMs : null,
      progress:
        this.status === 'found' || this.status === 'unreachable'
          ? 1
          : total
            ? done / total
            : 0,
    };
  }

  private emit() {
    this.snap = this.buildSnapshot();
    this.listeners.forEach(fn => fn());
  }

  get busy() {
    return this.status === 'exploring' || this.status === 'building';
  }

  private get live() {
    return this.status === 'found' || this.status === 'unreachable';
  }

  // --- settings --------------------------------------------------------------

  setAlgorithm(a: AlgorithmId) {
    if (a === this.algorithm) return;
    this.algorithm = a;
    if (this.status !== 'building') this.reset(false);
    this.emit();
  }

  setTool(t: Tool) {
    this.tool = t;
    this.emit();
  }

  toggleTool() {
    this.setTool(this.tool === 'wall' ? 'weight' : 'wall');
  }

  /** Read by the next animation frame; the replay carries on at the new pace. */
  setSpeed(s: number) {
    this.speed = s;
    this.emit();
  }

  /** Swap in a grid of a new size, keeping whatever drawing still fits. */
  resize(rows: number, cols: number) {
    const old = this.store;
    if (old.rows === rows && old.cols === cols) return;
    this.stopLoop();
    const fallback = defaultMarkers(rows, cols);
    const carry = (i: number) => {
      const r = (i / old.cols) | 0;
      const c = i - r * old.cols;
      return r < rows && c < cols ? r * cols + c : -1;
    };
    let start = carry(old.start);
    let end = carry(old.end);
    if (start < 0 || end < 0 || start === end) ({start, end} = fallback);
    const next = new GridStore(rows, cols, start, end);
    for (let i = 0; i < old.n; i++) {
      const j = carry(i);
      if (j >= 0 && j !== start && j !== end) next.kinds[j] = old.kinds[i];
    }
    this.store = next;
    this.clearRunState();
    this.status = 'idle';
    this.emit();
  }

  // --- playback ----------------------------------------------------------------

  /** The main button: visualise, pause, resume or replay depending on state. */
  toggle() {
    if (this.status === 'building') return;
    if (this.status === 'exploring') return this.pause();
    if (this.status === 'paused') return this.resume();
    this.run();
  }

  run() {
    this.stopLoop();
    this.store.instant = false;
    this.store.clearVis();
    this.clearRunState();
    this.result = search(this.algorithm, this.model());
    this.phase = 'search';
    this.status = 'exploring';
    this.startLoop();
    this.emit();
  }

  pause() {
    if (this.status !== 'exploring') return;
    this.stopLoop();
    this.status = 'paused';
    this.emit();
  }

  resume() {
    if (this.status !== 'paused') return;
    this.status = 'exploring';
    this.startLoop();
    this.emit();
  }

  /** Wipe the visualisation (and optionally the drawing) back to idle. */
  reset(clearBoard: boolean) {
    this.stopLoop();
    this.store.instant = false;
    this.store.clearVis();
    if (clearBoard) this.store.clearKinds();
    this.clearRunState();
    this.status = 'idle';
    this.emit();
  }

  buildMaze(id: MazeId) {
    this.reset(true);
    const {rows, cols, start, end} = this.store;
    this.placements = generateMaze(id, rows, cols, start, end);
    this.phase = 'maze';
    this.status = 'building';
    this.startLoop();
    this.emit();
  }

  dispose() {
    this.stopLoop();
  }

  private model() {
    const {rows, cols, kinds, start, end} = this.store;
    return {rows, cols, kinds, start, end};
  }

  private clearRunState() {
    this.result = null;
    this.placements = [];
    this.phase = null;
    this.cursor = this.visitsShown = this.pathShown = this.costShown = 0;
    this.budget = this.hold = 0;
  }

  private startLoop() {
    this.last = performance.now();
    this.budget = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  private stopLoop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private tick = (now: number) => {
    // Clamp so a backgrounded tab doesn't dump thousands of steps at once.
    const dt = Math.min(now - this.last, 64);
    this.last = now;
    const sps = stepsPerSecond(this.speed);

    if (this.phase === 'maze') this.stepMaze(dt, sps);
    else if (this.phase === 'search') this.stepSearch(dt, sps);
    else if (this.phase === 'path') this.stepPath(dt, sps);

    if (this.phase) this.raf = requestAnimationFrame(this.tick);
    this.emit();
  };

  private stepMaze(dt: number, sps: number) {
    this.budget += (dt * (240 + sps)) / 1000;
    const {store, placements} = this;
    while (this.budget >= 1 && this.cursor < placements.length) {
      const p = placements[this.cursor++];
      store.setKind(p >> 2, (p & 3) as Kind);
      this.budget--;
    }
    if (this.cursor >= placements.length) {
      this.phase = null;
      this.status = 'idle';
    }
  }

  private stepSearch(dt: number, sps: number) {
    const r = this.result!;
    this.budget += (dt * sps) / 1000;
    // Only visits spend budget; the frontier ops between them ride along free.
    while (this.cursor < r.ops.length) {
      const op = r.ops[this.cursor];
      const isVisit = (op & 3) === OP_VISIT;
      if (isVisit && this.budget < 1) break;
      this.applyOp(op, r);
      if (isVisit) this.budget--;
      this.cursor++;
    }
    if (this.cursor >= r.ops.length) {
      this.budget = 0;
      if (r.path.length) {
        this.phase = 'path';
        this.hold = 220;
      } else {
        this.finish();
      }
    }
  }

  private stepPath(dt: number, sps: number) {
    if (this.hold > 0) {
      this.hold -= dt;
      return;
    }
    const path = this.result!.path;
    this.budget += (dt * Math.min(Math.max(sps * 0.35, 14), 110)) / 1000;
    while (this.budget >= 1 && this.pathShown < path.length) {
      this.applyPathStep(path, this.pathShown++);
      this.budget--;
    }
    if (this.pathShown >= path.length) this.finish();
  }

  private applyOp(op: number, r: SearchResult) {
    const i = op >> 2;
    const {store} = this;
    if ((op & 3) === OP_VISIT) {
      this.visitsShown++;
      if (i !== store.start && i !== store.end) {
        const tone = Math.round(
          (255 * (this.visitsShown - 1)) / Math.max(1, r.visits - 1),
        );
        store.setVis(i, VISITED, tone);
      }
    } else if (i !== store.end) {
      store.setVis(i, FRONTIER);
    }
  }

  private applyPathStep(path: number[], k: number) {
    const i = path[k];
    const {store} = this;
    if (k > 0) this.costShown += store.kinds[i] === WEIGHT ? WEIGHT_COST : 1;
    if (i !== store.start && i !== store.end) store.setVis(i, PATH);
  }

  private finish() {
    this.phase = null;
    this.status = this.result?.path.length ? 'found' : 'unreachable';
    this.pathShown = this.result?.path.length ?? 0;
  }

  /** After a finished run, every edit re-solves and redraws in one frame. */
  private reroute() {
    const r = search(this.algorithm, this.model());
    this.result = r;
    const {store} = this;
    store.instant = true;
    store.clearVis();
    this.visitsShown = this.costShown = this.pathShown = 0;
    for (const op of r.ops) this.applyOp(op, r);
    for (let k = 0; k < r.path.length; k++) this.applyPathStep(r.path, k);
    this.finish();
    this.emit();
  }

  // --- editing -------------------------------------------------------------

  pointerDown(i: number) {
    if (this.busy) return;
    if (this.status === 'paused') this.reset(false);
    const {store} = this;
    this.lastIdx = i;
    if (i === store.start || i === store.end) {
      this.dragging = i === store.start ? 'start' : 'end';
      this.emit();
      return;
    }
    const kind = this.tool === 'wall' ? WALL : WEIGHT;
    // The first cell decides: pressing on your own tool erases, anything else paints.
    this.paintKind = store.kinds[i] === kind ? EMPTY : kind;
    this.paint(i);
    if (this.live) this.reroute();
  }

  pointerMove(i: number) {
    if (i === this.lastIdx || this.busy) return;
    const from = this.lastIdx;
    this.lastIdx = i;
    if (this.dragging) {
      if (this.store.moveMarker(this.dragging, i) && this.live) this.reroute();
      return;
    }
    if (this.paintKind === null || from < 0) return;
    // Fill in the cells between pointer events so fast strokes stay unbroken.
    const {cols} = this.store;
    let r0 = (from / cols) | 0;
    let c0 = from - r0 * cols;
    const r1 = (i / cols) | 0;
    const c1 = i - r1 * cols;
    const dr = Math.abs(r1 - r0);
    const dc = Math.abs(c1 - c0);
    const sr = r0 < r1 ? 1 : -1;
    const sc = c0 < c1 ? 1 : -1;
    let err = dc - dr;
    for (;;) {
      this.paint(r0 * cols + c0);
      if (r0 === r1 && c0 === c1) break;
      const e2 = 2 * err;
      if (e2 > -dr) {
        err -= dr;
        c0 += sc;
      }
      if (e2 < dc) {
        err += dc;
        r0 += sr;
      }
    }
    if (this.live) this.reroute();
  }

  pointerUp() {
    this.paintKind = null;
    this.lastIdx = -1;
    if (this.dragging) {
      this.dragging = null;
      this.emit();
    }
  }

  private paint(i: number) {
    const {store} = this;
    if (i === store.start || i === store.end || this.paintKind === null) return;
    store.setKind(i, this.paintKind);
  }
}
