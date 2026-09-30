import {EMPTY, IDLE, type Kind, type Vis, WALL} from './constants';

/**
 * Mutable grid state with one subscription slot per cell. The replay loop
 * writes straight into the typed arrays and pings only the cells it touched,
 * so a 1,700-cell board re-renders a handful of cells per frame instead of
 * reconciling the whole tree.
 */
export class GridStore {
  readonly n: number;
  readonly kinds: Uint8Array;
  readonly vis: Uint8Array;
  /** Position of a visited cell in the exploration order, 0-255, for the colour ramp. */
  readonly tone: Uint8Array;
  /** Set during live re-routing: cells jump to their new state without animating. */
  instant = false;
  start: number;
  end: number;

  private cellFns: ((() => void) | undefined)[];
  private markerFns = new Set<() => void>();

  constructor(
    readonly rows: number,
    readonly cols: number,
    start: number,
    end: number,
  ) {
    this.n = rows * cols;
    this.kinds = new Uint8Array(this.n);
    this.vis = new Uint8Array(this.n);
    this.tone = new Uint8Array(this.n);
    this.cellFns = new Array(this.n);
    this.start = start;
    this.end = end;
  }

  // --- subscriptions (shaped for useSyncExternalStore) ---------------------

  subscribeCell(i: number, fn: () => void) {
    this.cellFns[i] = fn;
    return () => {
      if (this.cellFns[i] === fn) this.cellFns[i] = undefined;
    };
  }

  /** Everything a cell renders, packed into one number so React can compare it. */
  cellSnapshot(i: number) {
    return (
      this.kinds[i] |
      (this.vis[i] << 2) |
      (this.tone[i] << 4) |
      (this.instant ? 1 << 12 : 0)
    );
  }

  subscribeMarkers = (fn: () => void) => {
    this.markerFns.add(fn);
    return () => void this.markerFns.delete(fn);
  };

  markerSnapshot = () => this.start * 8192 + this.end;

  // --- writes ---------------------------------------------------------------

  setKind(i: number, kind: Kind) {
    if (this.kinds[i] === kind && this.vis[i] === IDLE) return;
    this.kinds[i] = kind;
    this.vis[i] = IDLE;
    this.tone[i] = 0;
    this.cellFns[i]?.();
  }

  setVis(i: number, vis: Vis, tone = 0) {
    if (this.vis[i] === vis && this.tone[i] === tone) return;
    this.vis[i] = vis;
    this.tone[i] = tone;
    this.cellFns[i]?.();
  }

  clearVis() {
    for (let i = 0; i < this.n; i++)
      if (this.vis[i] !== IDLE) this.setVis(i, IDLE);
  }

  clearKinds() {
    for (let i = 0; i < this.n; i++)
      if (this.kinds[i] !== EMPTY) this.setKind(i, EMPTY);
  }

  moveMarker(which: 'start' | 'end', i: number) {
    const other = which === 'start' ? this.end : this.start;
    if (i === other || i === this[which] || this.kinds[i] === WALL)
      return false;
    this[which] = i;
    this.markerFns.forEach(fn => fn());
    return true;
  }
}
