'use client';

import {MotionConfig} from 'framer-motion';

/** framer-motion follows the OS "reduce motion" setting: transforms skipped, fades kept. */
export default function Providers({children}: {children: React.ReactNode}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
