import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ChevronRight, Pencil } from 'lucide-react';
import clsx from 'clsx';
import type { ClubConfig, ClubDraftSummary, ClubGenerationInputs, ClubValidationResult } from '../../../../types/clubs';
import { getOwnerWarnings, RETENTION_MISSION_CODES } from './clubsOwnerUtils';

type Props = {
  mode?: 'draft' | 'published';
  clubs: ClubConfig[];
  summary?: ClubDraftSummary | null;
  validation?: ClubValidationResult | null;
  generationInputs: ClubGenerationInputs;
  onEditTier: (club: ClubConfig) => void;
  onBack?: () => void;
  onContinue?: () => void;
  onRegenerate?: () => void;
  onRebuild?: () => void;
  regenerating?: boolean;
};

export default function ClubsTimelineReviewStep({
  mode = 'draft',
  clubs,
  summary,
  validation,
  generationInputs,
  onBack,
  onContinue,
  onRegenerate,
  onRebuild,
  regenerating = false,
  onEditTier,
}: Props) {
  const isPublished = mode === 'published';
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const errors = validation?.errors || [];
  const warnings = validation?.warnings || [];

  const toggle = (missionCode: string) => {
    setExpandedCode((current) => (current === missionCode ? null : missionCode));
  };

  return (
    <section className="flex max-h-[calc(100vh-12rem)] flex-col gap-3">
      <div className="shrink-0 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent-text">
              {isPublished ? 'Published — Live' : 'Step 2 — Review'}
            </p>
            <h2 className="text-xl font-bold text-ink">
              {isPublished ? `${clubs.length} clubs active for members` : 'Tap a club to expand'}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {isPublished ? (
              <button
                type="button"
                onClick={onRebuild}
                className="rounded-lg border border-accent-border px-3 py-2 text-[10px] font-bold uppercase text-accent-text"
              >
                Rebuild journey
              </button>
            ) : (
              <>
                <button type="button" onClick={onBack} className="rounded-lg border border-border px-3 py-2 text-[10px] font-bold uppercase text-ink-muted">
                  Back
                </button>
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={regenerating}
                  className="rounded-lg border border-accent-border px-3 py-2 text-[10px] font-bold uppercase text-accent-text disabled:opacity-50"
                >
                  {regenerating ? 'Regenerating…' : 'Regenerate'}
                </button>
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={errors.length > 0}
                  className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-[10px] font-bold uppercase text-on-accent disabled:opacity-50"
                >
                  Publish <ChevronRight size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {summary && (
          <p className="text-xs font-semibold text-ink-muted">
            ₹{summary.total_estimated_cost_inr} est. cost · {summary.task_type_count} task types
            {summary.first_month_hook_tier ? ` · Month-1 hook: tier ${summary.first_month_hook_tier}` : ''}
            {(summary.protected_tiers || []).length ? ` · Protected: ${(summary.protected_tiers || []).join(', ')}` : ''}
          </p>
        )}

        {isPublished && (
          <p className="rounded-xl border border-success/30 bg-success-soft px-3 py-2 text-xs font-semibold text-success">
            Members see this ladder in the app. Tap a tier to view tasks and rewards, or edit a single club.
          </p>
        )}

        {!isPublished && errors.length > 0 && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
            <p>{errors[0]?.message || 'Fix validation errors before publishing.'}</p>
            {errors.slice(1, 4).map((issue) => (
              <p key={`${issue.code}-${issue.message}`} className="mt-1 text-danger">
                · {issue.message}
              </p>
            ))}
            {errors.length > 4 ? <p className="mt-1 text-danger">+{errors.length - 4} more</p> : null}
          </div>
        )}

        {!isPublished && warnings.length > 0 && !errors.length && (
          <div className="rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-xs font-semibold text-warning">
            {warnings.length} warning{warnings.length === 1 ? '' : 's'} — you can still publish
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {clubs.map((club) => {
          const tierIndex = RETENTION_MISSION_CODES.indexOf(club.mission_code as (typeof RETENTION_MISSION_CODES)[number]);
          const tier = club.tier ?? (tierIndex >= 0 ? tierIndex + 1 : 1);
          const expanded = expandedCode === club.mission_code;
          const ownerWarnings = getOwnerWarnings(club, tier, clubs.length, generationInputs);
          const clubRewards = club.rewards || [];
          const savings =
            club.fee_discount_percent && club.fee_discount_percent > 0
              ? `${club.fee_discount_percent}% renewal`
              : null;

          return (
            <div
              key={club.mission_code}
              className={clsx(
                'overflow-hidden rounded-xl border transition-colors',
                expanded ? 'border-accent-border bg-surface-raised' : 'border-border bg-surface-raised',
                tier === 1 && !expanded && 'border-accent-border'
              )}
            >
              <button
                type="button"
                onClick={() => toggle(club.mission_code)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-[11px] font-bold text-accent-text">
                  {tier}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{club.club_name}</span>
                <span className="hidden shrink-0 text-[10px] font-bold text-ink-subtle sm:inline">
                  {club.timeline_label || '—'}
                </span>
                {savings && (
                  <span className="shrink-0 rounded-md bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
                    {savings}
                  </span>
                )}
                {isPublished && !club.is_active && (
                  <span className="shrink-0 rounded-md bg-surface-sunken px-2 py-0.5 text-[10px] font-bold text-ink-muted">
                    Off
                  </span>
                )}
                {expanded ? <ChevronUp size={16} className="shrink-0 text-ink-muted" /> : <ChevronDown size={16} className="shrink-0 text-ink-muted" />}
              </button>

              {expanded && (
                <div className="space-y-2 border-t border-border px-3 pb-3 pt-2">
                  {club.club_definition && (
                    <p className="text-xs font-semibold leading-5 text-ink-muted">{club.club_definition}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {club.first_month_renewal_hook && <Tag label="Month-1 hook" />}
                    {club.protected_status && <Tag label="Protected" />}
                    {club.transfer_carry_eligible && <Tag label="Transfer" />}
                  </div>
                  {(club.tasks || []).length > 0 && (
                    <DetailBlock title="Tasks">
                      {(club.tasks || []).map((task, taskIndex) => {
                        const isEasy = task.toLowerCase().startsWith('easy:');
                        return (
                          <p
                            key={`${club.mission_code}-task-${taskIndex}`}
                            className={clsx(
                              'text-xs font-semibold',
                              isEasy ? 'text-info' : 'text-ink-muted'
                            )}
                          >
                            {isEasy ? '○' : '●'} {task}
                          </p>
                        );
                      })}
                    </DetailBlock>
                  )}
                  {clubRewards.length > 0 && (
                    <DetailBlock title="Rewards">
                      {clubRewards.map((reward, rewardIndex) => {
                        const meaningful = reward.reward_tier === 'meaningful' || rewardIndex === 0;
                        return (
                          <p
                            key={`${club.mission_code}-reward-${rewardIndex}`}
                            className={clsx(
                              'text-xs font-semibold',
                              meaningful ? 'text-success' : 'text-ink-muted'
                            )}
                          >
                            {meaningful ? '★' : '·'}{' '}
                            {reward.value || reward.label}
                            {reward.value && reward.label && reward.label !== reward.value ? (
                              <span className="text-ink-subtle"> ({reward.label})</span>
                            ) : null}
                          </p>
                        );
                      })}
                    </DetailBlock>
                  )}
                  {ownerWarnings.slice(0, 1).map((warning) => (
                    <p key={warning} className="flex items-center gap-1 text-[11px] font-bold text-warning">
                      <AlertTriangle size={11} /> {warning}
                    </p>
                  ))}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditTier(club);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[10px] font-bold uppercase text-ink-muted hover:text-ink"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const Tag = ({ label }: { label: string }) => (
  <span className="rounded-md border border-border bg-surface-sunken px-2 py-0.5 text-[9px] font-bold uppercase text-ink-muted">
    {label}
  </span>
);

const DetailBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">{title}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
);
