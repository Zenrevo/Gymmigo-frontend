import { DIMENSIONS, MULTIPLIERS, STREAK_TABLE } from './clubsContent';

export type Dims = Record<'C' | 'P' | 'H' | 'B' | 'R' | 'E', number>;

const clamp = (x: number) => Math.max(0, Math.min(100, x));

/** S from consecutive qualifying weeks. */
export const streakScore = (weeks: number) => [...STREAK_TABLE].reverse().find(r => weeks >= r.min)?.s ?? 20;

/** C = 0.70A + 0.30S */
export const consistency = (adherence: number, weeks: number) => Math.round((0.7 * clamp(adherence) + 0.3 * streakScore(weeks)) * 100) / 100;

/** GCPI = 0.25C + 0.20P + 0.20H + 0.15B + 0.10R + 0.10E */
export const gcpi = (d: Dims) => Math.round(DIMENSIONS.reduce((s, x) => s + x.weight * clamp(d[x.key]), 0) * 100) / 100;

/** Multiplier with the 3× / 4× safeguards (4× also needs the previous period to qualify). */
export function multiplier(score: number, d: Dims, previousQualified4x = false) {
  const band = [...MULTIPLIERS].reverse().find(m => score >= m.min) ?? MULTIPLIERS[0];
  const lowest = Math.min(...Object.values(d).map(clamp));
  let pick = band;
  const notes: string[] = [];
  const below = (x: number) => [...MULTIPLIERS].reverse().find(m => m.x < x) ?? MULTIPLIERS[0];
  if (pick.x >= 4 && !(score >= 99 && lowest >= 90 && previousQualified4x)) {
    notes.push('4× needs GCPI ≥ 99, every dimension ≥ 90 and two qualifying periods in a row.');
    pick = below(4);
  }
  if (pick.x >= 3 && lowest < 80) {
    notes.push('3× and above need every dimension ≥ 80.');
    pick = below(3);
  }
  return { x: pick.x, label: pick.label, notes };
}

/** Raw Penalty = 0.20 × T × (1 − W/100) × S */
export const rawPenalty = (target: number, w: number, s: number) => Math.round(0.2 * target * (1 - w / 100) * s * 100) / 100;
