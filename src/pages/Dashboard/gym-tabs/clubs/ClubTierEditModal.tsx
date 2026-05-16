import { X } from 'lucide-react';
import type { ClubConfig } from '../../../../types/clubs';
import { fromLinesText, toLinesText } from './clubsOwnerUtils';

type Props = {
  club: ClubConfig;
  maxFeeDiscount: number;
  maxSupplementDiscount: number;
  onClose: () => void;
  onChange: (club: ClubConfig) => void;
};

export default function ClubTierEditModal({ club, maxFeeDiscount, maxSupplementDiscount, onClose, onChange }: Props) {
  const patch = (updater: (item: ClubConfig) => ClubConfig) => onChange(updater(club));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-white/10 bg-[#121212] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Edit tier</p>
            <h3 className="mt-1 text-2xl font-black text-white">{club.club_name}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 p-2 text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Club name" value={club.club_name} onChange={(value) => patch((item) => ({ ...item, club_name: value }))} />
          <Toggle label="Active" checked={club.is_active} onChange={(value) => patch((item) => ({ ...item, is_active: value }))} />
          <Field
            label="Renewal savings %"
            type="number"
            value={String(club.fee_discount_percent || 0)}
            onChange={(value) => patch((item) => ({ ...item, fee_discount_percent: Math.min(maxFeeDiscount, Math.max(0, Number(value) || 0)) }))}
          />
          <Field
            label="Supplement pricing %"
            type="number"
            value={String(club.supplement_discount_percent || 0)}
            onChange={(value) => patch((item) => ({ ...item, supplement_discount_percent: Math.min(maxSupplementDiscount, Math.max(0, Number(value) || 0)) }))}
          />
          <Field
            label="Free trainer sessions/mo"
            type="number"
            value={String(club.free_trainer_sessions_per_month || 0)}
            onChange={(value) => patch((item) => ({ ...item, free_trainer_sessions_per_month: Math.max(0, Number(value) || 0) }))}
          />
          <Field label="Reward preview" value={club.reward_preview || ''} onChange={(value) => patch((item) => ({ ...item, reward_preview: value }))} />
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Tasks (one per line)</span>
          <textarea
            value={toLinesText(club.tasks)}
            onChange={(event) => patch((item) => ({ ...item, tasks: fromLinesText(event.target.value) }))}
            rows={5}
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary/50"
          />
        </label>

        {!club.protected_status && (
          <label className="mt-4 block space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Comeback mission</span>
            <textarea
              value={club.comeback_mission?.description || ''}
              onChange={(event) =>
                patch((item) => ({
                  ...item,
                  comeback_mission: event.target.value
                    ? { ...(item.comeback_mission || {}), title: 'Comeback mission', description: event.target.value }
                    : null,
                }))
              }
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary/50"
            />
          </label>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-xs font-black uppercase text-black"
        >
          Done
        </button>
      </div>
    </div>
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

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`rounded-2xl border px-4 py-3 text-left text-xs font-black uppercase tracking-widest ${
      checked ? 'border-primary/35 bg-primary/15 text-primary' : 'border-white/10 bg-black/20 text-white/42'
    }`}
  >
    {label}: {checked ? 'Yes' : 'No'}
  </button>
);
