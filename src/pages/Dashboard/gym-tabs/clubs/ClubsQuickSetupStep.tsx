import { ChevronDown, ChevronUp, Sparkles, Wand2 } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import type { ClubGenerationInputs } from '../../../../types/clubs';
import { PRIMARY_GOAL_OPTIONS } from '../../../../types/clubs';

type DetectedGym = {
  gym_name?: string;
  facilities?: string[];
  supplement_partner_enabled?: boolean;
  available_trainers?: boolean;
  body_composition_scan_supported?: boolean;
};

type Props = {
  inputs: ClubGenerationInputs;
  detectedGym?: DetectedGym | null;
  suggestedInputs?: Partial<ClubGenerationInputs> | null;
  generating: boolean;
  onChange: (inputs: ClubGenerationInputs) => void;
  onGenerate: () => void;
};

export default function ClubsQuickSetupStep({ inputs, detectedGym, suggestedInputs, generating, onChange, onGenerate }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const applySuggested = () => {
    if (!suggestedInputs) return;
    onChange({
      ...inputs,
      supplement_partner_enabled: suggestedInputs.supplement_partner_enabled ?? inputs.supplement_partner_enabled,
      trainer_available: suggestedInputs.trainer_available ?? inputs.trainer_available,
      body_composition_scan_supported:
        suggestedInputs.body_composition_scan_supported ?? inputs.body_composition_scan_supported,
      protection_enabled: suggestedInputs.protection_enabled ?? inputs.protection_enabled,
    });
  };

  return (
    <section className="rounded-[1.5rem] border border-primary/20 bg-primary/10 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/25 bg-black/25 text-primary">
              <Wand2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Step 1</p>
              <h2 className="text-2xl font-black text-white">Build your retention journey</h2>
            </div>
          </div>
          <p className="text-sm font-semibold leading-6 text-white/55">
            We load your gym plans, facilities, and equipment automatically. Pick your goal and max savings — then we generate
            eight clubs from easy to hard with meaningful rewards.
          </p>
          {detectedGym?.gym_name && (
            <p className="text-xs font-bold text-white/40">
              Detected for {detectedGym.gym_name}
              {detectedGym.facilities?.length ? ` · ${detectedGym.facilities.slice(0, 4).join(', ')}` : ''}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-black uppercase text-black transition hover:brightness-110 disabled:opacity-60"
        >
          <Sparkles size={16} /> {generating ? 'Building journey…' : 'Build my club journey'}
        </button>
      </div>

      <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/35">Primary goal</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PRIMARY_GOAL_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange({ ...inputs, primary_goal: option.id })}
            className={clsx(
              'rounded-2xl border p-4 text-left transition',
              inputs.primary_goal === option.id
                ? 'border-primary/40 bg-primary/15'
                : 'border-white/10 bg-black/20 hover:border-white/20'
            )}
          >
            <p className="text-sm font-black text-white">{option.label}</p>
            <p className="mt-1 text-xs font-semibold text-white/45">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Field
          label="Max renewal savings %"
          type="number"
          value={String(inputs.max_fee_discount_percent)}
          onChange={(value) => onChange({ ...inputs, max_fee_discount_percent: Math.min(30, Math.max(0, Number(value) || 0)) })}
        />
        <Field
          label="Max supplement pricing %"
          type="number"
          value={String(inputs.max_supplement_discount_percent)}
          onChange={(value) =>
            onChange({ ...inputs, max_supplement_discount_percent: Math.min(20, Math.max(0, Number(value) || 0)) })
          }
        />
        <Field
          label="Monthly reward budget ₹"
          type="number"
          value={String(inputs.gym_reward_budget_inr)}
          onChange={(value) => onChange({ ...inputs, gym_reward_budget_inr: Math.max(0, Number(value) || 0) })}
        />
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Notes (optional)</span>
        <textarea
          value={inputs.owner_notes}
          onChange={(event) => onChange({ ...inputs, owner_notes: event.target.value })}
          rows={2}
          placeholder="Supplement brands, trainer capacity, rewards you can afford…"
          className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary/50"
        />
      </label>

      <button
        type="button"
        onClick={() => setAdvancedOpen((open) => !open)}
        className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/50"
      >
        Advanced gym capabilities
        {advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {advancedOpen && (
        <div className="mt-4 space-y-4">
          {suggestedInputs && (
            <button
              type="button"
              onClick={applySuggested}
              className="text-xs font-bold text-primary hover:underline"
            >
              Apply detected gym settings
            </button>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <TogglePill
              label="Supplement partner"
              checked={inputs.supplement_partner_enabled}
              onChange={(value) => onChange({ ...inputs, supplement_partner_enabled: value })}
            />
            <TogglePill
              label="Trainer available"
              checked={inputs.trainer_available}
              onChange={(value) => onChange({ ...inputs, trainer_available: value })}
            />
            <TogglePill
              label="Body scan"
              checked={inputs.body_composition_scan_supported}
              onChange={(value) => onChange({ ...inputs, body_composition_scan_supported: value })}
            />
            <TogglePill
              label="Protect top 3 clubs"
              checked={inputs.protection_enabled}
              onChange={(value) => onChange({ ...inputs, protection_enabled: value })}
            />
          </div>
        </div>
      )}
    </section>
  );
}

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
}) => (
  <label className="space-y-2">
    <span className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary/50"
    />
  </label>
);

const TogglePill = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={clsx(
      'rounded-2xl border px-4 py-3 text-left text-xs font-black uppercase tracking-widest transition',
      checked ? 'border-primary/35 bg-primary/15 text-primary' : 'border-white/10 bg-black/20 text-white/42'
    )}
  >
    {label}: {checked ? 'Yes' : 'No'}
  </button>
);
