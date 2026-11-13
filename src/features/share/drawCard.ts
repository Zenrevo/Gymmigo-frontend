import { activityMeta } from '../activity/activityTypes';
import { formatPace } from '../activity/runMath';
import {
  cardStats,
  fullKmSplits,
  projectRoute,
  TEMPLATE_SIZE,
  trimEnds,
  type LatLng,
  type ShareCardData,
  type ShareOptions,
  type TemplateKey,
} from './shareModel';

/*
 * Share-card templates drawn on a canvas, mirroring the app's ShareCard designs. Layout is in the
 * app's logical units (360 wide) and drawn at `scale` (3 → 1080 px), in fixed brand colours that
 * don't follow the page theme, so the image looks the same for everyone.
 */

const C = {
  bg: '#131315',
  panel: '#1B1B1D',
  line: '#353437',
  text: '#F5F5F7',
  muted: '#A1A1AA',
  accent: '#FF5722',
  accentDeep: '#C2410C',
  green: '#4ADE80',
};

const DISPLAY = '"Epilogue", "Inter", system-ui, sans-serif';
const SANS = '"Inter", system-ui, sans-serif';

type Ctx = CanvasRenderingContext2D;
type Font = { family: string; weight: number; size: number };
const display = (size: number): Font => ({ family: DISPLAY, weight: 800, size });
const heading = (size: number): Font => ({ family: DISPLAY, weight: 700, size });
const sans = (size: number, weight = 600): Font => ({ family: SANS, weight, size });

/** Loads the card fonts before drawing so the first export doesn't fall back to system fonts. */
export async function loadCardFonts() {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all(
    ['800 40px Epilogue', '700 20px Epilogue', '500 12px Inter', '600 12px Inter', '700 12px Inter'].map(f => document.fonts.load(f).catch(() => undefined)),
  );
}

function setFont(ctx: Ctx, f: Font) {
  ctx.font = `${f.weight} ${f.size}px ${f.family}`;
}

