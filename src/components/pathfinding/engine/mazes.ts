import {type Kind, type MazeId, WALL, WEIGHT} from './constants';

/** A maze is an ordered list of placements, `idx * 4 + kind`, replayed so the
    walls appear in the order the generator laid them. Start and end are never
    covered. */
export function generateMaze(
  id: MazeId,
  rows: number,
  cols: number,
  start: number,
  end: number,
): number[] {
  const out: number[] = [];
  const place = (i: number, kind: Kind) => {
    if (i !== start && i !== end) out.push(i * 4 + kind);
  };
  if (id === 'recursive-division') recursiveDivision(rows, cols, place);
  else if (id === 'random-walls') randomWalls(rows, cols, place);
  else weightClusters(rows, cols, place);
  return out;
}

const rand = (n: number) => Math.floor(Math.random() * n);

/** Walls sit on even rows/cols and passages on odd ones, which is why the grid
    and the start/end markers are kept on odd coordinates. */
function recursiveDivision(
  rows: number,
  cols: number,
  place: (i: number, k: Kind) => void,
) {
  for (let c = 0; c < cols; c++) place(c, WALL);
  for (let r = 1; r < rows; r++) place(r * cols + cols - 1, WALL);
  for (let c = cols - 2; c >= 0; c--) place((rows - 1) * cols + c, WALL);
  for (let r = rows - 2; r > 0; r--) place(r * cols, WALL);

  const divide = (r0: number, r1: number, c0: number, c1: number) => {
    const h = r1 - r0;
    const w = c1 - c0;
    if (h < 2 || w < 2) return;
    const horizontal = h > w || (h === w && Math.random() < 0.5);
    if (horizontal) {
      const wall = r0 + 1 + 2 * rand(h / 2);
      const gap = c0 + 2 * rand(w / 2 + 1);
      for (let c = c0; c <= c1; c++)
        if (c !== gap) place(wall * cols + c, WALL);
      divide(r0, wall - 1, c0, c1);
      divide(wall + 1, r1, c0, c1);
    } else {
      const wall = c0 + 1 + 2 * rand(w / 2);
      const gap = r0 + 2 * rand(h / 2 + 1);
      for (let r = r0; r <= r1; r++)
        if (r !== gap) place(r * cols + wall, WALL);
      divide(r0, r1, c0, wall - 1);
      divide(r0, r1, wall + 1, c1);
    }
  };
  divide(1, rows - 2, 1, cols - 2);
}

function randomWalls(
  rows: number,
  cols: number,
  place: (i: number, k: Kind) => void,
) {
  const picks: number[] = [];
  for (let i = 0; i < rows * cols; i++) if (Math.random() < 0.28) picks.push(i);
  // Shuffle so they rain in rather than sweep row by row.
  for (let i = picks.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  picks.forEach(i => place(i, WALL));
}

/** Organic blobs grown from random seeds. */
function weightClusters(
  rows: number,
  cols: number,
  place: (i: number, k: Kind) => void,
) {
  const n = rows * cols;
  const taken = new Uint8Array(n);
  const seeds = Math.max(4, Math.round(n / 160));
  for (let s = 0; s < seeds; s++) {
    const target = 10 + rand(Math.round(n / 45));
    const frontier = [rand(n)];
    let grown = 0;
    while (frontier.length && grown < target) {
      const i = frontier.splice(rand(frontier.length), 1)[0];
      if (taken[i]) continue;
      taken[i] = 1;
      place(i, WEIGHT);
      grown++;
      const r = (i / cols) | 0;
      const c = i - r * cols;
      if (r > 0) frontier.push(i - cols);
      if (r < rows - 1) frontier.push(i + cols);
      if (c > 0) frontier.push(i - 1);
      if (c < cols - 1) frontier.push(i + 1);
    }
  }
}
