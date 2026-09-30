import {type AlgorithmId, WALL, WEIGHT, WEIGHT_COST} from './constants';
import {MinHeap} from './heap';

export type GridModel = {
  rows: number;
  cols: number;
  kinds: Uint8Array;
  start: number;
  end: number;
};

/** A search is computed up front, then replayed. Each op packs a cell index
    and what happened to it: `idx * 4 + OP_*`. */
export const OP_FRONTIER = 1;
export const OP_VISIT = 2;

export type SearchResult = {
  ops: number[];
  /** Number of OP_VISIT entries in `ops`. */
  visits: number;
  /** start → end inclusive, empty when the target is unreachable. */
  path: number[];
  cost: number;
  timeMs: number;
};

const stepCost = (g: GridModel, i: number) =>
  g.kinds[i] === WEIGHT ? WEIGHT_COST : 1;

/** Up, right, down, left. Writes into `out` and returns how many it wrote. */
function neighbours(g: GridModel, i: number, out: Int32Array): number {
  const {cols, rows} = g;
  const r = (i / cols) | 0;
  const c = i - r * cols;
  let n = 0;
  if (r > 0) out[n++] = i - cols;
  if (c < cols - 1) out[n++] = i + 1;
  if (r < rows - 1) out[n++] = i + cols;
  if (c > 0) out[n++] = i - 1;
  return n;
}

function manhattan(g: GridModel, a: number, b: number) {
  const ar = (a / g.cols) | 0;
  const br = (b / g.cols) | 0;
  return Math.abs(ar - br) + Math.abs(a - ar * g.cols - (b - br * g.cols));
}

type Trace = {ops: number[]; visits: number; prev: Int32Array};

/** Dijkstra, or A* when `heuristic` is set (Manhattan distance, admissible
    because every step costs at least 1). Ties go to the node nearer the goal. */
function bestFirst(g: GridModel, heuristic: boolean): Trace {
  const n = g.rows * g.cols;
  const dist = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const nb = new Int32Array(4);
  const heap = new MinHeap();
  const ops: number[] = [];
  let visits = 0;

  const h = (i: number) => (heuristic ? manhattan(g, i, g.end) : 0);
  dist[g.start] = 0;
  heap.push(g.start, h(g.start), h(g.start));

  while (heap.size) {
    const u = heap.pop();
    if (closed[u]) continue; // stale entry left behind by a later relaxation
    closed[u] = 1;
    ops.push(u * 4 + OP_VISIT);
    visits++;
    if (u === g.end) break;
    for (let k = neighbours(g, u, nb) - 1; k >= 0; k--) {
      const v = nb[k];
      if (closed[v] || g.kinds[v] === WALL) continue;
      const d = dist[u] + stepCost(g, v);
      if (d >= dist[v]) continue;
      if (dist[v] === Infinity) ops.push(v * 4 + OP_FRONTIER);
      dist[v] = d;
      prev[v] = u;
      heap.push(v, d + h(v), h(v));
    }
  }
  return {ops, visits, prev};
}

function bfs(g: GridModel): Trace {
  const n = g.rows * g.cols;
  const prev = new Int32Array(n).fill(-1);
  const seen = new Uint8Array(n);
  const queue = new Int32Array(n);
  const nb = new Int32Array(4);
  const ops: number[] = [];
  let head = 0;
  let tail = 0;
  let visits = 0;

  queue[tail++] = g.start;
  seen[g.start] = 1;
  while (head < tail) {
    const u = queue[head++];
    ops.push(u * 4 + OP_VISIT);
    visits++;
    if (u === g.end) break;
    const count = neighbours(g, u, nb);
    for (let k = 0; k < count; k++) {
      const v = nb[k];
      if (seen[v] || g.kinds[v] === WALL) continue;
      seen[v] = 1;
      prev[v] = u;
      queue[tail++] = v;
      ops.push(v * 4 + OP_FRONTIER);
    }
  }
  return {ops, visits, prev};
}

function dfs(g: GridModel): Trace {
  const n = g.rows * g.cols;
  const prev = new Int32Array(n).fill(-1);
  const visited = new Uint8Array(n);
  const flagged = new Uint8Array(n);
  const nb = new Int32Array(4);
  const ops: number[] = [];
  // Parent travels with each entry: a cell can be pushed several times, and
  // its tree parent is whoever pushed the copy that gets popped first.
  const stack: number[] = [g.start, -1];
  let visits = 0;

  while (stack.length) {
    const parent = stack.pop()!;
    const u = stack.pop()!;
    if (visited[u]) continue;
    visited[u] = 1;
    prev[u] = parent;
    ops.push(u * 4 + OP_VISIT);
    visits++;
    if (u === g.end) break;
    // Pushed in reverse so "up" is explored first.
    for (let k = neighbours(g, u, nb) - 1; k >= 0; k--) {
      const v = nb[k];
      if (visited[v] || g.kinds[v] === WALL) continue;
      stack.push(v, u);
      if (!flagged[v]) {
        flagged[v] = 1;
        ops.push(v * 4 + OP_FRONTIER);
      }
    }
  }
  return {ops, visits, prev};
}

export function search(algorithm: AlgorithmId, g: GridModel): SearchResult {
  const t0 = performance.now();
  const trace =
    algorithm === 'bfs'
      ? bfs(g)
      : algorithm === 'dfs'
        ? dfs(g)
        : bestFirst(g, algorithm === 'astar');

  const path: number[] = [];
  const reached =
    trace.ops.length > 0 &&
    trace.ops[trace.ops.length - 1] === g.end * 4 + OP_VISIT;
  if (reached) {
    for (let at = g.end; at !== -1; at = trace.prev[at]) path.push(at);
    path.reverse();
  }
  // BFS and DFS ignore weights while searching, but the cost shown is what
  // walking their path would actually cost.
  let cost = 0;
  for (let k = 1; k < path.length; k++) cost += stepCost(g, path[k]);

  return {
    ops: trace.ops,
    visits: trace.visits,
    path,
    cost,
    timeMs: performance.now() - t0,
  };
}
