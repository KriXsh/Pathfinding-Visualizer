'use client';

import {AnimatePresence, motion} from 'framer-motion';
import {
  BrickWall,
  Gauge,
  Grid3x3,
  Mountain,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Waypoints,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  ALGORITHMS,
  type AlgorithmId,
  MAZES,
  type MazeId,
  type Tool,
} from './engine/constants';
import {
  type Controller,
  stepsPerSecond,
  type UiSnapshot,
} from './engine/controller';
import {GlassSelect, type SelectOption} from './GlassSelect';

const ALGORITHM_OPTIONS: SelectOption<AlgorithmId>[] = (
  Object.keys(ALGORITHMS) as AlgorithmId[]
).map(id => {
  const a = ALGORITHMS[id];
  return {
    value: id,
    label: a.name,
    hint: a.blurb,
    badges: [
      a.weighted ? 'weighted' : 'unweighted',
      ...(a.shortest ? ['shortest'] : []),
    ],
  };
});

const MAZE_OPTIONS: SelectOption<MazeId>[] = (
  Object.keys(MAZES) as MazeId[]
).map(id => ({
  value: id,
  label: MAZES[id].name,
  hint: MAZES[id].hint,
}));

/** Hover/focus label with an optional keyboard hint. */
function Tip({
  label,
  kbd,
  children,
}: {
  label: string;
  kbd?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-[calc(100%+10px)] left-1/2 z-50 flex -translate-x-1/2 translate-y-1 items-center gap-2 rounded-lg border border-border bg-pf-panel px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-foreground opacity-0 shadow-lg transition-all duration-200 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:translate-y-0 group-has-[:focus-visible]/tip:opacity-100"
      >
        {label}
        {kbd && (
          <kbd className="rounded border border-border bg-ink/5 px-1.5 font-mono text-[10px] text-muted-foreground">
            {kbd}
          </kbd>
        )}
      </span>
    </span>
  );
}

function IconButton({
  label,
  kbd,
  onClick,
  disabled,
  children,
}: {
  label: string;
  kbd?: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tip label={label} kbd={kbd}>
      <motion.button
        type="button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        whileHover={{y: -1}}
        whileTap={{scale: 0.92}}
        className="flex size-10 items-center justify-center rounded-xl border border-border bg-ink/[0.03] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.08] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        {children}
      </motion.button>
    </Tip>
  );
}

function PlayButton({ui, onClick}: {ui: UiSnapshot; onClick: () => void}) {
  const mode =
    ui.status === 'exploring'
      ? 'pause'
      : ui.status === 'paused'
        ? 'resume'
        : ui.status === 'found' || ui.status === 'unreachable'
          ? 'replay'
          : 'play';
  const text = {
    play: 'Visualize',
    pause: 'Pause',
    resume: 'Resume',
    replay: 'Replay',
  }[mode];
  const Icon = mode === 'pause' ? Pause : mode === 'replay' ? RotateCcw : Play;
  return (
    <Tip label={text} kbd="Space">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={ui.status === 'building'}
        whileHover={{scale: 1.03}}
        whileTap={{scale: 0.96}}
        transition={{type: 'spring', stiffness: 300, damping: 20}}
        className="relative flex h-10 min-w-[8.5rem] items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary via-violet to-primary bg-[length:200%_100%] px-4 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(99_102_241/0.8)] transition-[background-position] duration-500 hover:bg-[position:100%_0] disabled:opacity-50"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={mode}
            initial={{scale: 0.3, rotate: -90, opacity: 0}}
            animate={{scale: 1, rotate: 0, opacity: 1}}
            exit={{scale: 0.3, rotate: 90, opacity: 0}}
            transition={{type: 'spring', stiffness: 300, damping: 20}}
            className="flex"
          >
            <Icon
              aria-hidden
              className="size-4"
              fill={mode === 'replay' ? 'none' : 'currentColor'}
            />
          </motion.span>
        </AnimatePresence>
        <span className="relative">{text}</span>
      </motion.button>
    </Tip>
  );
}

