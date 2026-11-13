import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Copy, Download, ImagePlus, Link2, MessageCircle, Share2 } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, ListGroup, PageHeader, SectionHeader, Skeleton, Text, Toggle, cn, useToast } from '../../components/kit';
import { sharesApi } from '../../api/shares';
import { useActivities, useActivity } from '../../hooks/useActivities';
import { cardFromDay, cardFromRun, shareRequestBody } from '../../features/share/cardData';
import { canvasToBlob, drawShareCard, loadCardFonts } from '../../features/share/drawCard';
import { availableTemplates, shareMessage, TEMPLATE_LABEL, trimEnds, type ShareCardData, type ShareOptions, type TemplateKey } from '../../features/share/shareModel';
import { PLAY_STORE_URL } from '../../features/share/storeLinks';
import { uploadToR2 } from '../../utils/r2';

const DEFAULT_OPTIONS: ShareOptions = { hideEnds: true, showPace: true, showCalories: true, showHeartRate: false };

/** Draws one template into a canvas whenever its inputs change. */
/** Transparent cards (the sticker) sit on a checkerboard so the transparency reads. */
const CHECKER = { backgroundImage: 'repeating-conic-gradient(#3a3a3e 0% 25%, #2a2a2c 0% 50%)', backgroundSize: '16px 16px' };

function CardCanvas({ template, data, options, photo, scale, className, canvasRef }: {
  template: TemplateKey;
  data: ShareCardData;
  options: ShareOptions;
  photo: string | null;
  scale: number;
  className?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}) {
  const own = useRef<HTMLCanvasElement>(null);
  const ref = canvasRef ?? own;
  useEffect(() => {
    let live = true;
    loadCardFonts().then(() => {
      if (live && ref.current) drawShareCard(ref.current, template, data, options, { scale, photo });
    });
    return () => {
      live = false;
    };
  }, [ref, template, data, options, photo, scale]);
  return <canvas ref={ref} className={className} style={template === 'sticker' ? CHECKER : undefined} />;
}

/** The app's Share studio: pick a card, toggle details, then download, copy a link or send it. */
export default function ShareStudioPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isDay = !id && params.get('day') === 'today';
  const one = useActivity(id);
  const all = useActivities();
  const data: ShareCardData | null = useMemo(() => {
    if (id) return one.data ? cardFromRun(one.data) : null;
    if (isDay) return all.data ? cardFromDay(all.data) : null;
    return null;
  }, [id, isDay, one.data, all.data]);

  if ((id && one.isLoading) || (isDay && all.isLoading)) return <Skeleton className="h-[480px]" />;
  if (id && one.isError) return <ErrorState title="Activity not found" />;
  if (!data) return <EmptyState title="Nothing to share" message="Open an activity and choose Share." actionLabel="Go to Activity" actionTo="/app/activity" />;
  if (data.kind === 'day' && !data.activities?.length) return <EmptyState title="No activities today" message="Record one with the Gymmigo app, then share your day." actionLabel="Go to Activity" actionTo="/app/activity" />;
  return <Studio data={data} />;
}

