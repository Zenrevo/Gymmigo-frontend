import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Gift, LockKeyhole, Save, Trophy } from 'lucide-react';
import api, { getApiErrorMessage } from '../../../utils/api';
import PageLoader from '../../../components/PageLoader';
import { useGym } from '../../../context/GymContext';
import { useNotification } from '../../../context/NotificationContext';
import clsx from 'clsx';

type ClubConfig = {
  id: string;
  mission_code: string;
  club_code: string;
  club_name: string;
  club_definition?: string | null;
  mission: {
    title: string;
    description: string;
    mission_type: string;
    target_value: number;
    points: number;
  };
  badge: {
    name: string;
    icon?: string | null;
    color?: string | null;
  };
  facilities: string[];
  reward_preview?: string | null;
  share_cta?: string | null;
  display_order: number;
  is_active: boolean;
};

const toFacilitiesText = (items?: string[]) => (items || []).join('\n');

const fromFacilitiesText = (value: string) => (
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
);

const formatMissionType = (value: string) => (
  value === 'check_in_count'
    ? 'Check-in count'
    : value === 'check_in_streak'
      ? 'Check-in streak'
      : 'Task completion'
);

const ClubsTab = () => {
  const { gymId } = useGym();
  const { showNotification } = useNotification();
  const [clubs, setClubs] = useState<ClubConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState('');
  const [error, setError] = useState('');

  const fetchClubs = useCallback(async () => {
    if (!gymId) {
      setClubs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/clubs/gyms/${gymId}/club-configs`);
      setClubs(res.data?.data?.clubs || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const updateClub = (missionCode: string, updater: (club: ClubConfig) => ClubConfig) => {
    setClubs((items) => items.map((club) => (club.mission_code === missionCode ? updater(club) : club)));
  };

  const saveClub = async (club: ClubConfig) => {
    if (!gymId) return;
    setSavingCode(club.mission_code);
    setError('');
    try {
      const res = await api.patch(`/clubs/gyms/${gymId}/club-configs/${club.mission_code}`, {
        club_name: club.club_name.trim(),
        club_definition: (club.club_definition || '').trim(),
        mission_title: club.mission.title.trim(),
        mission_description: club.mission.description.trim(),
        target_value: Math.max(1, Number(club.mission.target_value) || 1),
        points: Math.max(0, Number(club.mission.points) || 0),
        badge_name: club.badge.name.trim(),
        facilities: club.facilities.map((facility) => facility.trim()).filter(Boolean),
        reward_preview: club.reward_preview || '',
        share_cta: club.share_cta || '',
        is_active: club.is_active,
      });
      const updated = res.data?.data?.club;
      if (updated) {
        setClubs((items) => items.map((item) => (item.mission_code === club.mission_code ? updated : item)));
      }
      showNotification('Club tier updated', 'success');
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      showNotification(message, 'error');
    } finally {
      setSavingCode('');
    }
  };

  if (loading) return <PageLoader message="Loading Club tiers..." />;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(241,130,44,0.16),rgba(255,255,255,0.035)_45%,rgba(34,197,94,0.10))] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <Trophy size={20} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Loyalty Engine</p>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-white sm:text-5xl">Fitness Clubs</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/48">
                Clubs are gym-defined loyalty tiers unlocked by required badges. Edit names, requirements, and real benefits like protein, discounts, personal training, or diet plans.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Clubs" value={clubs.length} />
            <Stat label="Active" value={clubs.filter((club) => club.is_active).length} />
            <Stat label="Benefits" value={clubs.reduce((sum, club) => sum + club.facilities.length, 0)} />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-5">
        {clubs.map((club, index) => {
          const saving = savingCode === club.mission_code;
          return (
            <motion.article
              key={club.mission_code}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035 }}
              className={clsx(
                'rounded-[1.75rem] border p-5',
                club.is_active ? 'border-white/10 bg-white/[0.035]' : 'border-white/5 bg-white/[0.018] opacity-70'
              )}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                    <Award size={25} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-black uppercase tracking-widest text-primary">Stage {index + 1}</p>
                      <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-black uppercase text-white/40">
                        {formatMissionType(club.mission.mission_type)}
                      </span>
                    </div>
                    <h2 className="mt-2 text-2xl font-black text-white">{club.club_name}</h2>
                    <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-white/42">{club.club_definition}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateClub(club.mission_code, (item) => ({ ...item, is_active: !item.is_active }))}
                    className={clsx(
                      'rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition',
                      club.is_active
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                        : 'border-white/10 bg-white/[0.03] text-white/40'
                    )}
                  >
                    {club.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => saveClub(club)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase text-black transition hover:brightness-110 disabled:opacity-60"
                  >
                    <Save size={15} /> {saving ? 'Saving' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Field
                  label="Club name"
                  value={club.club_name}
                  onChange={(value) => updateClub(club.mission_code, (item) => ({ ...item, club_name: value }))}
                />
                <Field
                  label="Required badge name"
                  value={club.badge.name}
                  onChange={(value) => updateClub(club.mission_code, (item) => ({ ...item, badge: { ...item.badge, name: value } }))}
                />
                <Field
                  label="Badge mission title"
                  value={club.mission.title}
                  onChange={(value) => updateClub(club.mission_code, (item) => ({ ...item, mission: { ...item.mission, title: value } }))}
                />
                <Field
                  label="Target value"
                  type="number"
                  helper="This is the required count before the Club unlocks."
                  value={String(club.mission.target_value)}
                  onChange={(value) => updateClub(club.mission_code, (item) => ({ ...item, mission: { ...item.mission, target_value: Math.max(1, Number(value) || 1) } }))}
                />
                <TextArea
                  label="Club definition"
                  value={club.club_definition || ''}
                  onChange={(value) => updateClub(club.mission_code, (item) => ({ ...item, club_definition: value }))}
                />
                <TextArea
                  label="Required badge mission"
                  value={club.mission.description}
                  onChange={(value) => updateClub(club.mission_code, (item) => ({ ...item, mission: { ...item.mission, description: value } }))}
                />
                <Field
                  label="Points"
                  type="number"
                  value={String(club.mission.points)}
                  onChange={(value) => updateClub(club.mission_code, (item) => ({ ...item, mission: { ...item.mission, points: Math.max(0, Number(value) || 0) } }))}
                />
                <TextArea
                  label="Club benefits / facilities"
                  helper="One per line. Example: free protein shake, 10% discount, personal training session."
                  value={toFacilitiesText(club.facilities)}
                  onChange={(value) => updateClub(club.mission_code, (item) => ({ ...item, facilities: fromFacilitiesText(value) }))}
                />
                <TextArea
                  label="Reward preview"
                  value={club.reward_preview || ''}
                  onChange={(value) => updateClub(club.mission_code, (item) => ({ ...item, reward_preview: value }))}
                />
                <TextArea
                  label="Share CTA"
                  helper="Shown after unlock to motivate referrals and sharing."
                  value={club.share_cta || ''}
                  onChange={(value) => updateClub(club.mission_code, (item) => ({ ...item, share_cta: value }))}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {club.facilities.map((facility) => (
                  <span key={facility} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-black text-white/55">
                    <Gift size={12} className="text-primary" /> {facility}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-black text-primary">
                  <LockKeyhole size={12} /> Unlocks after {club.mission.target_value} required action{club.mission.target_value === 1 ? '' : 's'}
                </span>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  helper?: string;
}) => (
  <label className="space-y-2">
    <span className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-primary/50"
    />
    {helper && <span className="block text-xs font-semibold text-white/32">{helper}</span>}
  </label>
);

const TextArea = ({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) => (
  <label className="space-y-2">
    <span className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</span>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={4}
      className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold leading-6 text-white outline-none transition focus:border-primary/50"
    />
    {helper && <span className="block text-xs font-semibold text-white/32">{helper}</span>}
  </label>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/35">{label}</p>
  </div>
);

export default ClubsTab;
