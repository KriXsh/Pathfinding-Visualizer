'use client';

import {AnimatePresence, motion} from 'framer-motion';
import {
  ChevronsRight,
  Crosshair,
  Footprints,
  Mountain,
  Route,
  Timer,
  Zap,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {ALGORITHMS, type Status, WEIGHT_COST} from './engine/constants';
import type {UiSnapshot} from './engine/controller';

const STATUS: Record<
  Status,
  {label: string; tone: string; dot: string; live?: boolean}
> = {
  idle: {
    label: 'Idle',
    tone: 'border-border text-muted-foreground',
    dot: 'bg-subtle',
  },
  building: {
    label: 'Building maze',
    tone: 'border-violet/30 bg-violet/10 text-violet',
    dot: 'bg-violet',
    live: true,
  },
  exploring: {
    label: 'Exploring',
    tone: 'border-cyan/30 bg-cyan/10 text-cyan',
    dot: 'bg-cyan',
    live: true,
  },
  paused: {
    label: 'Paused',
    tone: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  found: {
    label: 'Path found',
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  unreachable: {
    label: 'Unreachable',
    tone: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

export function StatusBadge({status}: {status: Status}) {
  const s = STATUS[status];
  return (
    <motion.span
      layout
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-2 overflow-hidden rounded-full border px-3 py-1 font-mono text-[11px] font-medium tracking-wider uppercase transition-colors',
        s.tone,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          s.dot,
          s.live && 'animate-pf-blink',
        )}
      />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status}
          initial={{y: 10, opacity: 0}}
          animate={{y: 0, opacity: 1}}
          exit={{y: -10, opacity: 0}}
          transition={{type: 'spring', stiffness: 300, damping: 20}}
        >
          {s.label}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-pf-canvas/60 p-3 transition-colors hover:border-border-strong">
      <div
        aria-hidden
        className={cn(
          'absolute -top-8 -right-8 size-16 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40',
          accent,
        )}
      />
      <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 font-mono text-xl font-medium text-foreground tabular-nums md:text-2xl">
        {value}
        {unit && (
          <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
        )}
      </p>
    </div>
  );
}

export function MetricsPanel({ui}: {ui: UiSnapshot}) {
  const hasPath = ui.status === 'found' || ui.pathLength > 0;
  return (
    <section aria-label="Live metrics" className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
          Live metrics
        </h2>
        <StatusBadge status={ui.status} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          icon={<Footprints aria-hidden className="size-3" />}
          label="Visited"
          value={ui.visited.toLocaleString()}
          accent="bg-primary"
        />
        <Stat
          icon={<Route aria-hidden className="size-3" />}
          label="Path length"
          value={hasPath ? String(ui.pathLength) : '—'}
          accent="bg-pf-path"
        />
        <Stat
          icon={<Mountain aria-hidden className="size-3" />}
          label="Total cost"
          value={hasPath ? String(ui.cost) : '—'}
          accent="bg-violet"
        />
        <Stat
          icon={<Timer aria-hidden className="size-3" />}
          label="Exec time"
          // Browsers coarsen performance.now() to ~0.1 ms, so finer digits would be noise.
          value={
            ui.timeMs === null
              ? '—'
              : ui.timeMs < 0.1
                ? '<0.1'
                : ui.timeMs.toFixed(1)
          }
          unit={ui.timeMs === null ? undefined : 'ms'}
          accent="bg-cyan"
        />
      </div>
      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-ink/[0.06]"
        aria-hidden
      >
        {/* scaleX, not width: stays on the compositor while the board animates. */}
        <div
          className="h-full origin-left rounded-full bg-gradient-to-r from-violet via-primary to-cyan transition-transform duration-150 ease-linear"
          style={{transform: `scaleX(${ui.progress})`}}
        />
      </div>
      <p className="mt-2 font-mono text-[10.5px] text-subtle">
        {ui.store.cols} × {ui.store.rows} grid · {ui.store.n.toLocaleString()}{' '}
        nodes
      </p>
    </section>
  );
}

function Swatch({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-[5px] border border-border',
        className,
      )}
    >
      {children}
    </span>
  );
}

const LEGEND = [
  {
    label: 'Start',
    swatch: (
      <Swatch className="rounded-full border-0 bg-gradient-to-br from-emerald-300 to-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)]">
        <ChevronsRight strokeWidth={3} className="size-3.5 text-emerald-950" />
      </Swatch>
    ),
  },
  {
    label: 'Target',
    swatch: (
      <Swatch className="rounded-full border-0 bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_0_10px_rgba(251,113,133,0.8)]">
        <Crosshair strokeWidth={2.6} className="size-3.5 text-white" />
      </Swatch>
    ),
  },
  {label: 'Wall', swatch: <Swatch className="border-0 bg-pf-wall" />},
  {
    label: `Weight · +${WEIGHT_COST}`,
    swatch: (
      <Swatch className="bg-pf-weight/15">
        <Mountain strokeWidth={2.4} className="size-3.5 text-pf-weight" />
      </Swatch>
    ),
  },
  {
    label: 'Frontier',
    swatch: (
      <Swatch className="rounded-full border-0 bg-pf-frontier shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
    ),
  },
  {
    label: 'Visited',
    swatch: (
      <Swatch className="border-0 bg-gradient-to-br from-violet-600 via-indigo-500 to-blue-500" />
    ),
  },
  {
    label: 'Shortest path',
    swatch: (
      <Swatch className="border-0 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
    ),
  },
];

export function Legend({className}: {className?: string}) {
  return (
    <ul
      aria-label="Legend"
      className={cn('flex flex-wrap gap-x-5 gap-y-2.5', className)}
    >
      {LEGEND.map(l => (
        <li
          key={l.label}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span aria-hidden>{l.swatch}</span>
          {l.label}
        </li>
      ))}
    </ul>
  );
}

const SHORTCUTS = [
  ['Space', 'Visualize / pause'],
  ['R', 'Clear path'],
  ['C', 'Clear board'],
  ['W', 'Switch wall / weight'],
];

export function AlgorithmPanel({ui}: {ui: UiSnapshot}) {
  const a = ALGORITHMS[ui.algorithm];
  return (
    <section
      aria-label="About this algorithm"
      className="glass rounded-2xl p-4"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={ui.algorithm}
          initial={{opacity: 0, y: 8}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -8}}
          transition={{duration: 0.2}}
        >
          <h2 className="font-display text-lg font-bold text-foreground">
            {a.name}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {a.blurb}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 font-mono text-[10.5px]',
                a.weighted
                  ? 'border-violet/30 text-violet'
                  : 'border-border text-muted-foreground',
              )}
            >
              {a.weighted ? 'weighted' : 'ignores weights'}
            </span>
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 font-mono text-[10.5px]',
                a.shortest
                  ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'border-rose-500/30 text-rose-600 dark:text-rose-400',
              )}
            >
              {a.shortest
                ? a.weighted
                  ? 'optimal path'
                  : 'fewest steps'
                : 'not optimal'}
            </span>
            <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10.5px] text-foreground">
              {a.complexity}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-4 border-t border-border pt-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap aria-hidden className="size-3.5 text-pf-path" />
          After a run, drag the markers or draw walls to re-route live.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {SHORTCUTS.map(([k, v]) => (
            <div
              key={k}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <dt>
                <kbd className="rounded border border-border bg-ink/5 px-1.5 py-px font-mono text-[10px] text-foreground">
                  {k}
                </kbd>
              </dt>
              <dd className="truncate">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