function Studio({ data }: { data: ShareCardData }) {
  const toast = useToast();
  const templates = availableTemplates(data);
  const [template, setTemplate] = useState<TemplateKey>(templates[0]);
  const [options, setOptions] = useState<ShareOptions>(DEFAULT_OPTIONS);
  const [photo, setPhoto] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo);
  }, [photo]);
  // A link describes the card as it was shared; a changed card gets a new one.
  useEffect(() => setLink(null), [template, options, photo]);

  const blob = useCallback(async () => {
    const canvas = preview.current;
    return canvas ? canvasToBlob(canvas) : null;
  }, []);

  /** Creates the share link once (uploading the card image for link previews). Never throws. */
  const ensureLink = useCallback(async () => {
    if (link) return link;
    try {
      const png = await blob();
      const imageUrl = png ? await uploadToR2(new File([png], 'gymmigo-card.png', { type: 'image/png' })).catch(() => null) : null;
      const route = options.hideEnds ? trimEnds(data.segments) : data.segments;
      const res = await sharesApi.create(shareRequestBody(data, route, imageUrl, options.showHeartRate));
      setLink(res.url);
      return res.url;
    } catch {
      return null;
    }
  }, [link, blob, options, data]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const download = () =>
    run('download', async () => {
      const png = await blob();
      if (!png) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(png);
      a.download = `gymmigo-${template}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });

  const copyLink = () =>
    run('copy', async () => {
      const url = await ensureLink();
      await navigator.clipboard?.writeText(url ?? PLAY_STORE_URL).catch(() => undefined);
      toast(url ? { tone: 'success', title: 'Link copied', message: 'Friends with the app open it there; everyone else sees the download page.' } : { tone: 'warning', title: "Couldn't create a link", message: 'Copied the app link instead.' });
    });

  const openIntent = (target: 'whatsapp' | 'x') =>
    run(target, async () => {
      // Open the window first (synchronously inside the click) so popup blockers allow it.
      const win = window.open('', '_blank', 'noopener');
      const url = await ensureLink();
      const text = shareMessage(data, url, PLAY_STORE_URL);
      const href = target === 'whatsapp' ? `https://wa.me/?text=${encodeURIComponent(text)}` : `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
      if (win) win.location.href = href;
      else window.location.href = href;
    });

  const canShareFiles = typeof navigator !== 'undefined' && 'canShare' in navigator;
  const systemShare = () =>
    run('share', async () => {
      const png = await blob();
      const url = await ensureLink();
      const text = shareMessage(data, url, PLAY_STORE_URL);
      const file = png ? new File([png], 'gymmigo.png', { type: 'image/png' }) : null;
      try {
        if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text });
        else await navigator.share({ text });
      } catch {
        // dismissed
      }
    });

  const setOpt = (k: keyof ShareOptions) => (v: boolean) => setOptions(o => ({ ...o, [k]: v }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Share" title={data.kind === 'day' ? 'Share your day' : 'Share activity'} subtitle="Your card comes with a link: friends with Gymmigo open it in the app, everyone else gets the download page." />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3">
          <CardCanvas canvasRef={preview} template={template} data={data} options={options} photo={photo} scale={3} className="w-full max-w-[420px] rounded-gm-xl shadow-raised" />
          {template === 'photo' ? (
            <>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) setPhoto(URL.createObjectURL(f));
              }} />
              <Button label={photo ? 'Change photo' : 'Choose a photo'} icon={ImagePlus} variant="secondary" size="md" onClick={() => fileInput.current?.click()} />
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <SectionHeader label="Card style" />
            <div className="flex gap-3 overflow-x-auto pb-1">
              {templates.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemplate(t)}
                  aria-pressed={template === t}
                  className="flex shrink-0 flex-col items-center gap-1.5"
                >
                  <span className={cn('block rounded-gm-md border-2 p-0.5', template === t ? 'border-accent' : 'border-transparent')}>
                    <CardCanvas template={t} data={data} options={options} photo={photo} scale={0.5} className="h-[110px] w-auto rounded-gm-sm" />
                  </span>
                  <Text variant="caption" tone={template === t ? 'accent' : 'muted'}>
                    {TEMPLATE_LABEL[t]}
                  </Text>
                </button>
              ))}
            </div>
          </section>

          <ListGroup>
            {data.kind === 'activity' && data.segments.length ? (
              <OptionRow title="Hide start & end" subtitle="Hides the first and last 200 m so your home stays private" checked={options.hideEnds} onChange={setOpt('hideEnds')} />
            ) : null}
            <OptionRow title="Show pace / speed" checked={options.showPace} onChange={setOpt('showPace')} />
            <OptionRow title="Show calories" checked={options.showCalories} onChange={setOpt('showCalories')} />
          </ListGroup>

          <Card padding="lg" className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button label="Download" icon={Download} size="md" onClick={download} loading={busy === 'download'} />
              <Button label="Copy link" icon={Copy} size="md" variant="secondary" onClick={copyLink} loading={busy === 'copy'} />
              <Button label="WhatsApp" icon={MessageCircle} size="md" variant="secondary" onClick={() => openIntent('whatsapp')} loading={busy === 'whatsapp'} />
              <Button label="Post on X" size="md" variant="secondary" onClick={() => openIntent('x')} loading={busy === 'x'} />
            </div>
            {canShareFiles ? <Button label="More…" icon={Share2} size="md" variant="ghost" onClick={systemShare} loading={busy === 'share'} /> : null}
            {link ? (
              <Text variant="footnote" tone="muted" className="flex items-center gap-1.5 break-all">
                <Link2 size={14} className="shrink-0" /> {link}
              </Text>
            ) : null}
            <Text variant="caption" tone="subtle">
              For Instagram Stories, download the card (Story or Sticker) and add it from the Instagram app.
            </Text>
          </Card>
        </div>
      </div>
    </div>
  );
}

function OptionRow({ title, subtitle, checked, onChange }: { title: string; subtitle?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="footnote" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
