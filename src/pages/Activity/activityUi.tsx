import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone } from 'lucide-react';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Button, Card, ListItem, Text } from '../../components/kit';
import { useGeoLocation } from '../../context/LocationContext';
import { useTheme } from '../../theme/themeContext';
import { activityMeta, activityOf } from '../../features/activity/activityTypes';
import { ACTIVITY_ICON, activityLine } from './activityFormat';
import type { RunRecord } from '../../features/activity/types';
import { routeSegments } from '../../features/share/cardData';
import { APP_STORE_URL, PLAY_STORE_URL } from '../../features/share/storeLinks';

export function ActivityRow({ run }: { run: RunRecord }) {
  const type = activityOf(run);
  const Icon = ACTIVITY_ICON[type];
  const title = run.title?.trim() || `${activityMeta(type).label}`;
  return (
    <ListItem
      icon={Icon}
      title={title}
      subtitle={`${format(new Date(run.startedAt), 'EEE d MMM, h:mm a')} · ${activityLine(run)}`}
      to={`/app/activity/${encodeURIComponent(run.id ?? run.clientId)}`}
      chevron
    />
  );
}

/** GPS tracking needs the phone: shown wherever the app would start a run. */
export function TrackInAppCard({ compact = false }: { compact?: boolean }) {
  return (
    <Card padding="lg" className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-gm-md bg-accent-soft text-accent-text">
          <Smartphone size={20} />
        </span>
        <div className="min-w-0">
          <Text variant="title">Track with the Gymmigo app</Text>
          <Text variant="footnote" tone="muted" className="mt-1">
            GPS runs, walks and rides are recorded on your phone, even with the screen locked. They show up here automatically.
          </Text>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button label="Get it on Google Play" size="sm" href={PLAY_STORE_URL} target="_blank" />
            {APP_STORE_URL ? <Button label="App Store" size="sm" variant="secondary" href={APP_STORE_URL} target="_blank" /> : null}
          </div>
        </div>
      </div>
      {compact ? null : (
        <div className="hidden shrink-0 flex-col items-center gap-1 rounded-gm-md bg-white p-2 sm:flex" aria-label="QR code to the Gymmigo app">
          <QRCodeSVG value={PLAY_STORE_URL} size={92} />
          <span className="t-label-sm text-[#131315]">Scan to install</span>
        </div>
      )}
    </Card>
  );
}

const DARK_MAP = [
  { elementType: 'geometry', stylers: [{ color: '#1b1b1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a93' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#131315' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2c' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#353437' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1a24' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

/**
 * The route on a Google map (dark style in dark theme), one polyline per pause segment with start and
 * finish dots. Without a Maps key or before it loads, the route is drawn on a plain grid instead.
 */
export function RouteMap({ run, height = 320 }: { run: Pick<RunRecord, 'coordinates'>; height?: number }) {
  const { isLoaded } = useGeoLocation();
  const { scheme } = useTheme();
  const segments = useMemo(() => routeSegments(run), [run]);
  const path = segments.flat();
  const bounds = useMemo(() => {
    if (!isLoaded || path.length < 2) return null;
    const b = new google.maps.LatLngBounds();
    path.forEach(([lat, lng]) => b.extend({ lat, lng }));
    return b;
  }, [isLoaded, path]);

  if (path.length < 2) return null;
  if (!isLoaded) return <RouteFallback segments={segments} height={height} />;
  const start = path[0];
  const end = path[path.length - 1];
  return (
    <div className="overflow-hidden rounded-gm-xl border border-border" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        onLoad={m => {
          if (bounds) m.fitBounds(bounds, 32);
        }}
        options={{ disableDefaultUI: true, zoomControl: true, styles: scheme === 'dark' ? DARK_MAP : undefined, clickableIcons: false }}
      >
        {segments.map((seg, i) => (
          <PolylineF key={i} path={seg.map(([lat, lng]) => ({ lat, lng }))} options={{ strokeColor: '#FF5722', strokeWeight: 5, strokeOpacity: 0.95 }} />
        ))}
        <MarkerF position={{ lat: start[0], lng: start[1] }} title="Start" icon={dot('#4ADE80')} />
        <MarkerF position={{ lat: end[0], lng: end[1] }} title="Finish" icon={dot('#FF5722')} />
      </GoogleMap>
    </div>
  );
}

const dot = (fill: string): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  scale: 7,
  fillColor: fill,
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 2,
});

function RouteFallback({ segments, height }: { segments: [number, number][][]; height: number }) {
  const all = segments.flat();
  const lats = all.map(p => p[0]);
  const lngs = all.map(p => p[1]);
  const k = Math.cos((((Math.min(...lats) + Math.max(...lats)) / 2) * Math.PI) / 180);
  const minX = Math.min(...lngs) * k;
  const maxX = Math.max(...lngs) * k;
  const minY = Math.min(...lats);
  const maxY = Math.max(...lats);
  const W = 600;
  const H = 320;
  const pad = 24;
  const s = Math.min((W - pad * 2) / Math.max(maxX - minX, 1e-9), (H - pad * 2) / Math.max(maxY - minY, 1e-9));
  const ox = (W - (maxX - minX) * s) / 2;
  const oy = (H - (maxY - minY) * s) / 2;
  const pt = ([lat, lng]: [number, number]) => `${(ox + (lng * k - minX) * s).toFixed(1)},${(oy + (maxY - lat) * s).toFixed(1)}`;
  return (
    <div className="overflow-hidden rounded-gm-xl border border-border bg-[#1B1B1D]" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full" role="img" aria-label="Route">
        {Array.from({ length: 16 }, (_, i) => (
          <path key={`v${i}`} d={`M${(i + 1) * 36},0 V${H}`} stroke="#fff" strokeOpacity={0.04} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <path key={`h${i}`} d={`M0,${(i + 1) * 36} H${W}`} stroke="#fff" strokeOpacity={0.04} />
        ))}
        {segments.map((seg, i) => (
          <polyline key={i} points={seg.map(pt).join(' ')} fill="none" stroke="#FF5722" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
    </div>
  );
}
