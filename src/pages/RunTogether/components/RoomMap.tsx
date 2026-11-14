import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, OverlayView, Polyline } from '@react-google-maps/api';
import { Crosshair, Maximize2 } from 'lucide-react';
import { Avatar, cn, IconButton } from '../../../components/kit';
import { useGeoLocation } from '../../../context/LocationContext';
import { useTheme } from '../../../theme/themeContext';
import type { RoomSession, TrailPoint } from '../../../api/runRooms';
import { firstName, isSessionActive } from '../../../lib/runRoom/roomLogic';
import { mapRunners, type LatLng, type MapRunner } from './roomView';

const MAP_STYLE_DARK: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#25252B' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#938E87' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1C1C21' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#393940' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4D4D56' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1C1C21' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
const MAP_STYLE_LIGHT: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];


type Props = {
  sessions: RoomSession[];
  trails: Record<string, TrailPoint[] | undefined>;
  me?: string;
  viewingPast?: boolean;
  focusUserId?: string | null;
  onSelect?: (userId: string | null) => void;
  className?: string;
};

/** Shared map of a room: coloured trail per session (finished ones lighter, with an end dot) and an avatar per runner. */
export function RoomMap({ sessions, trails, me, viewingPast = false, focusUserId, onSelect, className }: Props) {
  const { isLoaded } = useGeoLocation();
  const runners = useMemo(() => mapRunners(sessions, trails, me, viewingPast), [sessions, trails, me, viewingPast]);
  const lines = useMemo(
    () =>
      sessions
        .map(s => ({ s, path: (trails[s.id] ?? []).map(p => ({ lat: p.lat, lng: p.lng })) }))
        .filter(l => l.path.length > 1),
    [sessions, trails],
  );
  const allPoints = useMemo(() => [...lines.flatMap(l => l.path), ...runners.map(r => r.at)], [lines, runners]);

  return (
    <div className={cn('relative overflow-hidden rounded-gm-xl border border-border bg-surface-sunken', className)}>
      {isLoaded ? (
        <GoogleRoomMap lines={lines} runners={runners} allPoints={allPoints} focusUserId={focusUserId} onSelect={onSelect} />
      ) : (
        <SvgRoomMap lines={lines} runners={runners} allPoints={allPoints} onSelect={onSelect} />
      )}
      {!allPoints.length ? (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <p className="t-footnote text-ink-muted">No routes yet. Runs appear here as soon as someone starts.</p>
        </div>
      ) : null}
    </div>
  );
}

type Inner = {
  lines: { s: RoomSession; path: LatLng[] }[];
  runners: MapRunner[];
  allPoints: LatLng[];
  focusUserId?: string | null;
  onSelect?: (userId: string | null) => void;
};

