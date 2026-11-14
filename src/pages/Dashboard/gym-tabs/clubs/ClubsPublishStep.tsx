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
    <section className="rounded-[1.5rem] border border-border bg-surface-raised p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent-text">Step 3</p>
      <h2 className="mt-1 text-2xl font-bold text-ink">Publish to members</h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-muted">
        This saves all {clubs.length} club tiers at once. Members will see the journey, rewards, and Migo nudges after publish.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Tiers" value={clubs.length} />
        <Stat label="Active" value={activeCount} />
        <Stat label="Warnings" value={warnings.length} />
      </div>

      {errors.length > 0 && (
        <p className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          Resolve validation errors on the review step before publishing.
        </p>
      )}

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-gm-lg border border-border bg-surface-sunken p-4">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border-strong accent-accent"
        />
        <span className="text-sm font-semibold leading-6 text-ink-muted">
          I reviewed all 8 clubs. Rewards match what my gym can afford and support our renewal goals.
        </span>
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-xs font-bold uppercase text-ink-muted"
        >
          <ChevronLeft size={14} /> Back to review
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={!confirmed || publishing || errors.length > 0}
          className={clsx(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold uppercase transition',
            confirmed && !errors.length
              ? 'bg-accent text-on-accent hover:brightness-110'
              : 'bg-surface-sunken text-ink-muted'
          )}
        >
          <CheckCircle2 size={16} /> {publishing ? 'Publishing…' : 'Publish all clubs'}
        </button>
      </div>
    </section>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-gm-lg border border-border bg-surface-sunken p-4 text-center">
    <p className="text-2xl font-bold text-ink">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-ink-subtle">{label}</p>
  </div>
);
