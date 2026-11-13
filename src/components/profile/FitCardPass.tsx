import { IdCard, Share2, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SignatureCard, Text } from '../kit';
import { fitnessQrPayload } from './fitcard';

/* eslint-disable @typescript-eslint/no-explicit-any -- /clubs/fitness-card/me is untyped */

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

/** The app's FitCard Pass: always-dark card with live QR, Fitness ID, tier and score. */
export function FitCardPass({ card, name, code, gymName, onOpen, onShare }: { card: any; name?: string; code?: string | null; gymName?: string | null; onOpen?: () => void; onShare?: () => void }) {
  const t = card?.fitcard ?? card?.fitness_card ?? null;
  const tierLabel = (t?.tier_label ?? card?.tier_card?.tier_label ?? (t?.tier != null ? `Tier ${t.tier}` : null)) as string | null;
  const score = (t?.fitness_score ?? card?.tier_card?.fitness_score ?? null) as number | null;
  const subtitle = [gymName ? `${gymName} access` : null, code ? 'Active' : 'Card pending'].filter(Boolean).join(' · ');
  const stats: [string, string, string][] = [
    ['Fitness ID', code ?? '—', 'flex-[1.5]'],
    ['Tier', tierLabel ?? '—', 'flex-1'],
    ['Score', score != null ? compact(score) : '—', 'flex-1'],
  ];
  return (
    <SignatureCard padding="none">
      <button type="button" onClick={onOpen} disabled={!onOpen} aria-label="Open FitCard" className="block w-full p-5 text-left disabled:cursor-default">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-gm-md bg-surface-sunken text-accent-text">
            <IdCard size={22} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Text variant="title" className="truncate">
                FitCard Pass
              </Text>
              <span className={`h-2 w-2 rounded-full ${code ? 'bg-success' : 'bg-ink-subtle'}`} aria-hidden />
            </div>
            <Text variant="caption" tone="muted" className="truncate">
              {subtitle}
            </Text>
          </div>
          <span className="rounded-gm-md bg-white p-1.5">
            <QRCodeSVG value={fitnessQrPayload(card, code)} size={44} bgColor="#FFFFFF" fgColor="#131315" />
          </span>
        </div>
        <div className="mt-5 flex gap-2">
          {stats.map(([label, value, w]) => (
            <div key={label} className={`${w} min-w-0 rounded-gm-md bg-surface-sunken px-2.5 py-2`}>
              <Text variant="labelSm" tone="subtle">
                {label}
              </Text>
              <Text variant="subtitle" className="mt-0.5 truncate">
                {value}
              </Text>
            </div>
          ))}
        </div>
        {name ? (
          <Text variant="labelSm" tone="subtle" className="mt-3 truncate">
            Issued to {name}
          </Text>
        ) : null}
      </button>
      <div className="flex items-center gap-2 border-t border-border px-5 py-3">
        <Sparkles size={14} className="text-accent-text" aria-hidden />
        <Text variant="caption" tone="muted" className="flex-1 truncate">
          Scan at the front desk
        </Text>
        {onShare ? (
          <button type="button" onClick={onShare} className="t-button-sm inline-flex items-center gap-1.5 text-accent-text hover:underline">
            <Share2 size={15} aria-hidden /> Share Pass
          </button>
        ) : null}
      </div>
    </SignatureCard>
  );
}
