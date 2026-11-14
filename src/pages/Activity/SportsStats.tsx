import { format } from 'date-fns';
import { Activity, Clock, Flame, Route } from 'lucide-react';
import { BarChart, Card, SectionHeader, StatTile, Text } from '../../components/kit';
import { activityMeta } from '../../features/activity/activityTypes';
import { monthStart, paceTrend, thisWeek, typeBreakdown, weeklyDistance, type ActivityLike } from '../../features/activity/analytics';
import { formatPace } from '../../features/activity/runMath';
import { ACTIVITY_ICON } from './activityFormat';

const hm = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

export function WeekTiles({ list }: { list: ActivityLike[] }) {
  const w = thisWeek(list);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile icon={Route} label="Distance" value={(w.meters / 1000).toFixed(2)} unit="km" />
      <StatTile icon={Clock} label="Active time" value={hm(w.seconds)} />
      <StatTile icon={Activity} label="Activities" value={w.count} />
      <StatTile icon={Flame} label="Calories" value={Math.round(w.kcal)} unit="kcal" />
    </div>
  );
}

export function WeeklyDistanceCard({ list }: { list: ActivityLike[] }) {
  const weeks = weeklyDistance(list, 8);
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader label="Weekly distance" meta="Last 8 weeks" />
      <Card padding="lg">
        <BarChart
          ariaLabel="Distance per week, last 8 weeks"
          bars={weeks.map((w, i) => ({
            label: i === weeks.length - 1 ? 'Now' : format(w.start, 'd/M'),
            value: Math.round(w.meters / 100) / 10,
            highlight: i === weeks.length - 1,
          }))}
          formatValue={v => `${v} km`}
        />
      </Card>
    </section>
  );
}

export function SportBreakdownCard({ list }: { list: ActivityLike[] }) {
  const now = new Date();
  const rows = typeBreakdown(list, monthStart(now), new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const max = Math.max(1, ...rows.map(r => r.seconds));
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader label="This month by sport" />
      <Card padding="lg" className="flex flex-col gap-4">
        {rows.length ? (
          rows.map(r => {
            const Icon = ACTIVITY_ICON[r.type];
            const meta = activityMeta(r.type);
            return (
              <div key={r.type} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-ink-muted" />
                  <Text variant="bodyStrong" className="flex-1">
                    {meta.label}
                  </Text>
                  <Text variant="footnote" tone="muted">
                    {r.count} · {hm(r.seconds)}
                    {meta.distance && r.meters > 0 ? ` · ${(r.meters / 1000).toFixed(2)} km` : ''}
                  </Text>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, (r.seconds / max) * 100)}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <Text variant="footnote" tone="muted">
            No activities this month yet.
          </Text>
        )}
      </Card>
    </section>
  );
}

export function PaceTrendCard({ list }: { list: ActivityLike[] }) {
  const pts = paceTrend(list, 10);
  if (pts.length < 2) return null;
  const W = 600;
  const H = 120;
  const paces = pts.map(p => p.pace);
  const lo = Math.min(...paces);
  const hi = Math.max(...paces);
  const span = Math.max(1, hi - lo);
  // Faster pace (lower seconds) plots higher.
  const xy = pts.map((p, i) => [16 + (i * (W - 32)) / (pts.length - 1), 16 + ((p.pace - lo) / span) * (H - 32)] as const);
  const latest = paces[paces.length - 1];
  const diff = paces[paces.length - 2] - latest;
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader label="Run pace" meta={`Last ${pts.length} runs`} />
      <Card padding="lg" className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Text variant="title">{formatPace(latest)}/km latest</Text>
          {diff !== 0 ? (
            <Text variant="footnote" tone={diff > 0 ? 'success' : 'warning'}>
              {Math.abs(Math.round(diff))}s/km {diff > 0 ? 'faster' : 'slower'}
            </Text>
          ) : null}
        </div>
        <div className="relative h-28 w-full" role="img" aria-label="Pace of recent runs">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            <polyline points={xy.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="var(--gm-accent)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {xy.map(([x, y], i) => {
            const last = i === xy.length - 1;
            return (
              <span
                key={i}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent ${last ? 'h-3 w-3 bg-accent' : 'h-2 w-2 bg-surface'}`}
                style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
              />
            );
          })}
        </div>
        <Text variant="caption" tone="subtle">
          Best {formatPace(lo)}/km · slowest {formatPace(hi)}/km
        </Text>
      </Card>
    </section>
  );
}
