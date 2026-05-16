import { useCallback, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import api, { getApiErrorMessage, getApiValidationIssues } from '../../../utils/api';
import PageLoader from '../../../components/PageLoader';
import { useGym } from '../../../context/GymContext';
import { useNotification } from '../../../context/NotificationContext';
import type {
  ClubConfig,
  ClubDraftSummary,
  ClubGenerationInputs,
  ClubValidationResult,
} from '../../../types/clubs';
import ClubsQuickSetupStep from './clubs/ClubsQuickSetupStep';
import ClubsTimelineReviewStep from './clubs/ClubsTimelineReviewStep';
import ClubsPublishStep from './clubs/ClubsPublishStep';
import ClubTierEditModal from './clubs/ClubTierEditModal';
import ClubsOperationsPanel from './clubs/ClubsOperationsPanel';
import { clubToPublishPayload, normalizeClubList } from './clubs/clubsOwnerUtils';

type WizardStep = 1 | 2 | 3;

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

const defaultGenerationInputs = (): ClubGenerationInputs => ({
  primary_goal: 'renewals',
  max_fee_discount_percent: 30,
  max_supplement_discount_percent: 20,
  gym_reward_budget_inr: 0,
  supplement_partner_enabled: false,
  trainer_available: false,
  body_composition_scan_supported: false,
  protection_enabled: true,
  owner_notes: '',
});

const ClubsTab = () => {
  const { gymId } = useGym();
  const { showNotification } = useNotification();
  const [clubs, setClubs] = useState<ClubConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [hasDraft, setHasDraft] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generationInputs, setGenerationInputs] = useState<ClubGenerationInputs>(defaultGenerationInputs);
  const [suggestedInputs, setSuggestedInputs] = useState<Partial<ClubGenerationInputs> | null>(null);
  const [gymContext, setGymContext] = useState<Record<string, unknown> | null>(null);
  const [summary, setSummary] = useState<ClubDraftSummary | null>(null);
  const [validation, setValidation] = useState<ClubValidationResult | null>(null);
  const [editingClub, setEditingClub] = useState<ClubConfig | null>(null);
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [rebuildOpen, setRebuildOpen] = useState(false);
  const [error, setError] = useState('');

  const hasPublishedClubs = clubs.length > 0 && !hasDraft;
  const showSetup = hasDraft || !hasPublishedClubs || rebuildOpen;

  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [redeemingId, setRedeemingId] = useState('');
  const [reviewingTransferId, setReviewingTransferId] = useState('');
  const [removingClubId, setRemovingClubId] = useState('');

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
      setClubs(normalizeClubList(clubsRes.data?.data?.clubs || []));
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

  const generateDraft = async (options?: { skipAi?: boolean }) => {
    if (!gymId || generatingDraft) return;
    setGeneratingDraft(true);
    setError('');
    try {
      const res = await api.post(
        `/clubs/gyms/${gymId}/club-configs/generate-preview`,
        {
          primary_goal: generationInputs.primary_goal,
          max_fee_discount_percent: generationInputs.max_fee_discount_percent,
          max_supplement_discount_percent: generationInputs.max_supplement_discount_percent,
          gym_reward_budget_inr: generationInputs.gym_reward_budget_inr || undefined,
          supplement_partner_enabled: generationInputs.supplement_partner_enabled,
          trainer_available: generationInputs.trainer_available,
          body_composition_scan_supported: generationInputs.body_composition_scan_supported,
          protection_enabled: generationInputs.protection_enabled,
          skip_ai: options?.skipAi ?? false,
          owner_notes: generationInputs.owner_notes.trim() || undefined,
        },
        { timeout: 90000 }
      );
      const generatedClubs = normalizeClubList(res.data?.data?.clubs || []);
      const aiNotes = (res.data?.data?.ai_notes || []) as string[];
      if (!generatedClubs.length) {
        const message = 'Club generation returned no tiers. Please retry or contact support.';
        setError(message);
        showNotification(message, 'error');
        return;
      }
      setClubs(generatedClubs);
      setSummary(res.data?.data?.summary || null);
      setValidation(res.data?.data?.validation || null);
      setGymContext(res.data?.data?.gym_context || null);
      const suggested = res.data?.data?.suggested_owner_inputs;
      if (suggested) {
        setSuggestedInputs({
          supplement_partner_enabled: suggested.supplement_partner_enabled,
          trainer_available: suggested.trainer_available,
          body_composition_scan_supported: suggested.body_composition_scan_supported,
          protection_enabled: suggested.protection_enabled,
        });
      }
      setHasDraft(true);
      setWizardStep(2);
      const status = res.data?.data?.generation_status;
      showNotification(
        status === 'generated'
          ? 'Club journey draft ready for review'
          : aiNotes[0] || 'Club journey draft ready (framework template)',
        'success'
      );
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      showNotification(message, 'error');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const publishAll = async () => {
    if (!gymId) return;
    setPublishing(true);
    setError('');
    try {
      const payload = clubs.map((club) => clubToPublishPayload(club, generationInputs));
      await api.post(`/clubs/gyms/${gymId}/club-configs/publish-batch`, {
        owner_confirmed: true,
        clubs: payload,
      });
      showNotification('All club tiers published', 'success');
      setHasDraft(false);
      setRebuildOpen(false);
      setWizardStep(1);
      await fetchClubs();
    } catch (err) {
      const issues = getApiValidationIssues(err);
      const message =
        issues.length > 0
          ? issues.slice(0, 3).map((issue) => issue.message).join(' ')
          : getApiErrorMessage(err);
      if (issues.length > 0) {
        setValidation({
          errors: issues,
          warnings: [],
        });
        setWizardStep(2);
      }
      setError(message);
      showNotification(message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const updateClubInList = async (updated: ClubConfig) => {
    const normalized = normalizeClubList([updated])[0];
    if (hasPublishedClubs && gymId) {
      try {
        await api.patch(
          `/clubs/gyms/${gymId}/club-configs/${normalized.mission_code}`,
          clubToPublishPayload(normalized, generationInputs)
        );
        showNotification('Club tier saved', 'success');
      } catch (err) {
        showNotification(getApiErrorMessage(err), 'error');
        return;
      }
    }
    setClubs((items) =>
      items.map((club) => (club.mission_code === normalized.mission_code ? normalized : club))
    );
    setEditingClub(null);
  };

  const redeemClaim = async (claim: RewardClaim) => {
    if (!gymId) return;
    setRedeemingId(claim.id);
    try {
      await api.patch(`/clubs/gyms/${gymId}/reward-claims/${claim.id}`, { status: 'redeemed' });
      setRewardClaims((items) => items.filter((item) => item.id !== claim.id));
      showNotification('Reward marked redeemed', 'success');
    } catch (err) {
      showNotification(getApiErrorMessage(err), 'error');
    } finally {
      setRedeemingId('');
    }
  };

  const reviewTransfer = async (request: TransferRequest, ownerStatus: 'approved' | 'rejected') => {
    if (!gymId) return;
    setReviewingTransferId(`${request.id}:${ownerStatus}`);
    try {
      await api.patch(`/clubs/gyms/${gymId}/transfer-requests/${request.id}`, {
        owner_status: ownerStatus,
        owner_note: ownerStatus === 'approved' ? 'Approved from web Clubs management' : 'Rejected from web Clubs management',
      });
      await fetchClubs();
      showNotification(ownerStatus === 'approved' ? 'Transfer approved' : 'Transfer rejected', 'success');
    } catch (err) {
      showNotification(getApiErrorMessage(err), 'error');
    } finally {
      setReviewingTransferId('');
    }
  };

  const removeClubMember = async (member: ClubMember) => {
    if (!gymId) return;
    setRemovingClubId(member.id);
    try {
      await api.patch(`/clubs/gyms/${gymId}/club-memberships/${member.id}`, {
        is_active: false,
        removal_reason: 'Removed by gym owner from web Clubs management',
      });
      setClubMembers((items) => items.filter((item) => item.id !== member.id));
      showNotification('Member removed from club', 'success');
    } catch (err) {
      showNotification(getApiErrorMessage(err), 'error');
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
                Three steps: set your goal, review the 8-club journey, publish once. Members unlock renewal savings before month one ends.
              </p>
            </div>
          </div>
          <StepIndicator
            current={wizardStep}
            hasDraft={hasDraft}
            hasPublished={hasPublishedClubs}
            onStep={(step) => (hasDraft ? setWizardStep(step) : hasPublishedClubs && step === 1 && setRebuildOpen(false))}
          />
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</div>
      )}

      {hasPublishedClubs && !hasDraft && !rebuildOpen && (
        <ClubsTimelineReviewStep
          mode="published"
          clubs={clubs}
          generationInputs={generationInputs}
          onEditTier={setEditingClub}
          onRebuild={() => setRebuildOpen(true)}
        />
      )}

      {showSetup && wizardStep === 1 && (
        <ClubsQuickSetupStep
          inputs={generationInputs}
          detectedGym={gymContext as { gym_name?: string; facilities?: string[] } | null}
          suggestedInputs={suggestedInputs}
          generating={generatingDraft}
          onChange={setGenerationInputs}
          onGenerate={() => {
            setRebuildOpen(false);
            void generateDraft({ skipAi: false });
          }}
        />
      )}

      {wizardStep === 2 && hasDraft && (
        <ClubsTimelineReviewStep
          clubs={clubs}
          summary={summary}
          validation={validation}
          generationInputs={generationInputs}
          onBack={() => setWizardStep(1)}
          onContinue={() => setWizardStep(3)}
          regenerating={generatingDraft}
          onRegenerate={() => void generateDraft({ skipAi: true })}
          onEditTier={setEditingClub}
        />
      )}

      {wizardStep === 3 && hasDraft && (
        <ClubsPublishStep
          clubs={clubs}
          validation={validation}
          publishing={publishing}
          onBack={() => setWizardStep(2)}
          onPublish={publishAll}
        />
      )}

      {editingClub && (
        <ClubTierEditModal
          club={editingClub}
          maxFeeDiscount={generationInputs.max_fee_discount_percent}
          maxSupplementDiscount={generationInputs.max_supplement_discount_percent}
          onClose={() => setEditingClub(null)}
          onChange={updateClubInList}
        />
      )}

      <section>
        <button
          type="button"
          onClick={() => setOperationsOpen((open) => !open)}
          className="mb-4 text-xs font-black uppercase tracking-widest text-white/45 hover:text-white"
        >
          {operationsOpen ? 'Hide' : 'Show'} club operations (claims, transfers, members)
        </button>
        {operationsOpen && (
          <ClubsOperationsPanel
            rewardClaims={rewardClaims}
            transferRequests={transferRequests}
            clubMembers={clubMembers}
            redeemingId={redeemingId}
            reviewingTransferId={reviewingTransferId}
            removingClubId={removingClubId}
            onRedeem={redeemClaim}
            onReviewTransfer={reviewTransfer}
            onRemoveMember={removeClubMember}
          />
        )}
      </section>
    </div>
  );
};

const StepIndicator = ({
  current,
  hasDraft,
  hasPublished,
  onStep,
}: {
  current: WizardStep;
  hasDraft: boolean;
  hasPublished: boolean;
  onStep: (step: WizardStep) => void;
}) => (
  <div className="flex gap-2">
    {hasPublished && !hasDraft ? (
      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-200">
        Live · 8 clubs
      </span>
    ) : (
      ([1, 2, 3] as WizardStep[]).map((step) => (
        <button
          key={step}
          type="button"
          disabled={step > 1 && !hasDraft}
          onClick={() => onStep(step)}
          className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${
            current === step ? 'bg-primary text-black' : 'border border-white/10 text-white/40'
          } ${step > 1 && !hasDraft ? 'opacity-40' : ''}`}
        >
          {step === 1 ? 'Setup' : step === 2 ? 'Review' : 'Publish'}
        </button>
      ))
    )}
  </div>
);

export default ClubsTab;