function ToolSwitch({
  tool,
  onChange,
}: {
  tool: Tool;
  onChange: (t: Tool) => void;
}) {
  const tools = [
    {id: 'wall' as const, label: 'Wall', Icon: BrickWall},
    {id: 'weight' as const, label: 'Weight', Icon: Mountain},
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Drawing tool"
      className="flex h-10 rounded-xl border border-border bg-ink/[0.03] p-1"
    >
      {tools.map(({id, label, Icon}) => (
        <Tip
          key={id}
          label={id === 'wall' ? 'Draw walls' : 'Draw weights (+10 cost)'}
          kbd="W"
        >
          <button
            type="button"
            role="radio"
            aria-checked={tool === id}
            onClick={() => onChange(id)}
            className={cn(
              'relative flex h-full items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors',
              tool === id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tool === id && (
              <motion.span
                layoutId="pf-tool-pill"
                transition={{type: 'spring', stiffness: 300, damping: 20}}
                className="absolute inset-0 rounded-lg border border-primary/30 bg-primary/15 shadow-[0_0_16px_-4px_rgb(99_102_241/0.6)]"
              />
            )}
            <Icon aria-hidden className="relative size-3.5" />
            <span className="relative">{label}</span>
          </button>
        </Tip>
      ))}
    </div>
  );
}

function formatRate(sps: number) {
  return sps >= 1000 ? `${(sps / 1000).toFixed(1)}k/s` : `${Math.round(sps)}/s`;
}

function SpeedSlider({
  speed,
  onChange,
}: {
  speed: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex h-10 w-full items-center gap-3 rounded-xl border border-border bg-ink/[0.03] px-3 sm:w-auto sm:min-w-52">
      <Gauge aria-hidden className="size-4 shrink-0 text-cyan" />
      <span className="sr-only">Animation speed</span>
      <input
        type="range"
        min={0}
        max={100}
        value={speed}
        onChange={e => onChange(Number(e.target.value))}
        aria-valuetext={`${formatRate(stepsPerSecond(speed))} nodes per second`}
        className="pf-range min-w-0 flex-1"
        style={{'--pf-fill': `${speed}%`} as React.CSSProperties}
      />
      <span className="w-14 shrink-0 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
        {formatRate(stepsPerSecond(speed))}
      </span>
    </label>
  );
}

export function ControlBar({
  controller,
  ui,
}: {
  controller: Controller;
  ui: UiSnapshot;
}) {
  const busy = ui.status === 'exploring' || ui.status === 'building';
  return (
    <div className="flex flex-wrap rounded-2xl border border-border bg-pf-surface/85 backdrop-blur-xl items-center gap-2 p-2 shadow-[0_20px_50px_-24px_var(--color-shadow)] md:gap-2.5 md:p-2.5">
      <GlassSelect
        label="Algorithm"
        icon={<Waypoints aria-hidden className="size-4" />}
        value={ui.algorithm}
        options={ALGORITHM_OPTIONS}
        onChange={a => controller.setAlgorithm(a)}
        disabled={ui.status === 'building'}
        className="w-full sm:w-60"
      />
      <PlayButton ui={ui} onClick={() => controller.toggle()} />
      <IconButton
        label="Clear path"
        kbd="R"
        onClick={() => controller.reset(false)}
        disabled={ui.status === 'idle'}
      >
        <RotateCcw aria-hidden className="size-4" />
      </IconButton>
      <IconButton
        label="Clear board"
        kbd="C"
        onClick={() => controller.reset(true)}
      >
        <Trash2 aria-hidden className="size-4" />
      </IconButton>

      <span aria-hidden className="mx-1 hidden h-6 w-px bg-border lg:block" />

      <ToolSwitch tool={ui.tool} onChange={t => controller.setTool(t)} />
      <GlassSelect
        label="Maze"
        icon={<Grid3x3 aria-hidden className="size-4" />}
        placeholder="Generate…"
        options={MAZE_OPTIONS}
        onChange={m => controller.buildMaze(m)}
        disabled={busy}
        className="min-w-0 flex-1 sm:w-52 sm:flex-none"
      />
      <SpeedSlider speed={ui.speed} onChange={v => controller.setSpeed(v)} />
    </div>
  );
}
