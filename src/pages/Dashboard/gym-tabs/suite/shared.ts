import type { AnalyticsRange, PayMethod, Point } from '../../../../api/ownerSuite';

export const PAY: { value: PayMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'card', label: 'Card' }, { value: 'bank', label: 'Bank' },
];

export const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' }, { value: '12m', label: '12 months' },
];

/** Long series → at most `max` bars (sums kept). */
export function toBars(points: Point[], max = 15) {
  const step = Math.max(1, Math.ceil(points.length / max));
  const out: { label: string; value: number }[] = [];
  for (let i = 0; i < points.length; i += step) {
    const chunk = points.slice(i, i + step);
    const d = new Date(chunk[0].date);
    out.push({ label: step > 1 ? `${d.getDate()}/${d.getMonth() + 1}` : String(d.getDate()), value: chunk.reduce((n, p) => n + p.value, 0) });
  }
  return out;
}