function text(ctx: Ctx, s: string, x: number, y: number, f: Font, color: string, opts: { align?: CanvasTextAlign; spacing?: number; maxWidth?: number } = {}) {
  setFont(ctx, f);
  ctx.fillStyle = color;
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${opts.spacing ?? 0}px`;
  let out = s;
  if (opts.maxWidth) {
    while (out.length > 1 && ctx.measureText(out).width > opts.maxWidth) out = out.slice(0, -2) + '…';
  }
  ctx.fillText(out, x, y);
  const w = ctx.measureText(out).width;
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = '0px';
  return w;
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function wordmark(ctx: Ctx, x: number, y: number, size = 15, color = C.text) {
  const w = text(ctx, 'GYM', x, y, display(size), color, { spacing: 1.5 });
  text(ctx, 'MIGO', x + w + 1.5, y, display(size), C.accent, { spacing: 1.5 });
}

function header(ctx: Ctx, data: ShareCardData, x: number, y: number, width: number, color = C.text) {
  wordmark(ctx, x, y + 13, 15, color);
  const label = (data.kind === 'day' ? 'TODAY' : activityMeta(data.activityType).label).toUpperCase();
  setFont(ctx, sans(10, 700));
  const w = ctx.measureText(label).width + 18;
  roundRect(ctx, x + width - w, y, w, 20, 10, 'rgba(255,87,34,0.16)');
  text(ctx, label, x + width - w / 2, y + 14, sans(10, 700), C.accent, { align: 'center', spacing: 0.8 });
}

function footer(ctx: Ctx, x: number, y: number, width: number, color = C.muted) {
  text(ctx, 'Track yours on the Gymmigo app', x, y, sans(9, 500), color);
  text(ctx, 'gymmigo.in', x + width, y, sans(9, 700), C.accent, { align: 'right' });
}

/** The hero number: distance in km, or the time for activities without one. */
function hero(ctx: Ctx, data: ShareCardData, x: number, y: number, size: number, color = C.text) {
  const s = cardStats(data);
  const w = text(ctx, s.distance ?? s.time, x, y, display(size), color, { spacing: -2 });
  if (s.distance) text(ctx, ' km', x + w, y, heading(Math.round(size * 0.32)), C.accent);
}

function statRow(ctx: Ctx, data: ShareCardData, options: ShareOptions, x: number, y: number, width: number, size = 20, color = C.text) {
  const s = cardStats(data);
  const items: { label: string; value: string; unit?: string }[] = [{ label: 'Time', value: s.time }];
  if (options.showPace && s.pace) items.push({ label: 'Pace', value: s.pace.replace('/km', ''), unit: '/km' });
  if (options.showPace && s.speed) items.push({ label: 'Speed', value: s.speed.replace(' km/h', ''), unit: 'km/h' });
  if (options.showHeartRate && s.bpm) items.push({ label: 'Avg HR', value: s.bpm, unit: 'bpm' });
  if (options.showCalories && s.calories && items.length < 4) items.push({ label: 'Calories', value: s.calories, unit: 'kcal' });
  const shown = items.slice(0, 3);
  const col = width / shown.length;
  shown.forEach((it, i) => stat(ctx, it.label, it.value, it.unit, x + i * col, y, size, color));
}

function stat(ctx: Ctx, label: string, value: string, unit: string | undefined, x: number, y: number, size: number, color = C.text) {
  text(ctx, label.toUpperCase(), x, y, sans(8.5, 700), C.muted, { spacing: 0.9 });
  const w = text(ctx, value, x, y + size + 4, display(size), color);
  if (unit) text(ctx, ` ${unit}`, x + w, y + size + 4, sans(size * 0.5, 600), C.muted);
}

type RouteStyle = { color?: string; strokeWidth?: number; outline?: string | null; glow?: boolean; dots?: boolean; grid?: boolean; pad?: number };

/** Draws the route fitted into a box, like the app's RouteSvg. */
export function drawRoute(ctx: Ctx, segments: LatLng[][], x: number, y: number, w: number, h: number, st: RouteStyle = {}) {
  const { color = C.accent, strokeWidth = 4, outline = null, glow = true, dots = true, grid = false, pad = 18 } = st;
  if (grid) {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let gx = 36; gx < w; gx += 36) {
      ctx.beginPath();
      ctx.moveTo(x + gx, y);
      ctx.lineTo(x + gx, y + h);
      ctx.stroke();
    }
    for (let gy = 36; gy < h; gy += 36) {
      ctx.beginPath();
      ctx.moveTo(x, y + gy);
      ctx.lineTo(x + w, y + gy);
      ctx.stroke();
    }
  }
  const p = projectRoute(segments, w, h, pad);
  const trace = (seg: { x: number; y: number }[]) => {
    ctx.beginPath();
    ctx.moveTo(x + seg[0].x, y + seg[0].y);
    for (let i = 1; i < seg.length - 1; i++) {
      const mx = (seg[i].x + seg[i + 1].x) / 2;
      const my = (seg[i].y + seg[i + 1].y) / 2;
      ctx.quadraticCurveTo(x + seg[i].x, y + seg[i].y, x + mx, y + my);
    }
    const last = seg[seg.length - 1];
    ctx.lineTo(x + last.x, y + last.y);
  };
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pass = (stroke: string, width: number, alpha = 1) => {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    p.segments.forEach(seg => {
      trace(seg);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  };
  if (outline) pass(outline, strokeWidth + 4);
  if (glow) pass(color, strokeWidth * 3, 0.25);
  pass(color, strokeWidth);
  if (dots) {
    const dot = (pt: { x: number; y: number } | null, fill: string) => {
      if (!pt) return;
      ctx.beginPath();
      ctx.arc(x + pt.x, y + pt.y, strokeWidth + 2, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    };
    dot(p.start, C.green);
    dot(p.end, C.accent);
  }
}

const hoursMinutes = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

function drawRouteTemplate(ctx: Ctx, d: ShareCardData, o: ShareOptions, segs: LatLng[][]) {
  header(ctx, d, 20, 20, 320);
  roundRect(ctx, 20, 52, 320, 222, 16, C.panel);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(20, 52, 320, 222, 16);
  ctx.clip();
  drawRoute(ctx, segs, 20, 52, 320, 222, { grid: true });
  ctx.restore();
  text(ctx, `${d.title} · ${d.dateLabel}`, 20, 296, sans(11, 600), C.muted, { maxWidth: 320 });
  hero(ctx, d, 20, 352, 56);
  statRow(ctx, d, o, 20, 376, 320);
  footer(ctx, 20, 434, 320);
}

function drawStoryTemplate(ctx: Ctx, d: ShareCardData, o: ShareOptions, segs: LatLng[][]) {
  header(ctx, d, 24, 24, 312);
  text(ctx, d.dateLabel, 24, 66, sans(12, 600), C.muted);
  drawRoute(ctx, segs, 24, 84, 312, 300, { strokeWidth: 5, pad: 12 });
  text(ctx, d.title, 24, 420, heading(18), C.text, { maxWidth: 312 });
  hero(ctx, d, 24, 512, 84);
  statRow(ctx, d, o, 24, 540, 312, 22);
  footer(ctx, 24, 620, 312);
}

function drawStickerTemplate(ctx: Ctx, d: ShareCardData, o: ShareOptions, segs: LatLng[][]) {
  drawRoute(ctx, segs, 30, 20, 300, 250, { strokeWidth: 5, color: '#FFFFFF', outline: 'rgba(0,0,0,0.45)', glow: false, pad: 10 });
  const s = cardStats(d);
  const second = o.showPace ? s.pace ?? s.speed : null;
  const parts: [string, Font, string][] = [
    [s.distance ? `${s.distance} km` : s.time, display(18), C.text],
    ...(s.distance ? ([[s.time, sans(12, 600), C.muted]] as [string, Font, string][]) : []),
    ...(second ? ([[second, sans(12, 600), C.muted]] as [string, Font, string][]) : []),
  ];
  setFont(ctx, display(11));
  let total = ctx.measureText('GYMMIGO').width + 10;
  parts.forEach(([t, f]) => {
    setFont(ctx, f);
    total += ctx.measureText(t).width + 10;
  });
  const w = total + 22;
  const x0 = 180 - w / 2;
  roundRect(ctx, x0, 282, w, 38, 19, 'rgba(19,19,21,0.86)');
  let cx = x0 + 16;
  wordmark(ctx, cx, 306, 11);
  setFont(ctx, display(11));
  cx += ctx.measureText('GYMMIGO').width + 14;
  parts.forEach(([t, f, c]) => {
    cx += text(ctx, t, cx, 307, f, c) + 10;
  });
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function drawPhotoTemplate(ctx: Ctx, d: ShareCardData, o: ShareOptions, segs: LatLng[][], photo: string | null | undefined) {
  const { width: W, height: H } = TEMPLATE_SIZE.photo;
  const img = photo ? await loadImage(photo).catch(() => null) : null;
  if (img) {
    const s = Math.max(W / img.width, H / img.height);
    ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(194,65,12,0.9)');
    g.addColorStop(1, C.bg);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, 'rgba(0,0,0,0.35)');
  shade.addColorStop(0.45, 'rgba(0,0,0,0)');
  shade.addColorStop(0.6, 'rgba(0,0,0,0.1)');
  shade.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  header(ctx, d, 20, 20, 320, '#FFFFFF');
  if (segs.flat().length >= 2) drawRoute(ctx, segs, 224, 56, 120, 120, { strokeWidth: 3, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', glow: false, pad: 6, dots: false });
  text(ctx, d.title, 20, 300, heading(16), '#FFFFFF', { maxWidth: 320 });
  hero(ctx, d, 20, 360, 60, '#FFFFFF');
  statRow(ctx, d, o, 20, 382, 320, 20, '#FFFFFF');
  footer(ctx, 20, 434, 320, 'rgba(255,255,255,0.75)');
}

function drawStatsTemplate(ctx: Ctx, d: ShareCardData, o: ShareOptions) {
  const s = cardStats(d);
  header(ctx, d, 22, 22, 316);
  roundRect(ctx, 22, 92, 52, 52, 16, 'rgba(255,87,34,0.14)');
  text(ctx, activityMeta(d.activityType).label.slice(0, 1), 48, 128, display(26), C.accent, { align: 'center' });
  text(ctx, `${d.title} · ${d.dateLabel}`, 22, 172, sans(12, 600), C.muted, { maxWidth: 316 });
  hero(ctx, d, 22, 238, 60);
  if (s.distance) statRow(ctx, d, o, 22, 270, 316);
  else text(ctx, `${s.label}${s.calories && o.showCalories ? ` · ${s.calories} kcal` : ''}`, 22, 266, sans(12, 600), C.muted);
  footer(ctx, 22, 342, 316);
}

function drawSplitsTemplate(ctx: Ctx, d: ShareCardData) {
  const splits = fullKmSplits(d).slice(0, 10);
  const fastest = Math.min(...splits.map(s => s.paceSecPerKm));
  const slowest = Math.max(...splits.map(s => s.paceSecPerKm));
  const s = cardStats(d);
  header(ctx, d, 20, 20, 320);
  hero(ctx, d, 20, 100, 52);
  setFont(ctx, display(52));
  const hw = ctx.measureText(s.distance ?? s.time).width;
  text(ctx, `in ${s.time}`, 20 + hw + 60, 92, sans(13, 600), C.muted);
  text(ctx, 'KM SPLITS', 20, 128, sans(9, 700), C.muted, { spacing: 0.9 });
  const top = 140;
  const bottom = 366;
  const step = (bottom - top) / Math.max(splits.length, 1);
  const range = Math.max(1, slowest - fastest);
  splits.forEach((sp, i) => {
    const y = top + i * step + step / 2;
    const best = sp.paceSecPerKm === fastest;
    text(ctx, String(sp.km), 20, y + 4, sans(12, 700), C.muted);
    const w = (0.35 + 0.65 * (1 - (sp.paceSecPerKm - fastest) / range)) * 234;
    roundRect(ctx, 46, y - 9, w, 18, 9, best ? C.accent : C.line);
    text(ctx, formatPace(sp.paceSecPerKm), 340, y + 4, sans(12, 700), best ? C.accent : C.text, { align: 'right' });
  });
  stat(ctx, 'Avg pace', formatPace(d.avgPaceSecPerKm), '/km', 20, 382, 20);
  stat(ctx, 'Best km', formatPace(fastest), '/km', 127, 382, 20, C.accent);
  if (d.elevationGainMeters > 0) stat(ctx, 'Climb', `+${Math.round(d.elevationGainMeters)}`, 'm', 234, 382, 20);
  footer(ctx, 20, 436, 320);
}

function drawDayTemplate(ctx: Ctx, d: ShareCardData, o: ShareOptions) {
  const acts = d.activities ?? [];
  const s = cardStats(d);
  header(ctx, d, 20, 20, 320);
  text(ctx, d.dateLabel, 20, 66, sans(12, 600), C.muted);
  stat(ctx, 'Distance', s.distance ?? '0.00', 'km', 20, 92, 26);
  stat(ctx, 'Active', hoursMinutes(d.durationSeconds), undefined, 140, 92, 26);
  stat(ctx, 'Activities', String(acts.length), undefined, 262, 92, 26);
  const withRoute = acts.filter(a => a.route.length >= 2).slice(0, 4);
  withRoute.forEach((a, i) => {
    const x = 20 + (i % 2) * 164;
    const y = 140 + Math.floor(i / 2) * 120;
    roundRect(ctx, x, y, 156, 112, 14, C.panel);
    drawRoute(ctx, o.hideEnds ? trimEnds([a.route]) : [a.route], x, y, 156, 84, { strokeWidth: 3, pad: 10, glow: false });
    text(ctx, `${activityMeta(a.activityType).label} · ${(a.distanceMeters / 1000).toFixed(2)} km`, x + 10, y + 102, sans(11, 700), C.text, { maxWidth: 136 });
  });
  let px = 20;
  const py = withRoute.length ? 140 + Math.ceil(withRoute.length / 2) * 120 + 4 : 150;
  acts.forEach(a => {
    const label = activityMeta(a.activityType).label;
    setFont(ctx, sans(11, 600));
    const w = ctx.measureText(label).width + 18;
    if (px + w > 340) return;
    roundRect(ctx, px, py, w, 22, 11, C.panel);
    text(ctx, label, px + 9, py + 15, sans(11, 600), C.text);
    px += w + 6;
  });
  footer(ctx, 20, 436, 320);
}

/**
 * Draws `template` into `canvas` at `scale` (3 = 1080 px wide). The sticker stays transparent;
 * every other card is drawn on the brand background.
 */
export async function drawShareCard(
  canvas: HTMLCanvasElement,
  template: TemplateKey,
  data: ShareCardData,
  options: ShareOptions,
  { scale = 3, photo }: { scale?: number; photo?: string | null } = {},
) {
  const { width, height } = TEMPLATE_SIZE[template];
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (template !== 'sticker') {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, width, height);
  }
  const segs = options.hideEnds ? trimEnds(data.segments) : data.segments;
  switch (template) {
    case 'route':
      return drawRouteTemplate(ctx, data, options, segs);
    case 'story':
      return drawStoryTemplate(ctx, data, options, segs);
    case 'sticker':
      return drawStickerTemplate(ctx, data, options, segs);
    case 'photo':
      return drawPhotoTemplate(ctx, data, options, segs, photo);
    case 'stats':
      return drawStatsTemplate(ctx, data, options);
    case 'splits':
      return drawSplitsTemplate(ctx, data);
    case 'day':
      return drawDayTemplate(ctx, data, options);
  }
}

export const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
