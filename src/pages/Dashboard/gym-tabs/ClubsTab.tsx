import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, Gift, LockKeyhole, Package, Save, ShieldCheck, Trophy, UserMinus, Users, XCircle } from 'lucide-react';
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

type RewardClaim = {
  id: string;
  club_code: string;
  club_name: string;
  reward_label: string;
  status: 'claimed' | 'redeemed' | 'cancelled';
  claimed_at?: string | null;
  member?: {
    user_id: string;
    name: string;
    phone?: string | null;
    avatar_url?: string | null;
  };
};

type TransferRequest = {
  id: string;
  status: string;
  admin_status: string;
  owner_status: string;
  max_level_reached?: number;
  eligible_level?: number | null;
  badges_count: number;
  clubs_count: number;
  source_gym: { name?: string | null };
  member?: { name?: string | null; phone?: string | null };
  clubs_preview?: Array<{ name?: string; stage?: number | null }>;
};

type ClubMember = {
  id: string;
  code: string;
  name: string;
  joined_at?: string | null;
  is_active: boolean;
  transfer?: {
    request_id?: string | null;
    source_gym_id?: string | null;
    source_club_code?: string | null;
  } | null;
  member: {
    user_id: string;
    name: string;
    phone?: string | null;
  };
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
  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>([]);
  const [redeemingId, setRedeemingId] = useState('');
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [reviewingTransferId, setReviewingTransferId] = useState('');
  const [removingClubId, setRemovingClubId] = useState('');
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
      const [clubsRes, claimsRes, transfersRes, membersRes] = await Promise.all([
        api.get(`/clubs/gyms/${gymId}/club-configs`),
        api.get(`/clubs/gyms/${gymId}/reward-claims?status=claimed`).catch(() => ({ data: { data: { claims: [] } } })),
        api.get(`/clubs/gyms/${gymId}/transfer-requests?status=pending`).catch(() => ({ data: { data: { requests: [] } } })),
        api.get(`/clubs/gyms/${gymId}/club-memberships`).catch(() => ({ data: { data: { memberships: [] } } })),
      ]);
      setClubs(clubsRes.data?.data?.clubs || []);
      setRewardClaims(claimsRes.data?.data?.claims || []);
      setTransferRequests(transfersRes.data?.data?.requests || []);
      setClubMembers(membersRes.data?.data?.memberships || []);
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

  const redeemClaim = async (claim: RewardClaim) => {
    if (!gymId) return;
    setRedeemingId(claim.id);
    setError('');
    try {
      await api.patch(`/clubs/gyms/${gymId}/reward-claims/${claim.id}`, { status: 'redeemed' });
      setRewardClaims((items) => items.filter((item) => item.id !== claim.id));
      showNotification('Reward marked redeemed', 'success');
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      showNotification(message, 'error');
    } finally {
      setRedeemingId('');
    }
  };

  const reviewTransfer = async (request: TransferRequest, ownerStatus: 'approved' | 'rejected') => {
    if (!gymId) return;
    setReviewingTransferId(`${request.id}:${ownerStatus}`);
    setError('');
    try {
      await api.patch(`/clubs/gyms/${gymId}/transfer-requests/${request.id}`, {
        owner_status: ownerStatus,
        owner_note: ownerStatus === 'approved' ? 'Approved from web Clubs management' : 'Rejected from web Clubs management',
      });
      await fetchClubs();
      showNotification(ownerStatus === 'approved' ? 'Transfer approved' : 'Transfer rejected', 'success');
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      showNotification(message, 'error');
    } finally {
      setReviewingTransferId('');
    }
  };

  const removeClubMember = async (member: ClubMember) => {
    if (!gymId) return;
    setRemovingClubId(member.id);
    setError('');
    try {
      await api.patch(`/clubs/gyms/${gymId}/club-memberships/${member.id}`, {
        is_active: false,
        removal_reason: 'Removed by gym owner from web Clubs management',
      });
      setClubMembers((items) => items.filter((item) => item.id !== member.id));
      showNotification('Member removed from club', 'success');
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      showNotification(message, 'error');
    } finally {
      setRemovingClubId('');
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Clubs" value={clubs.length} />
            <Stat label="Active" value={clubs.filter((club) => club.is_active).length} />
            <Stat label="Claims" value={rewardClaims.length} />
            <Stat label="Transfers" value={transferRequests.length} />
          </div>
        </div>
      </section>

      {transferRequests.length > 0 && (
        <section className="rounded-[1.5rem] border border-primary/20 bg-primary/10 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-black/25 text-primary">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Approval queue</p>
                <h2 className="mt-1 text-2xl font-black text-white">Club transfer requests</h2>
                <p className="mt-1 text-sm font-semibold text-white/50">Review carry requests from members changing into this gym.</p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {transferRequests.map((request) => {
              const approving = reviewingTransferId === `${request.id}:approved`;
              const rejecting = reviewingTransferId === `${request.id}:rejected`;
              return (
                <div key={request.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{request.member?.name || 'Member'}</p>
                      <p className="mt-1 text-xs font-bold text-white/45">
                        From {request.source_gym?.name || 'previous gym'} · Level {request.eligible_level || request.max_level_reached || 5}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase text-white/45">{request.badges_count} badges</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase text-white/45">{request.clubs_count} clubs</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase text-white/45">Admin {request.admin_status}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => reviewTransfer(request, 'approved')}
                        disabled={!!reviewingTransferId}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-black transition hover:brightness-110 disabled:opacity-60"
                        aria-label="Approve transfer"
                      >
                        {approving ? '...' : <ShieldCheck size={16} />}
                      </button>
                      <button
                        onClick={() => reviewTransfer(request, 'rejected')}
                        disabled={!!reviewingTransferId}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white transition hover:brightness-110 disabled:opacity-60"
                        aria-label="Reject transfer"
                      >
                        {rejecting ? '...' : <XCircle size={16} />}
                      </button>
                    </div>
                  </div>
                  {!!request.clubs_preview?.length && (
                    <p className="mt-3 truncate text-xs font-bold text-white/38">
                      {request.clubs_preview.map((club) => club.name).filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {clubMembers.length > 0 && (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Club members</p>
              <h2 className="mt-1 text-2xl font-black text-white">Active member authority</h2>
              <p className="mt-1 text-sm font-semibold text-white/45">Remove members from club benefits when needed.</p>
            </div>
            <Users className="shrink-0 text-primary" size={22} />
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {clubMembers.slice(0, 8).map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                <Users className="shrink-0 text-primary" size={18} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">{member.member.name}</p>
                  <p className="mt-1 truncate text-xs font-bold text-white/45">{member.name}</p>
                  {member.transfer && <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">Transferred club</p>}
                </div>
                <button
                  onClick={() => removeClubMember(member)}
                  disabled={removingClubId === member.id}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white transition hover:brightness-110 disabled:opacity-60"
                  aria-label="Remove club member"
                >
                  {removingClubId === member.id ? '...' : <UserMinus size={16} />}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-black/25 text-emerald-300">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Reward desk</p>
              <h2 className="mt-1 text-2xl font-black text-white">{rewardClaims.length} pending claim{rewardClaims.length === 1 ? '' : 's'}</h2>
              <p className="mt-1 text-sm font-semibold text-white/50">Redeem Club benefits quickly so members trust the loyalty loop.</p>
            </div>
          </div>
        </div>

        {rewardClaims.length > 0 ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {rewardClaims.slice(0, 4).map((claim) => (
              <div key={claim.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{claim.member?.name || 'Member'}</p>
                    <p className="mt-1 truncate text-xs font-bold text-white/45">{claim.reward_label}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">{claim.club_name}</p>
                  </div>
                  <button
                    onClick={() => redeemClaim(claim)}
                    disabled={redeemingId === claim.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black transition hover:brightness-110 disabled:opacity-60"
                  >
                    <CheckCircle2 size={13} /> {redeemingId === claim.id ? 'Saving' : 'Redeem'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-5 text-sm font-semibold text-white/45">
            No pending reward claims right now.
          </div>
        )}
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
