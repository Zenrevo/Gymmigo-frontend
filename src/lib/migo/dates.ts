import { format } from 'date-fns';

/** `YYYY-MM-DD` (or ISO datetime) → local calendar date, without UTC shifting. */
export function parseDay(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const formatDay = (iso: string, pattern = 'EEE d MMM') => format(parseDay(iso), pattern);

export const dayDateLabel = (iso: string) => formatDay(iso);
