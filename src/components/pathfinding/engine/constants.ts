// Shared vocabulary for the pathfinding engine. Cells are addressed by a flat
// index (row * cols + col) and their state lives in typed arrays, so the hot
// loops never allocate and React only hears about the cells that changed.

/** What a cell *is* (drawn by the user or a maze). */
export const EMPTY = 0;
export const WALL = 1;
export const WEIGHT = 2;
export type Kind = typeof EMPTY | typeof WALL | typeof WEIGHT;

/** What the visualisation has done to a cell. */
export const IDLE = 0;
export const FRONTIER = 1;
export const VISITED = 2;
export const PATH = 3;
export type Vis = typeof IDLE | typeof FRONTIER | typeof VISITED | typeof PATH;

/** Stepping onto a weight costs this much instead of 1. */
export const WEIGHT_COST = 10;

export type AlgorithmId = 'dijkstra' | 'astar' | 'bfs' | 'dfs';
export type MazeId = 'recursive-division' | 'random-walls' | 'weight-clusters';
export type Tool = 'wall' | 'weight';
export type Status =
  'idle' | 'building' | 'exploring' | 'paused' | 'found' | 'unreachable';

export const ALGORITHMS: Record<
  AlgorithmId,
  {
    name: string;
    short: string;
    weighted: boolean;
    shortest: boolean;
    complexity: string;
    blurb: string;
  }
> = {
  dijkstra: {
    name: "Dijkstra's Algorithm",
    short: 'Dijkstra',
    weighted: true,
    shortest: true,
    complexity: 'O((V + E) log V)',
    blurb:
      'Settles nodes in order of total cost from the start, relaxing each neighbour. Weights bend the wavefront around them.',
  },
  astar: {
    name: 'A* Search',
    short: 'A*',
    weighted: true,
    shortest: true,
    complexity: 'O(E log V)',
    blurb:
      'Dijkstra plus a Manhattan-distance heuristic, so the frontier leans toward the target and explores far less.',
  },
  bfs: {
    name: 'Breadth-First Search',
    short: 'BFS',
    weighted: false,
    shortest: true,
    complexity: 'O(V + E)',
    blurb:
      'Expands in rings of equal hop count. Shortest by number of steps, but blind to weights.',
  },
  dfs: {
    name: 'Depth-First Search',
    short: 'DFS',
    weighted: false,
    shortest: false,
    complexity: 'O(V + E)',
    blurb:
      'Dives down one branch as far as it can before backtracking. Finds a path, rarely a short one.',
  },
};

export const MAZES: Record<MazeId, {name: string; hint: string}> = {
  'recursive-division': {
    name: 'Recursive Division',
    hint: 'Corridors carved by splitting chambers',
  },
  'random-walls': {
    name: 'Random Walls',
    hint: 'Scattered obstacles, ~28% density',
  },
  'weight-clusters': {
    name: 'Weight Clusters',
    hint: 'Costly terrain for Dijkstra and A*',
  },
};
