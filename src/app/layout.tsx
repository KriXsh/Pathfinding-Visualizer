import type {Metadata, Viewport} from 'next';
import './globals.css';
import {fontVariables} from '@/lib/fonts';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Pathfinding Visualizer | Dijkstra, A*, BFS & DFS',
  description:
    'Watch Dijkstra, A*, BFS and DFS explore a grid in real time. Draw walls, drop weights, generate mazes and re-route live.',
  authors: [{name: 'Krishnendu Ghosal'}],
  openGraph: {
    type: 'website',
    title: 'Pathfinding Visualizer',
    description: 'Dijkstra, A*, BFS and DFS, animated node by node.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0d14',
};

export default function RootLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" className={`dark ${fontVariables}`}>
      <body className="bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
