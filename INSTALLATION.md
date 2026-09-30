# Installation

## Requirements

- **Node.js** 20.9 or newer (Next.js 16 requirement; tested on Node 22)
- **npm** 10 or newer (ships with Node)
- **Git**

Check your versions:

```bash
node -v
npm -v
```

## 1. Clone the repository

```bash
git clone https://github.com/KriXsh/Pathfinding-Visualizer.git
cd Pathfinding-Visualizer
```

## 2. Install dependencies

```bash
npm install
```

Use `npm ci` instead in CI or when you want an exact install from `package-lock.json`.

## 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Pages hot-reload as you edit files in `src/`.

To use a different port:

```bash
npm run dev -- -p 4000
```

## 4. Build for production

```bash
npm run build
npm run start    # serves the production build on http://localhost:3000
```

Every route is prerendered as static content, so the app can be deployed to Vercel (zero config) or any Node host.

## Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Create an optimized production build in `.next/` |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run format` | Format `src/**/*.{ts,tsx,css}` with Prettier |

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) with the React Compiler enabled
- React 19 and TypeScript 5
- Tailwind CSS v4 (configured through `@tailwindcss/postcss`; theme lives in `src/app/globals.css`)
- Framer Motion for animation, Lucide for icons

## Troubleshooting

- **`Port 3000 is already in use`**: stop the other process or run `npm run dev -- -p 4000`.
- **Unexpected errors after pulling changes**: delete the build cache and reinstall:
  ```bash
  rm -rf .next node_modules
  npm install
  ```
- **`Unsupported engine` / syntax errors on install**: upgrade Node.js to 20.9 or newer.
