import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../kit/cn';

/** A run route (an easy 5 km loop) that draws itself when it scrolls into view. Decorative. */
const PATH =
  'M48 236 C 40 196, 58 160, 92 150 S 150 160, 168 128 S 176 64, 220 52 S 300 58, 318 96 S 330 168, 300 196 S 236 214, 228 246 S 246 300, 214 318 S 140 320, 104 300 S 56 276, 48 236 Z';

export function RouteLine({ className, color = 'var(--gm-accent)', delay = 0.2 }: { className?: string; color?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 360 360" fill="none" aria-hidden className={cn('pointer-events-none', className)}>
      <path d={PATH} stroke="currentColor" strokeOpacity="0.08" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <motion.path
        d={PATH}
        style={{ stroke: color }}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 2.4, ease: 'easeInOut', delay }}
      />
      <circle cx="48" cy="236" r="9" style={{ fill: 'var(--gm-surface)' }} stroke="#4ADE80" strokeWidth="5" />
      {[
        [168, 128, '1 km'],
        [300, 196, '3 km'],
        [104, 300, '4 km'],
      ].map(([x, y, label]) => (
        <motion.g
          key={label as string}
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: delay + 1.6 }}
        >
          <rect x={(x as number) - 22} y={(y as number) - 30} width="44" height="20" rx="10" style={{ fill: 'var(--gm-text)' }} />
          <text x={x as number} y={(y as number) - 16} textAnchor="middle" fontSize="10" fontWeight="700" style={{ fill: 'var(--gm-background)' }} fontFamily="Inter, sans-serif">
            {label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
