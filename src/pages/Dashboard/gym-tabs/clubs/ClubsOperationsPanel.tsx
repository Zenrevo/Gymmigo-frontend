import { CheckCircle2, Package, ShieldCheck, UserMinus, Users, XCircle } from 'lucide-react';

type RewardClaim = {
  id: string;
  club_name: string;
  reward_label: string;
  member?: { name: string };
};

type TransferRequest = {
  id: string;
  source_gym: { name?: string | null };
  member?: { name?: string | null };
};

type ClubMember = {
  id: string;
  name: string;
  member: { name: string };
};

type Props = {
  rewardClaims: RewardClaim[];
  transferRequests: TransferRequest[];
  clubMembers: ClubMember[];
  redeemingId: string;
  reviewingTransferId: string;
  removingClubId: string;
  onRedeem: (claim: RewardClaim) => void | Promise<void>;
  onReviewTransfer: (request: TransferRequest, status: 'approved' | 'rejected') => void;
  onRemoveMember: (member: ClubMember) => void;
};

export default function ClubsOperationsPanel({
  rewardClaims,
  transferRequests,
  clubMembers,
  redeemingId,
  reviewingTransferId,
  removingClubId,
  onRedeem,
  onReviewTransfer,
  onRemoveMember,
}: Props) {
  if (!rewardClaims.length && !transferRequests.length && !clubMembers.length) {
    return (
      <section className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm font-semibold text-white/45">
        No pending club operations. Reward claims and transfer requests will appear here.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {transferRequests.length > 0 && (
        <section className="rounded-[1.5rem] border border-primary/20 bg-primary/10 p-5">
          <PanelHeader icon={ShieldCheck} title="Club transfer requests" subtitle="Review carry requests from members changing gyms." />
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {transferRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-sm font-black text-white">{request.member?.name || 'Member'}</p>
                <p className="mt-1 text-xs font-bold text-white/45">From {request.source_gym?.name || 'previous gym'}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onReviewTransfer(request, 'approved')}
                    disabled={!!reviewingTransferId}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-black disabled:opacity-60"
                  >
                    <ShieldCheck size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReviewTransfer(request, 'rejected')}
                    disabled={!!reviewingTransferId}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white disabled:opacity-60"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {rewardClaims.length > 0 && (
        <section className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
          <PanelHeader
            icon={Package}
            title={`${rewardClaims.length} pending reward claim${rewardClaims.length === 1 ? '' : 's'}`}
            subtitle="Redeem at the desk so members trust the loyalty loop."
          />
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {rewardClaims.slice(0, 6).map((claim) => (
              <div key={claim.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-sm font-black text-white">{claim.member?.name || 'Member'}</p>
                <p className="mt-1 text-xs font-bold text-white/45">{claim.club_name}</p>
                <p className="text-xs font-semibold text-white/35">{claim.reward_label}</p>
                <button
                  type="button"
                  onClick={() => onRedeem(claim)}
                  disabled={redeemingId === claim.id}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-[10px] font-black uppercase text-black disabled:opacity-60"
                >
                  <CheckCircle2 size={13} /> {redeemingId === claim.id ? 'Saving' : 'Redeem'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {clubMembers.length > 0 && (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
          <PanelHeader icon={Users} title="Active club members" subtitle="Remove members from club benefits when needed." />
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {clubMembers.slice(0, 8).map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">{member.member.name}</p>
                  <p className="truncate text-xs font-bold text-white/45">{member.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveMember(member)}
                  disabled={removingClubId === member.id}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white disabled:opacity-60"
                >
                  <UserMinus size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const PanelHeader = ({ icon: Icon, title, subtitle }: { icon: typeof Package; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-primary">
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Operations</p>
      <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-white/50">{subtitle}</p>
    </div>
  </div>
);
