import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Dumbbell, User as UserIcon, type LucideIcon } from 'lucide-react';
import { Button, SelectableCard, useToast } from '../../components/kit';
import { useAuth } from '../../context/AuthContext';
import api, { getApiErrorMessage } from '../../utils/api';
import { OnboardingFrame } from './OnboardingFrame';

type RoleId = 'user' | 'trainer' | 'gym_owner';
type RoleOption = { id: RoleId; name: string; description: string; icon: LucideIcon; comingSoon?: boolean };

/** Same roles and copy as the app. Trainer sign-up is still "Coming soon". */
const ROLES: RoleOption[] = [
  { id: 'user', name: 'Member', description: 'Find gyms, book trainers, and track your fitness journey.', icon: UserIcon },
  { id: 'trainer', name: 'Trainer', description: 'Manage clients, schedules, and build your professional brand.', icon: Dumbbell, comingSoon: true },
  { id: 'gym_owner', name: 'Gym Owner', description: 'List your gym, manage memberships, and grow your business.', icon: Building2 },
];

const ROLE_LABEL: Record<string, string> = { user: 'Member', trainer: 'Trainer', gym_owner: 'Gym Owner' };

/** Step 1: choose a role. Existing complete role → switch; existing incomplete role → switch, then finish its profile. */
export default function RoleSelectPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, login, switchRole } = useAuth();
  const initialRole = ROLES.find(r => r.id === params.get('role') && !r.comingSoon)?.id ?? null;
  const [selected, setSelected] = useState<RoleId | null>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const autoStarted = useRef(false);
  const adding = params.get('add') === '1' || (user?.roles?.some((r: { is_completed?: boolean }) => r.is_completed) ?? false);

  const proceed = useCallback(async () => {
    if (!selected) return;
    setError('');
    const existing = user?.roles?.find((r: { role: string }) => r.role === selected) as { role: string; is_completed?: boolean } | undefined;
    setLoading(true);
    try {
      if (existing) {
        // Make it the active role first, so once the profile is saved /auth/me reports this role as active and complete.
        if (user?.active_role !== selected) await switchRole(selected);
        if (existing.is_completed) {
          toast({ tone: 'success', title: `Switched to ${ROLE_LABEL[selected]} mode` });
          navigate('/app/dashboard', { replace: true });
        } else {
          navigate(`/onboarding/profile?role=${selected}`);
        }
        return;
      }
      const endpoint = user?.roles?.length ? '/auth/add-role' : '/auth/register-role';
      const res = await api.post(endpoint, { role: selected });
      if (!res.data?.success) {
        setError('Could not set up this role. Please try again.');
        return;
      }
      const { user: next, tokens } = res.data.data;
      login(tokens.access_token, tokens.refresh_token, next);
      navigate(`/onboarding/profile?role=${selected}`);
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to set role.');
    } finally {
      setLoading(false);
    }
  }, [login, navigate, selected, switchRole, toast, user?.active_role, user?.roles]);

  // ?role=… starts immediately (deep links from the marketing pages).
  useEffect(() => {
    if (!initialRole || autoStarted.current || !user) return;
    autoStarted.current = true;
    proceed();
  }, [initialRole, proceed, user]);

  return (
    <OnboardingFrame
      step={1}
      total={3}
      canGoBack={adding}
      onBack={() => navigate('/app/profile')}
      footer={
        <div className="flex flex-col gap-3">
          {error ? (
            <p className="t-footnote text-center text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button label="Continue" fullWidth loading={loading} disabled={!selected} onClick={proceed} />
        </div>
      }>
      <p className="t-label text-accent-text">Set up your account</p>
      <h1 className="t-display mt-2 text-ink">Choose your path</h1>
      <p className="t-body mt-2 text-ink-muted">Select the role that best fits your needs on Gymmigo.</p>
      <div role="radiogroup" aria-label="Role" className="mt-8 flex flex-col gap-3">
        {ROLES.map(r => (
          <SelectableCard
            key={r.id}
            icon={r.icon}
            title={r.name}
            description={r.description}
            badge={r.comingSoon ? 'Coming soon' : undefined}
            disabled={r.comingSoon}
            selected={selected === r.id}
            onSelect={() => setSelected(r.id)}
          />
        ))}
      </div>
    </OnboardingFrame>
  );
}
