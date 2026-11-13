import { useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';

export const EASE = [0.22, 0.61, 0.36, 1] as const;

/** Scroll-linked vertical drift for hero imagery (disabled with reduced motion). */
export function useParallax(distance = 40): { ref: React.RefObject<HTMLDivElement | null>; y: MotionValue<number> | number } {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : distance]);
  return { ref, y };
}

