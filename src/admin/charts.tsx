import { useMemo, useState } from 'react';
import { Text } from '../components/kit';

/** Simple responsive line chart (SVG). Points with null values are skipped. */
export function LineChart({ points, height = 140, format = (v: number) => String(Math.round(v * 10) / 10), label }: {
  points: { x: string; y: number | null }[];
  height?: number;
  format?: (v: number) => string;
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const valid = points.map((p, i) => ({ ...p, i })).filter(p => p.y != null) as { x: string; y: number; i: number }[];
  if (valid.length < 2) return <Text variant="caption" tone="subtle">Not enough data yet.</Text>;
  const W = 600;
  const min = Math.min(...valid.map(p => p.y));
  const max = Math.max(...valid.map(p => p.y));
  const span = max - min || 1;
  const x = (i: number) => (i / Math.max(1, points.length - 1)) * (W - 8) + 4;
  const y = (v: number) => height - 6 - ((v - min) / span) * (height - 18);
  const d = valid.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const h = hover != null ? valid.reduce((a, b) => (Math.abs(b.i - hover) < Math.abs(a.i - hover) ? b : a)) : null;
  return (
    <figure aria-label={label} className="w-full">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="h-auto w-full touch-none"
        onPointerMove={e => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          setHover(Math.round(((e.clientX - r.left) / r.width) * (points.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <path d={d} fill="none" stroke="var(--gm-accent, #ff5722)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {h ? <circle cx={x(h.i)} cy={y(h.y)} r={4} fill="var(--gm-accent, #ff5722)" /> : null}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-ink-subtle">
        <span>{valid[0].x}</span>
        <span className="font-semibold text-ink">{h ? `${h.x}: ${format(h.y)}` : `min ${format(min)} · max ${format(max)}`}</span>
        <span>{valid[valid.length - 1].x}</span>
      </figcaption>
    </figure>
  );
}

type Track = { id: string; points: [number, number][]; label?: string; color?: string };
type Pin = { lat: number; lng: number; label?: string };

/** GPS routes and pins on a plain projection (no map tiles: no key, no location data sent to a map provider). */
export function RouteMap({ tracks, pins = [], height = 260, onSelect, selected }: {
  tracks: Track[];
  pins?: Pin[];
  height?: number;
  onSelect?: (id: string) => void;
  selected?: string | null;
}) {
  const geo = useMemo(() => {
    const all: [number, number][] = [...tracks.flatMap(t => t.points), ...pins.map(p => [p.lng, p.lat] as [number, number])];
    if (!all.length) return null;
    const lngs = all.map(p => p[0]);
    const lats = all.map(p => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
    const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
    const w = Math.max((maxX - minX) * k, 1e-4);
    const h = Math.max(maxY - minY, 1e-4);
    return { minX, maxY, k, w, h };
  }, [tracks, pins]);
  if (!geo) return <Text variant="caption" tone="subtle">No location data.</Text>;
  const W = 600;
  const pad = 14;
  const scale = Math.min((W - pad * 2) / geo.w, (height - pad * 2) / geo.h);
  const px = (lng: number) => pad + (lng - geo.minX) * geo.k * scale;
  const py = (lat: number) => pad + (geo.maxY - lat) * scale;
  const km = (geo.w * 111.32).toFixed(geo.w * 111.32 < 2 ? 2 : 0);
  return (
    <figure className="w-full overflow-hidden rounded-gm-lg border border-border bg-surface-sunken" aria-label="Map of routes and places">
      <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full">
        {tracks.map(t => (
          <polyline
            key={t.id}
            points={t.points.map(p => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={selected && selected !== t.id ? 'var(--gm-border-strong, #bbb)' : t.color ?? 'var(--gm-accent, #ff5722)'}
            strokeWidth={selected === t.id ? 4 : 2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={selected && selected !== t.id ? 0.5 : 0.9}
            style={{ cursor: onSelect ? 'pointer' : undefined }}
            onClick={() => onSelect?.(t.id)}
          >
            {t.label ? <title>{t.label}</title> : null}
          </polyline>
        ))}
        {pins.map((p, i) => (
          <g key={i}>
            <circle cx={px(p.lng)} cy={py(p.lat)} r={6} fill="var(--gm-info, #2563eb)" stroke="#fff" strokeWidth={2} />
            {p.label ? <title>{p.label}</title> : null}
          </g>
        ))}
      </svg>
      <figcaption className="flex justify-between px-3 py-1.5 text-[11px] text-ink-subtle">
        <span>North up · ~{km} km across</span>
        <span>{tracks.length} route{tracks.length === 1 ? '' : 's'} · {pins.length} place{pins.length === 1 ? '' : 's'}</span>
      </figcaption>
    </figure>
  );
}

export function JsonView({ value }: { value: unknown }) {
  return <pre className="max-h-72 overflow-auto rounded-gm-md bg-surface-sunken p-3 text-xs">{JSON.stringify(value, null, 2)}</pre>;
}
