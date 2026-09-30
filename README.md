# Pathfinding Visualizer

Watch **Dijkstra**, **A\***, **BFS** and **DFS** explore a grid node by node. Draw walls, scatter weighted terrain, generate a maze, then drag the start or target after a run to re-route live.

Built with Next.js (App Router), Framer Motion and Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
npm run format   # prettier, using .prettierrc
```

## Controls

| Action | How |
| --- | --- |
| Draw walls / weights | Click or drag on the grid (pick the tool in the toolbar) |
| Erase | Start a stroke on a cell that already has the current tool |
| Move start / target | Drag the markers; after a run the path re-solves instantly |
| Visualize / pause | `Space` |
| Clear path / board | `R` / `C` |
| Switch wall ↔ weight | `W` |

Weights cost 10 to enter instead of 1. Dijkstra and A\* route around them; BFS and DFS ignore them while searching, but the cost shown is what their path really costs.

## How it works

```
src/components/pathfinding/
├── engine/
│   ├── algorithms.ts   Dijkstra / A* (binary heap), BFS, DFS
│   ├── mazes.ts        recursive division, random walls, weight clusters
│   ├── grid-store.ts   typed-array grid state, one subscription per cell
│   └── controller.ts   replay loop, speed, editing, live re-routing
├── Grid.tsx            cells (motion.div) and the start / target markers
├── ControlBar.tsx      glass toolbar
├── Panels.tsx          live metrics, legend, algorithm notes
└── PathfindingVisualizer.tsx
```

Each search runs to completion up front (well under a millisecond) and records the order it touched nodes in. The animation is a replay of that recording, paced by `requestAnimationFrame` against the current slider value, so changing speed mid-run never restarts it.

Cell state lives in typed arrays outside React. Each cell subscribes to its own slot with `useSyncExternalStore`, so a frame re-renders only the few cells that changed rather than the whole ~1,700-cell board. Theme tokens and the `animate-pf-*` classes are in `src/app/globals.css` (Tailwind v4 has no `tailwind.config.js`).