function RunnerHead({ r, size, onClick }: { r: MapRunner; size: number; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${r.session.name}${r.active ? ', running' : ', finished'}`}
      className={cn('flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2', !r.active && 'opacity-80')}
    >
      <Avatar name={r.session.name} src={r.session.avatar_url} size={size} ring={r.session.color} />
      <span className="rounded-full px-2 py-0.5 t-label-sm text-white shadow-raised" style={{ background: r.session.color }}>
        {r.isMe ? 'You' : firstName(r.session.name)}
      </span>
    </button>
  );
}

function GoogleRoomMap({ lines, runners, allPoints, focusUserId, onSelect }: Inner) {
  const { scheme } = useTheme();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [follow, setFollow] = useState(false);
  const fitted = useRef(false);

  const fitAll = () => {
    const map = mapRef.current;
    if (!map || !allPoints.length) return;
    const b = new google.maps.LatLngBounds();
    allPoints.forEach(p => b.extend(p));
    map.fitBounds(b, 56);
  };

  useEffect(() => {
    if (!fitted.current && allPoints.length && mapRef.current) {
      fitted.current = true;
      fitAll();
    }
  });

  useEffect(() => {
    const target = runners.find(r => r.session.user_id === focusUserId) ?? (follow ? runners.find(r => r.isMe) : undefined);
    if (target && mapRef.current) mapRef.current.panTo(target.at);
  }, [focusUserId, follow, runners]);

  return (
    <>
      <GoogleMap
        mapContainerClassName="absolute inset-0"
        center={allPoints[0] ?? { lat: 19.076, lng: 72.8777 }}
        zoom={14}
        onLoad={m => {
          mapRef.current = m;
        }}
        onClick={() => onSelect?.(null)}
        options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false, styles: scheme === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_LIGHT }}
      >
        {lines.map(({ s, path }) => (
          <Polyline
            key={s.id}
            path={path}
            options={{ strokeColor: s.color, strokeOpacity: isSessionActive(s) ? 0.95 : 0.5, strokeWeight: isSessionActive(s) ? 5 : 4 }}
          />
        ))}
        {lines
          .filter(l => !isSessionActive(l.s))
          .map(({ s, path }) => (
            <OverlayView key={`end-${s.id}`} position={path[path.length - 1]} mapPaneName={OverlayView.OVERLAY_LAYER}>
              <span className="block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" style={{ background: s.color }} />
            </OverlayView>
          ))}
        {runners
          .filter(r => r.active)
          .map(r => (
            <OverlayView key={r.session.id} position={r.at} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <RunnerHead r={r} size={r.isMe ? 40 : 36} onClick={() => onSelect?.(r.session.user_id)} />
            </OverlayView>
          ))}
      </GoogleMap>
      <MapControls onFit={fitAll} follow={follow} onFollow={() => setFollow(f => !f)} canFollow={runners.some(r => r.isMe && r.active)} />
    </>
  );
}

function MapControls({ onFit, follow, onFollow, canFollow }: { onFit: () => void; follow?: boolean; onFollow?: () => void; canFollow?: boolean }) {
  return (
    <div className="absolute right-3 bottom-3 flex flex-col gap-2">
      <IconButton icon={Maximize2} label="Show everyone" onClick={onFit} variant="surface" />
      {canFollow ? <IconButton icon={Crosshair} label={follow ? 'Stop following me' : 'Follow me'} onClick={onFollow} variant={follow ? 'accent' : 'surface'} /> : null}
    </div>
  );
}

/** No Google Maps key (or it failed to load): draw the same layers on a plain projected canvas. */
function SvgRoomMap({ lines, runners, allPoints, onSelect }: Inner) {
  const box = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { w: W, h: H } = size;
  const proj = useMemo(() => {
    if (!allPoints.length || !W || !H) return null;
    const pad = Math.min(W, H) * 0.14 + 24;
    const lats = allPoints.map(p => p.lat);
    const lngs = allPoints.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
    const spanX = Math.max(1e-6, (maxLng - minLng) * kx);
    const spanY = Math.max(1e-6, maxLat - minLat);
    const scale = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
    const ox = (W - spanX * scale) / 2;
    const oy = (H - spanY * scale) / 2;
    return (p: LatLng) => ({ x: ox + (p.lng - minLng) * kx * scale, y: oy + (maxLat - p.lat) * scale });
  }, [allPoints, W, H]);

  return (
    <div ref={box} className="absolute inset-0" onClick={() => onSelect?.(null)}>
      <svg width={W} height={H} className="absolute inset-0" aria-hidden>
        <defs>
          <pattern id="rm-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="var(--gm-border)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#rm-grid)" />
        {proj
          ? lines.map(({ s, path }) => {
              const pts = path.map(proj);
              const end = pts[pts.length - 1];
              return (
                <g key={s.id} opacity={isSessionActive(s) ? 1 : 0.5}>
                  <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={s.color} strokeWidth={isSessionActive(s) ? 5 : 4} strokeLinecap="round" strokeLinejoin="round" />
                  {!isSessionActive(s) ? <circle cx={end.x} cy={end.y} r={6} fill={s.color} stroke="white" strokeWidth={2} /> : null}
                </g>
              );
            })
          : null}
      </svg>
      {proj
        ? runners
            .filter(r => r.active)
            .map(r => {
              const p = proj(r.at);
              return (
                <div key={r.session.id} className="absolute" style={{ left: p.x, top: p.y }}>
                  <RunnerHead r={r} size={r.isMe ? 40 : 36} onClick={() => onSelect?.(r.session.user_id)} />
                </div>
              );
            })
        : null}
    </div>
  );
}
