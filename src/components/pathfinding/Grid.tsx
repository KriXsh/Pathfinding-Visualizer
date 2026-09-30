'use client';

import {memo, useRef, useSyncExternalStore} from 'react';
import {motion, type TargetAndTransition, type Transition} from 'framer-motion';
import {ChevronsRight, Crosshair, Mountain} from 'lucide-react';
import {cn} from '@/lib/utils';
import {FRONTIER, IDLE, PATH, VISITED, WALL, WEIGHT} from './engine/constants';
import type {Controller} from './engine/controller';
import type {GridStore} from './engine/grid-store';

// Fill colours are literal (not CSS variables) so framer-motion can tween them.
const C = {
  wall: 'rgba(71, 85, 105, 1)',
  weight: 'rgba(139, 92, 246, 0.16)',
  frontier: 'rgba(34, 211, 238, 0.95)',
  path: 'rgba(245, 158, 11, 1)',
  // Idle cells still carry a colour: without a known start value framer-motion
  // falls back to getComputedStyle, which forces a style recalc per cell.
  none: 'rgba(34, 211, 238, 0)',
};
const NO_GLOW = '0 0 0px rgba(0, 0, 0, 0)';
const SPRING = {type: 'spring', stiffness: 300, damping: 20} as const;

/** Exploration order → colour: deep violet near the start, vibrant blue at the edge. */
const RAMP = [
  [124, 58, 237],
  [99, 102, 241],
  [59, 130, 246],
];
function toneColor(tone: number) {
  const t = (tone / 255) * (RAMP.length - 1);
  const k = Math.min(Math.floor(t), RAMP.length - 2);
  const f = t - k;
  const [a, b] = [RAMP[k], RAMP[k + 1]];
  const ch = (j: number) => Math.round(a[j] + (b[j] - a[j]) * f);
  return `rgba(${ch(0)}, ${ch(1)}, ${ch(2)}, 0.88)`;
}

function fillFor(
  kind: number,
  vis: number,
  tone: number,
): {animate: TargetAndTransition; transition: Transition} {
  if (kind === WALL)
    return {
      animate: {
        opacity: 1,
        scale: 1,
        borderRadius: '14%',
        backgroundColor: C.wall,
        boxShadow: NO_GLOW,
      },
      transition: {scale: SPRING, default: {duration: 0.2}},
    };
  if (vis === PATH)
    return {
      animate: {
        opacity: 1,
        scale: [1, 1.3, 1],
        borderRadius: '22%',
        backgroundColor: C.path,
        boxShadow: '0 0 15px rgba(245, 158, 11, 0.85)',
      },
      transition: {
        scale: {duration: 0.45, times: [0, 0.4, 1], ease: 'easeOut'},
        default: {duration: 0.3},
      },
    };
  if (vis === VISITED)
    return {
      animate: {
        opacity: 1,
        scale: [0.45, 1.2, 1],
        borderRadius: ['50%', '35%', '18%'],
        backgroundColor: [C.frontier, toneColor(tone)],
        boxShadow: NO_GLOW,
      },
      transition: {
        scale: {duration: 0.55, times: [0, 0.45, 1], ease: 'easeOut'},
        borderRadius: {duration: 0.45},
        backgroundColor: {duration: 0.6, ease: 'easeOut'},
        default: {duration: 0.25},
      },
    };
  if (vis === FRONTIER)
    return {
      animate: {
        opacity: 1,
        scale: 0.45,
        borderRadius: '50%',
        backgroundColor: C.frontier,
        boxShadow: NO_GLOW,
      },
      transition: SPRING,
    };
  if (kind === WEIGHT)
    return {
      animate: {
        opacity: 1,
        scale: 0.84,
        borderRadius: '28%',
        backgroundColor: C.weight,
        boxShadow: NO_GLOW,
      },
      transition: {scale: SPRING, default: {duration: 0.2}},
    };
  return {
    animate: {
      opacity: 0,
      scale: 0.3,
      borderRadius: '50%',
      backgroundColor: C.none,
      boxShadow: NO_GLOW,
    },
    transition: {duration: 0.25},
  };
}

