import { Fragment, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Smartphone, Watch } from 'lucide-react';
import { AppBar, Card, SegmentedControl, Text, cn } from '../../components/kit';
import { BRANDS, FAQ, FLOW, hubName, type Platformish } from './watchGuideContent';

const guessOs = (): Platformish => (typeof navigator !== 'undefined' && /iPhone|iPad|Mac/i.test(navigator.userAgent) ? 'ios' : 'android');

function Flow({ steps }: { steps: string[] }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={steps.join(' to ')}>
      {steps.map((s, i) => (
        <Fragment key={s}>
          <div className={cn('flex min-h-14 flex-1 items-center justify-center rounded-gm-md border px-2 text-center', i === steps.length - 1 ? 'border-accent-border bg-accent-soft' : 'border-border bg-surface')}>
            <Text variant="caption" tone={i === steps.length - 1 ? 'accent' : 'default'}>
              {s}
            </Text>
          </div>
          {i < steps.length - 1 ? <ArrowRight size={14} className="shrink-0 text-ink-subtle" aria-hidden /> : null}
        </Fragment>
      ))}
    </div>
  );
}

/** "Connect your watch" — the app's watch guide. Health data lives on the phone, so setup happens in the Gymmigo app. */
export default function WatchGuidePage() {
  const [os, setOs] = useState<Platformish>(guessOs);
  const [open, setOpen] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const hub = hubName(os);
  const brands = BRANDS.filter(b => (os === 'ios' ? b.ios : b.android));

  return (
    <div className="mx-auto w-full max-w-[720px] pb-10">
      <AppBar backTo="/app/profile" caption="CONNECT YOUR WATCH" />
      <div className="mt-2 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Text variant="label" tone="accent">
            Optional
          </Text>
          <Text variant="h1">Bring your watch data in</Text>
          <Text tone="muted">
            Gymmigo doesn’t pair with watches directly. Your watch syncs to its own app, that app shares with {hub}, and Gymmigo reads from {hub}. GPS tracking works without any of this.
          </Text>
        </div>

        <SegmentedControl<Platformish>
          aria-label="Phone"
          value={os}
          onChange={setOs}
          options={[
            { value: 'android', label: 'Android' },
            { value: 'ios', label: 'iPhone' },
          ]}
        />

        <Flow steps={FLOW(os)} />

        <Card padding="lg" variant="accent">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-gm-md bg-surface text-accent-text">
              <Smartphone size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <Text variant="bodyStrong">Set up in the Gymmigo app</Text>
              <Text variant="footnote" tone="muted" className="mt-1">
                {hub} lives on your phone, so connecting it happens in the Gymmigo app: Profile → Connect your watch → Connect {hub}. Once connected, your steps, heart rate and runs show up here on the web too.
              </Text>
            </div>
          </div>
        </Card>

        <section className="flex flex-col gap-2">
          <Text variant="label" tone="subtle">
            Set up your watch app
          </Text>
          <Card padding="none" className="px-5">
            {brands.map((b, i) => {
              const expanded = open === b.key;
              return (
                <div key={b.key} className={cn(i < brands.length - 1 && 'border-b border-border')}>
                  <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : b.key)} className="flex w-full items-center gap-3 py-3 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-gm-md bg-surface-sunken text-ink">
                      <Watch size={18} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <Text variant="bodyStrong">{b.name}</Text>
                      <Text variant="footnote" tone="muted">
                        {b.app}
                      </Text>
                    </span>
                    {expanded ? <ChevronUp size={18} className="text-ink-subtle" /> : <ChevronDown size={18} className="text-ink-subtle" />}
                  </button>
                  {expanded ? (
                    <Text tone="muted" className="pb-3 pl-12">
                      {os === 'ios' ? b.ios : b.android}
                    </Text>
                  ) : null}
                </div>
              );
            })}
          </Card>
          <Text variant="footnote" tone="subtle">
            Menu names change between app versions; look for “{hub}” in the watch app’s settings.
          </Text>
        </section>

        <section className="flex flex-col gap-2">
          <Text variant="label" tone="subtle">
            Questions
          </Text>
          <Card padding="none" className="px-5">
            {FAQ.map((f, i) => {
              const expanded = faqOpen === i;
              return (
                <div key={f.q} className={cn(i < FAQ.length - 1 && 'border-b border-border')}>
                  <button type="button" aria-expanded={expanded} onClick={() => setFaqOpen(expanded ? null : i)} className="flex w-full items-center gap-3 py-3 text-left">
                    <Text variant="bodyStrong" className="flex-1">
                      {f.q}
                    </Text>
                    {expanded ? <ChevronUp size={18} className="text-ink-subtle" /> : <ChevronDown size={18} className="text-ink-subtle" />}
                  </button>
                  {expanded ? (
                    <Text tone="muted" className="pb-3">
                      {f.a(os)}
                    </Text>
                  ) : null}
                </div>
              );
            })}
          </Card>
        </section>
      </div>
    </div>
  );
}
