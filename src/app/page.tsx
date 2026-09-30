import {ArrowUpRight, Github, Waypoints} from 'lucide-react';
import PathfindingVisualizer from '@/components/pathfinding/PathfindingVisualizer';
import {PORTFOLIO_URL, REPO_URL} from '@/lib/site';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] grid-lines mask-fade-b opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/4 h-[34rem] w-[34rem] rounded-full bg-primary/15 blur-[150px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-60 right-0 h-[28rem] w-[28rem] rounded-full bg-cyan/10 blur-[150px]"
      />

      <header className="relative mx-auto flex max-w-[1440px] items-center justify-between px-4 pt-5 sm:px-6 md:px-10">
        <span className="flex items-center gap-2.5 font-display text-base font-bold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet shadow-[0_0_20px_-4px_rgb(99_102_241/0.8)]">
            <Waypoints aria-hidden className="size-4 text-white" />
          </span>
          pathfinder
        </span>
        <nav className="flex items-center gap-2">
          <a
            href={PORTFOLIO_URL}
            className="group hidden items-center gap-1 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            krish.dev
            <ArrowUpRight
              aria-hidden
              className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-glow"
          >
            <Github aria-hidden className="size-4" />
            Source
          </a>
        </nav>
      </header>

      <main
        id="main"
        className="relative mx-auto max-w-[1440px] px-4 pt-10 pb-16 sm:px-6 md:px-10 md:pt-14"
      >
        <div className="mb-8 md:mb-10">
          <p className="mb-3 flex items-center gap-3 font-mono text-xs tracking-[0.25em] text-muted-foreground uppercase">
            <span className="text-glow">Lab</span>
            <span className="h-px w-10 bg-gradient-to-r from-primary to-transparent" />
            Graph algorithms
          </p>
          <h1 className="font-display text-display-md font-bold text-foreground">
            Pathfinding <span className="text-gradient">Visualizer</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Draw walls, scatter weighted terrain, or generate a maze, then watch
            Dijkstra, A*, BFS and DFS search for the target one node at a time.
          </p>
        </div>

        <PathfindingVisualizer />
      </main>

      <footer className="relative mx-auto max-w-[1440px] border-t border-border px-4 py-6 text-xs text-subtle sm:px-6 md:px-10">
        Built by{' '}
        <a
          href={PORTFOLIO_URL}
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Krishnendu Ghosal
        </a>{' '}
        · Next.js, Framer Motion & Tailwind CSS
      </footer>
    </div>
  );
}