const Cell = memo(function Cell({
  store,
  i,
  delay,
}: {
  store: GridStore;
  i: number;
  delay: number;
}) {
  const s = useSyncExternalStore(
    fn => store.subscribeCell(i, fn),
    () => store.cellSnapshot(i),
    () => 0,
  );
  const kind = s & 3;
  const vis = (s >> 2) & 3;
  const instant = (s >> 12) & 1;
  const {animate, transition} = fillFor(kind, vis, (s >> 4) & 255);

  return (
    <div
      className={cn(
        // Borders rather than grid gaps: they snap to whole pixels, gaps between fractional cells don't.
        'relative aspect-square animate-pf-cell-in border-t border-l border-pf-line bg-pf-canvas transition-colors duration-150 hover:bg-primary/20',
        // Lift path cells so their glow spills over the neighbours painted after them.
        vis === PATH && 'z-[1]',
      )}
      style={{animationDelay: `${delay}ms`}}
    >
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={animate}
        transition={instant && kind !== WALL ? {duration: 0} : transition}
      />
      {kind === WEIGHT && (
        <Mountain
          aria-hidden
          strokeWidth={2.4}
          className={cn(
            'absolute inset-[18%] z-[2] size-[64%] transition-colors',
            vis === IDLE ? 'text-pf-weight' : 'text-white',
          )}
        />
      )}
    </div>
  );
});

function Marker({
  kind,
  index,
  cols,
  dragging,
}: {
  kind: 'start' | 'end';
  index: number;
  cols: number;
  dragging: boolean;
}) {
  const row = Math.floor(index / cols);
  const col = index - row * cols;
  const start = kind === 'start';
  return (
    <motion.div
      layout
      transition={{type: 'spring', stiffness: 520, damping: 34}}
      style={{gridRowStart: row + 1, gridColumnStart: col + 1}}
      className="relative z-10 flex items-center justify-center"
    >
      <motion.span
        animate={{scale: dragging ? 1.35 : 1}}
        transition={SPRING}
        className="relative flex size-full items-center justify-center"
      >
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 animate-pf-pulse rounded-full',
            start ? 'bg-pf-start/50' : 'bg-pf-target/50',
          )}
        />
        {start ? (
          <span className="relative flex size-[92%] items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 shadow-[0_0_14px_rgba(52,211,153,0.85)] ring-2 ring-emerald-200/60">
            <ChevronsRight
              aria-hidden
              strokeWidth={3}
              className="size-[72%] text-emerald-950"
            />
          </span>
        ) : (
          <span className="relative flex size-[96%] items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_0_14px_rgba(251,113,133,0.9)] ring-2 ring-rose-200/60">
            <Crosshair
              aria-hidden
              strokeWidth={2.6}
              className="size-[80%] animate-pf-spin text-white"
            />
          </span>
        )}
      </motion.span>
    </motion.div>
  );
}

function Markers({
  store,
  dragging,
}: {
  store: GridStore;
  dragging: 'start' | 'end' | null;
}) {
  const s = useSyncExternalStore(
    store.subscribeMarkers,
    store.markerSnapshot,
    () => 0,
  );
  const start = Math.floor(s / 8192);
  const end = s % 8192;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid"
      style={{
        gridTemplateColumns: `repeat(${store.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${store.rows}, minmax(0, 1fr))`,
      }}
    >
      <Marker
        kind="start"
        index={start}
        cols={store.cols}
        dragging={dragging === 'start'}
      />
      <Marker
        kind="end"
        index={end}
        cols={store.cols}
        dragging={dragging === 'end'}
      />
    </div>
  );
}

export function Grid({
  controller,
  store,
  dragging,
}: {
  controller: Controller;
  store: GridStore;
  dragging: 'start' | 'end' | null;
}) {
  const rect = useRef<DOMRect | null>(null);
  const active = useRef(false);
  const {rows, cols} = store;

  const indexAt = (x: number, y: number) => {
    const r = rect.current!;
    const col = Math.min(
      cols - 1,
      Math.max(0, Math.floor(((x - r.left) / r.width) * cols)),
    );
    const row = Math.min(
      rows - 1,
      Math.max(0, Math.floor(((y - r.top) / r.height) * rows)),
    );
    return row * cols + col;
  };

  const end = () => {
    active.current = false;
    controller.pointerUp();
  };

  return (
    <div
      role="application"
      aria-label={`Pathfinding grid, ${cols} by ${rows}. Drag to draw walls or weights, drag the start and target markers to move them.`}
      className={cn(
        'relative grid touch-none overflow-hidden rounded-xl border-r border-b border-pf-line bg-pf-canvas select-none',
        dragging ? 'cursor-grabbing' : 'cursor-crosshair',
      )}
      style={{gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`}}
      onPointerDown={e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        rect.current = e.currentTarget.getBoundingClientRect();
        e.currentTarget.setPointerCapture(e.pointerId);
        active.current = true;
        controller.pointerDown(indexAt(e.clientX, e.clientY));
      }}
      onPointerMove={e => {
        if (active.current)
          controller.pointerMove(indexAt(e.clientX, e.clientY));
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      {Array.from({length: rows * cols}, (_, i) => {
        const r = Math.floor(i / cols);
        return (
          <Cell key={i} store={store} i={i} delay={(r + i - r * cols) * 7} />
        );
      })}
      <Markers store={store} dragging={dragging} />
    </div>
  );
}
