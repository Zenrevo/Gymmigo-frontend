import { motion, useReducedMotion } from 'framer-motion';
import { createContext, useContext, type ReactNode } from 'react';
import { EASE } from './motionUtils';

const AboveFoldContext = createContext(false);

/**
 * Wrap the hero (first screen) with this. Reveals inside it only lift, never start invisible, so the
 * prerendered HTML paints the headline at once (good LCP) and still animates once the app loads.
 */
export function AboveFold({ children }: { children: ReactNode }) {
  return <AboveFoldContext.Provider value>{children}</AboveFoldContext.Provider>;
}

/** Fades and lifts its children once, when they scroll into view. */
export function Reveal({ children, delay = 0, y = 18, className, as = 'div' }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const reduce = useReducedMotion();
  const aboveFold = useContext(AboveFoldContext);
  const Comp = motion[as];
  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  if (aboveFold) {
    return (
      <Comp className={className} initial={{ y: Math.min(y, 12) }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: EASE, delay }}>
        {children}
      </Comp>
    );
  }
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}
