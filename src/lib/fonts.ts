// Same faces as krish.dev. Components read `font-display`, `font-sans` and
// `font-mono` from the CSS variables these set.
import {JetBrains_Mono, Plus_Jakarta_Sans, Syne} from 'next/font/google';

const display = Syne({
  variable: '--font-display-face',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

const sans = Plus_Jakarta_Sans({
  variable: '--font-sans-face',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  variable: '--font-mono-face',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const fontVariables = `${display.variable} ${sans.variable} ${mono.variable}`;
