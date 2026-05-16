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
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              {isPublished ? 'Published — Live' : 'Step 2 — Review'}
            </p>
            <h2 className="text-xl font-black text-white">
              {isPublished ? `${clubs.length} clubs active for members` : 'Tap a club to expand'}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {isPublished ? (
              <button
                type="button"
                onClick={onRebuild}
                className="rounded-lg border border-primary/30 px-3 py-2 text-[10px] font-black uppercase text-primary"
              >
                Rebuild journey
              </button>
            ) : (
              <>
                <button type="button" onClick={onBack} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black uppercase text-white/55">
                  Back
                </button>
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={regenerating}
                  className="rounded-lg border border-primary/30 px-3 py-2 text-[10px] font-black uppercase text-primary disabled:opacity-50"
                >
                  {regenerating ? 'Regenerating…' : 'Regenerate'}
                </button>
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={errors.length > 0}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[10px] font-black uppercase text-black disabled:opacity-50"
                >
                  Publish <ChevronRight size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {summary && (
          <p className="text-xs font-semibold text-white/45">
            ₹{summary.total_estimated_cost_inr} est. cost · {summary.task_type_count} task types
            {summary.first_month_hook_tier ? ` · Month-1 hook: tier ${summary.first_month_hook_tier}` : ''}
            {(summary.protected_tiers || []).length ? ` · Protected: ${(summary.protected_tiers || []).join(', ')}` : ''}
          </p>
        )}

        {isPublished && (
          <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100">
            Members see this ladder in the app. Tap a tier to view tasks and rewards, or edit a single club.
          </p>
        )}

        {!isPublished && errors.length > 0 && (
          <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-100">
            <p>{errors[0]?.message || 'Fix validation errors before publishing.'}</p>
            {errors.slice(1, 4).map((issue) => (
              <p key={`${issue.code}-${issue.message}`} className="mt-1 text-red-100/85">
                · {issue.message}
              </p>
            ))}
            {errors.length > 4 ? <p className="mt-1 text-red-100/70">+{errors.length - 4} more</p> : null}
          </div>
        )}

        {!isPublished && warnings.length > 0 && !errors.length && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100">
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
                expanded ? 'border-primary/30 bg-white/[0.05]' : 'border-white/10 bg-white/[0.02]',
                tier === 1 && !expanded && 'border-primary/20'
              )}
            >
              <button
                type="button"
                onClick={() => toggle(club.mission_code)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-black text-primary">
                  {tier}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-black text-white">{club.club_name}</span>
                <span className="hidden shrink-0 text-[10px] font-bold text-white/35 sm:inline">
                  {club.timeline_label || '—'}
                </span>
                {savings && (
                  <span className="shrink-0 rounded-md bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black text-emerald-200">
                    {savings}
                  </span>
                )}
                {isPublished && !club.is_active && (
                  <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-black text-white/45">
                    Off
                  </span>
                )}
                {expanded ? <ChevronUp size={16} className="shrink-0 text-white/40" /> : <ChevronDown size={16} className="shrink-0 text-white/40" />}
              </button>

              {expanded && (
                <div className="space-y-2 border-t border-white/10 px-3 pb-3 pt-2">
                  {club.club_definition && (
                    <p className="text-xs font-semibold leading-5 text-white/45">{club.club_definition}</p>
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
                              isEasy ? 'text-sky-200/90' : 'text-white/55'
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
                              meaningful ? 'text-emerald-200/95' : 'text-white/50'
                            )}
                          >
                            {meaningful ? '★' : '·'}{' '}
                            {reward.value || reward.label}
                            {reward.value && reward.label && reward.label !== reward.value ? (
                              <span className="text-white/35"> ({reward.label})</span>
                            ) : null}
                          </p>
                        );
                      })}
                    </DetailBlock>
                  )}
                  {ownerWarnings.slice(0, 1).map((warning) => (
                    <p key={warning} className="flex items-center gap-1 text-[11px] font-bold text-amber-100">
                      <AlertTriangle size={11} /> {warning}
                    </p>
                  ))}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditTier(club);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase text-white/60 hover:text-white"
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
  <span className="rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase text-white/50">
    {label}
  </span>
);

const DetailBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black uppercase tracking-wider text-white/35">{title}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
);
