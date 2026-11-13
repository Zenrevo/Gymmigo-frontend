import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import type { ClubConfig, ClubValidationResult } from '../../../../types/clubs';

type Props = {
  clubs: ClubConfig[];
  validation?: ClubValidationResult | null;
  publishing: boolean;
  onBack: () => void;
  onPublish: () => void;
};

export default function ClubsPublishStep({ clubs, validation, publishing, onBack, onPublish }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const errors = validation?.errors || [];
  const warnings = validation?.warnings || [];
  const activeCount = clubs.filter((club) => club.is_active).length;

  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-ink/[0.035] p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Step 3</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Publish to members</h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold text-ink/50">
        This saves all {clubs.length} club tiers at once. Members will see the journey, rewards, and Migo nudges after publish.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Tiers" value={clubs.length} />
        <Stat label="Active" value={activeCount} />
        <Stat label="Warnings" value={warnings.length} />
      </div>

      {errors.length > 0 && (
        <p className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">
          Resolve validation errors on the review step before publishing.
        </p>
      )}

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-surface-sunken p-4">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-ink/20 accent-primary"
        />
        <span className="text-sm font-semibold leading-6 text-ink/70">
          I reviewed all 8 clubs. Rewards match what my gym can afford and support our renewal goals.
        </span>
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-ink/10 px-5 py-3 text-xs font-black uppercase text-ink/60"
        >
          <ChevronLeft size={14} /> Back to review
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={!confirmed || publishing || errors.length > 0}
          className={clsx(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-black uppercase transition',
            confirmed && !errors.length
              ? 'bg-primary text-black hover:brightness-110'
              : 'bg-ink/10 text-ink/40'
          )}
        >
          <CheckCircle2 size={16} /> {publishing ? 'Publishing…' : 'Publish all clubs'}
        </button>
      </div>
    </section>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-ink/10 bg-surface-sunken p-4 text-center">
    <p className="text-2xl font-black text-ink">{value}</p>
    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-ink/35">{label}</p>
  </div>
);
