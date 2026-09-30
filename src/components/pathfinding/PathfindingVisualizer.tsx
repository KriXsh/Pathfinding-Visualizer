'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {motion} from 'framer-motion';
import {ControlBar} from './ControlBar';
import {Controller} from './engine/controller';
import {Grid} from './Grid';
import {AlgorithmPanel, Legend, MetricsPanel} from './Panels';

const odd = (x: number) => (x % 2 ? x : x - 1);
const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x));

/** Board size for the space available: odd so recursive division lines up,
    capped at 29 × 59 (~1,700 nodes). */
function fitGrid(width: number) {
  const target = width < 640 ? 19 : 22;
  const cols = odd(clamp(Math.floor(width / target), 15, 59));
  const cell = width / cols;
  const rows = odd(
    clamp(Math.floor(Math.min(window.innerHeight * 0.64, 700) / cell), 11, 29),
  );
  return {rows, cols};
}

export default function PathfindingVisualizer() {
  const [controller] = useState(() => new Controller(21, 45));
  const ui = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [measured, setMeasured] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = stage.current!;
    let timer = 0;
    const fit = () => {
      if (controller.busy) return;
      const {rows, cols} = fitGrid(el.clientWidth);
      controller.resize(rows, cols);
      setMeasured(true);
    };
    fit();
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(fit, 180);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, [controller]);

  useEffect(() => () => controller.dispose(), [controller]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        t?.closest(
          'input, textarea, select, [role=listbox], [contenteditable=true]',
        )
      )
        return;
      // Space on a focused button should press that button, not the shortcut.
      if (e.key === ' ' && t?.closest('button')) return;
      const k = e.key.toLowerCase();
      if (k === ' ') controller.toggle();
      else if (k === 'r') controller.reset(false);
      else if (k === 'c' && !controller.busy) controller.reset(true);
      else if (k === 'w') controller.toggleTool();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [controller]);

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky only where it fits on one or two rows; on phones it would bury the board. */}
      <div className="relative z-30 md:sticky md:top-3">
        <ControlBar controller={controller} ui={ui} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <motion.div
          initial={{opacity: 0, y: 16}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1]}}
          className="relative order-2 rounded-3xl border border-border bg-pf-surface p-2 shadow-[0_30px_80px_-40px_var(--color-shadow)] sm:p-3 xl:order-1"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-px -z-10 rounded-3xl bg-gradient-to-br from-primary/25 via-transparent to-cyan/20 blur-xl"
          />
          <div ref={stage}>
            {measured ? (
              <Grid
                key={`${ui.store.rows}x${ui.store.cols}`}
                controller={controller}
                store={ui.store}
                dragging={ui.dragging}
              />
            ) : (
              <div className="aspect-[2/1] animate-pulse rounded-xl bg-pf-canvas" />
            )}
          </div>
          <Legend className="px-2 pt-3 pb-1" />
        </motion.div>

        <div className="order-1 flex flex-col gap-4 xl:order-2">
          <MetricsPanel ui={ui} />
          <div className="hidden xl:block">
            <AlgorithmPanel ui={ui} />
          </div>
        </div>
        <div className="order-3 xl:hidden">
          <AlgorithmPanel ui={ui} />
        </div>
      </div>
    </div>
  );
}
