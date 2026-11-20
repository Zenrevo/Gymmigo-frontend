
export const inr = (n?: number | null) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;

export function when(iso?: string | null, withTime = true) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}


export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

/** Buckets with no rows aren't returned by the API; add them as zeros so gaps show as gaps. */
export function fillSeries(series: { bucket: string; count: number }[], interval: string): { bucket: string; count: number }[] {
  const pts = series.filter(s => s.bucket);
  if (pts.length < 2) return pts;
  const by = new Map(pts.map(s => [new Date(s.bucket).getTime(), s.count]));
  const out: { bucket: string; count: number }[] = [];
  const d = new Date(pts[0].bucket);
  const end = new Date(pts[pts.length - 1].bucket).getTime();
  for (let i = 0; d.getTime() <= end && i < 5000; i++) {
    out.push({ bucket: d.toISOString(), count: by.get(d.getTime()) ?? 0 });
    if (interval === 'hour') d.setUTCHours(d.getUTCHours() + 1);
    else if (interval === 'week') d.setUTCDate(d.getUTCDate() + 7);
    else if (interval === 'month') d.setUTCMonth(d.getUTCMonth() + 1);
    else d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
