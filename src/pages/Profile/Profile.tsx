import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  Activity,
  Building2,
  Camera,
  CreditCard,
  FileText,
  Flame,
  HelpCircle,
  LogOut,
  MapPin,
  Pencil,
  QrCode,
  Repeat,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  Watch,
  type LucideIcon,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  ListGroup,
  ListItem,
  SegmentedControl,
  Sheet,
  Skeleton,
  Text,
  cn,
  confirmDialog,
  useToast,
} from '../../components/kit';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/themeContext';
import type { ThemePreference } from '../../theme/theme';
import { profileApi } from '../../api/profile';
import { getApiErrorMessage } from '../../utils/api';
import {
  profileKeys,
  useAddresses,
  useFitnessCard,
  useFitnessProfile,
  useMyMemberships,
  useProfileMe,
  useSocialCounts,
  useWallet,
} from '../../hooks/useProfileQueries';
import { FitCardPass } from '../../components/profile/FitCardPass';
import { fitnessQrPayload, pickFitnessCardCode } from '../../components/profile/fitcard';
import { AddressesSheet, EditProfileSheet, MigoSetupSheet } from './ProfileSheets';
import { EMPTY_FITNESS, humanize, type FitnessProfile } from './fitness';

/* eslint-disable @typescript-eslint/no-explicit-any -- profile/membership payloads are untyped */

const ROLE_LABEL: Record<string, string> = { user: 'Member', trainer: 'Trainer', gym_owner: 'Gym owner', gym_manager: 'Gym manager' };
const ADDABLE_ROLES = [
  { role: 'user', label: 'Member' },
  { role: 'gym_owner', label: 'Gym owner' },
  { role: 'trainer', label: 'Trainer', soon: true },
];

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
const inr = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const daysUntil = (iso: string | null | undefined, now: number) => (iso ? Math.ceil((new Date(iso).getTime() - now) / 86_400_000) : null);

function GroupLabel({ label, meta, metaTo }: { label: string; meta?: string; metaTo?: string }) {
  return (
    <div className="mb-2 flex items-center px-0.5">
      <Text variant="label" tone="subtle" className="flex-1">
        {label}
      </Text>
      {meta && metaTo ? (
        <Link to={metaTo} className="t-label text-accent-text hover:underline">
          {meta}
        </Link>
      ) : null}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <GroupLabel label={label} />
      <ListGroup>{children}</ListGroup>
    </section>
  );
}

function ProfileStat({ icon: Icon, value, label, success, to }: { icon: LucideIcon; value: string; label: string; success?: boolean; to?: string }) {
  const body = (
    <>
      <span className="flex items-center gap-1">
        <Icon size={14} strokeWidth={2.2} className={success ? 'text-success' : 'text-accent'} aria-hidden />
        <span className={cn('t-subtitle truncate', success ? 'text-success' : 'text-ink')}>{value}</span>
      </span>
      <span className="t-label-sm mt-0.5 text-ink-subtle">{label}</span>
    </>
  );
  const cls = 'flex flex-1 flex-col items-center py-3';
  return to ? (
    <Link to={to} aria-label={`${label} ${value}`} className={cn(cls, 'rounded-gm-md hover:bg-surface')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function MembershipCard({ m }: { m: any }) {
  const start = m.start_date ? new Date(m.start_date).getTime() : 0;
  const end = m.end_date ? new Date(m.end_date).getTime() : 0;
  const [now] = useState(() => Date.now());
  const left = daysUntil(m.end_date, now);
  const pct = start && end > start ? Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100))) : 0;
  return (
    <Card padding="lg">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-gm-md bg-surface-sunken text-ink">
          <Building2 size={20} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <Text variant="title" className="truncate">
            {m.gym_name ?? 'Gym'}
          </Text>
          <Text variant="caption" tone="subtle" className="truncate">
            {m.plan_name ?? 'Membership'}
          </Text>
        </div>
        {left != null ? <Badge label={left > 0 ? `${left}d left` : 'Ends today'} tone={left <= 7 ? 'warning' : 'accent'} /> : null}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Text variant="caption" tone="muted" className="flex-1">
          {m.end_date ? `Renews on ${new Date(m.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Active pass'}
        </Text>
        <Button label="Renew Pass" size="sm" to={`/app/gyms/${m.gym_id}`} />
      </div>
    </Card>
  );
}

/** Profile & Settings — same sections and order as the app's ProfileScreen. */
export default function Profile() {
  const { user, logout, switchRole, refreshUser } = useAuth();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const isMember = user?.active_role === 'user';

  const profile = useProfileMe();
  const addresses = useAddresses();
  const card = useFitnessCard();
  const memberships = useMyMemberships();
  const wallet = useWallet();
  const social = useSocialCounts(user?.id);
  const fitness = useFitnessProfile();

  const [qrOpen, setQrOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [migoOpen, setMigoOpen] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const p = profile.data as any;
  const name = p?.full_name ?? user?.full_name ?? 'Gymmigo user';
  const avatar = p?.avatar_url ?? user?.avatar_url;
  const code = pickFitnessCardCode(card.data)?.toUpperCase() ?? null;
  const fit = (card.data as any)?.fitcard ?? (card.data as any)?.fitness_card ?? null;
  const tierLabel = (fit?.tier_label ?? (card.data as any)?.tier_card?.tier_label ?? null) as string | null;
  const addrList = (addresses.data ?? []) as any[];
  const home = addrList.find(a => a.is_primary) ?? addrList[0];
  const activeMemberships = ((memberships.data ?? []) as any[]).filter(m => m.status === 'active');
  const homeGym = activeMemberships[0]?.gym_name ?? null;
  const fitnessInitial = useMemo<FitnessProfile>(() => ({ ...EMPTY_FITNESS, ...((fitness.data as any) || {}) }), [fitness.data]);
  const goal = humanize(fitnessInitial.primary_goal);
  const goalSummary = [
    fitnessInitial.workout_days_per_week ? `Target: ${fitnessInitial.workout_days_per_week} sessions/wk` : null,
    fitnessInitial.preferred_workout_duration ? `${fitnessInitial.preferred_workout_duration} min sessions` : null,
    humanize(fitnessInitial.dietary_preference),
  ]
    .filter(Boolean)
    .join(' · ');
  const roles = (user?.roles ?? []) as { role: string; is_completed?: boolean }[];
  const otherRoles = roles.filter(r => r.role !== user?.active_role && r.is_completed);
  const addable = ADDABLE_ROLES.filter(r => !roles.some(o => o.role === r.role));

  const openCard = () => (code ? navigate(`/fitness-card/${code}`) : toast({ title: 'Your Fitness Card is getting ready.' }));
  const copyLink = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/fitness-card/${code}`);
      toast({ tone: 'success', title: 'FitCard link copied' });
    } catch {
      toast({ tone: 'error', title: 'Could not copy the link' });
    }
  };

  const signOut = async () => {
    if (await confirmDialog({ title: 'Sign out?', message: 'You can sign back in anytime with your phone number.', confirmLabel: 'Sign out', tone: 'danger' })) logout();
  };

  const deleteAccount = async () => {
    const ok = await confirmDialog({
      tone: 'danger',
      title: 'Delete your account?',
      message: 'This permanently deletes your profile, memberships history, FitCard and rewards. This cannot be undone.',
      confirmLabel: 'Delete forever',
      cancelLabel: 'Keep my account',
    });
    if (!ok) return;
    try {
      await profileApi.deleteAccount();
      toast({ tone: 'success', title: 'Account deleted successfully' });
      logout();
    } catch (err) {
      toast({ tone: 'error', title: 'Could not delete account', message: getApiErrorMessage(err) });
    }
  };

  const doSwitch = async (role: string) => {
    if (role === 'trainer') {
      toast({ title: 'Trainer mode is coming soon on web.' });
      return;
    }
    const ok = await confirmDialog({ title: `Switch to ${ROLE_LABEL[role] ?? role}?`, message: 'Gymmigo will reload with that role’s home.', confirmLabel: 'Switch' });
    if (!ok) return;
    setSwitching(role);
    try {
      await switchRole(role);
      navigate('/app/dashboard');
    } catch (err) {
      toast({ tone: 'error', title: 'Failed to switch role', message: getApiErrorMessage(err) });
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1080px] pb-10">
      <header className="flex items-center gap-3 py-2">
        <Text variant="h1" className="flex-1 truncate">
          Profile & Settings
        </Text>
        {isMember ? <IconButton icon={QrCode} label="Show fitness QR" onClick={() => setQrOpen(true)} /> : null}
      </header>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        {/* Left column: identity, pass, co-pilot, memberships */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card padding="lg">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar name={name} src={avatar} size={72} ring="var(--gm-accent)" />
                <span className="absolute bottom-0.5 right-0 h-[18px] w-[18px] rounded-full border-[3px] border-surface bg-success" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                {profile.isLoading ? <Skeleton className="h-6 w-3/4" /> : <Text variant="h2" className="truncate">{name}</Text>}
                <Text variant="caption" tone="muted" className="mt-0.5 truncate">
                  {isMember && code ? `ID: ${code}` : `${ROLE_LABEL[user?.active_role ?? 'user'] ?? 'Member'} account`}
                  {isMember && tierLabel ? ` · ${tierLabel}` : ''}
                </Text>
                {social.data ? (
                  <Link
                    to="/app/people"
                    data-testid="follow-counts"
                    aria-label={`${social.data.followers} followers, ${social.data.following} following`}
                    className="t-caption mt-1 inline-flex gap-1 hover:underline">
                    <span className="text-ink">{compact(social.data.followers)}</span>
                    <span className="text-ink-muted">followers ·</span>
                    <span className="text-ink">{compact(social.data.following)}</span>
                    <span className="text-ink-muted">following</span>
                  </Link>
                ) : null}
                {homeGym ? (
                  <div className="mt-1 flex items-center gap-1.5">
                    <Building2 size={14} className="text-accent" aria-hidden />
                    <Text variant="caption" tone="subtle" className="truncate">
                      {homeGym}
                    </Text>
                  </div>
                ) : null}
              </div>
              <IconButton icon={Pencil} label="Edit profile" onClick={() => setEditOpen(true)} />
            </div>
            {p?.bio ? (
              <Text variant="footnote" tone="muted" className="mt-4">
                {p.bio}
              </Text>
            ) : null}
            {isMember ? (
              <div className="mt-5 flex rounded-gm-md bg-surface-sunken">
                <ProfileStat icon={Flame} value={compact(fit?.current_streak ?? 0)} label="Streak" />
                <ProfileStat icon={Star} value={compact(fit?.total_points ?? 0)} label="Points" />
                <ProfileStat icon={Activity} value={compact(fit?.total_check_ins ?? 0)} label="Sessions" />
                <ProfileStat icon={Wallet} value={inr(wallet.data?.wallet?.balance_inr ?? 0)} label="Wallet" success to="/app/wallet-transactions" />
              </div>
            ) : null}
          </Card>

          {isMember ? (
            <>
              {card.isLoading ? (
                <Skeleton className="h-[200px] rounded-gm-xxl" />
              ) : (
                <FitCardPass card={card.data} name={name} code={code} gymName={homeGym} onOpen={openCard} onShare={() => setQrOpen(true)} />
              )}

              <Card padding="lg">
                <div className="flex items-center gap-2">
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-gm-sm bg-accent text-on-accent">
                    <Sparkles size={14} aria-hidden />
                  </span>
                  <Text variant="label" tone="accent" className="flex-1">
                    Migo AI co-pilot
                  </Text>
                  <Text variant="labelSm" tone={goal ? 'success' : 'subtle'}>
                    {goal ? 'Calibrated' : 'Not set up'}
                  </Text>
                </div>
                <Text variant="title" className="mt-3">
                  {goal ? `${goal} plan` : 'Set up your AI coach'}
                </Text>
                <Text variant="footnote" tone="muted" className="mt-1">
                  {goalSummary || 'Goal, schedule, food and limits your AI coach plans around.'}
                </Text>
                <Button className="mt-4" label="Update Fitness Goals & Diet Prefs" variant="secondary" icon={SlidersHorizontal} fullWidth onClick={() => setMigoOpen(true)} />
              </Card>

              <section>
                <GroupLabel label="Active memberships & access" meta="View all" metaTo="/app/memberships" />
                {memberships.isLoading ? (
                  <Skeleton className="h-[130px] rounded-gm-xl" />
                ) : activeMemberships.length ? (
                  <div className="flex flex-col gap-2">
                    {activeMemberships.slice(0, 2).map(m => (
                      <MembershipCard key={m.id} m={m} />
                    ))}
                  </div>
                ) : (
                  <ListGroup>
                    <ListItem icon={CreditCard} title="No active pass" subtitle="Find a gym near you and join" to="/app/discovery" />
                  </ListGroup>
                )}
              </section>
            </>
          ) : null}
        </div>

        {/* Right column: settings groups */}
        <div className="flex min-w-0 flex-col gap-6">
          <section>
            <GroupLabel label="App appearance" />
            <SegmentedControl<ThemePreference>
              aria-label="App appearance"
              value={preference}
              onChange={setPreference}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </section>

          <Group label="Community">
            <ListItem icon={Search} title="Find people" subtitle="Search members and follow them" to="/app/people" />
            <ListItem icon={Users} title="Run together" subtitle="Live group runs with friends" to="/app/run-together" />
          </Group>

          <Group label="Devices">
            <ListItem icon={Watch} title="Connect your watch" subtitle="Optional · steps and heart rate from your watch app" to="/app/devices" />
          </Group>

          {isMember ? (
            <>
              <Group label="Fitness tools">
                <ListItem icon={QrCode} title="Fitness QR & share" subtitle="Show your FitCard QR" onClick={() => setQrOpen(true)} />
                <ListItem icon={Camera} title="Social card" subtitle="Your public FitCard and posts" to="?social=true&socialTab=profile" />
                <ListItem icon={Trophy} title="Clubs & badges" to="/app/clubs" />
              </Group>
              <Group label="Membership & wallet">
                <ListItem icon={CreditCard} title="My memberships" to="/app/memberships" />
                <ListItem icon={Wallet} title="Wallet transactions" to="/app/wallet-transactions" />
                <ListItem
                  icon={MapPin}
                  title="Home location"
                  subtitle={home ? [home.address_line1, home.city].filter(Boolean).join(', ') : 'Not set'}
                  onClick={() => setAddrOpen(true)}
                />
              </Group>
            </>
          ) : (
            <Group label="Locations">
              <ListItem icon={MapPin} title="Saved addresses" subtitle={home ? [home.address_line1, home.city].filter(Boolean).join(', ') : 'Not set'} onClick={() => setAddrOpen(true)} />
            </Group>
          )}

          <section>
            <GroupLabel label="Gym ecosystem role" />
            <Card padding="lg">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-gm-md bg-surface-sunken text-ink">
                  <UserCog size={20} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <Text variant="subtitle">Current Role: {ROLE_LABEL[user?.active_role ?? 'user'] ?? 'Member'}</Text>
                  <Text variant="caption" tone="subtle">
                    Switch accounts to manage trainees or facilities
                  </Text>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2" data-testid="role-switch">
                {otherRoles.map(r => (
                  <Button
                    key={r.role}
                    label={`${ROLE_LABEL[r.role] ?? r.role} mode${r.role === 'trainer' ? ' · Soon' : ''}`}
                    icon={Repeat}
                    variant="secondary"
                    loading={switching === r.role}
                    disabled={!!switching}
                    onClick={() => doSwitch(r.role)}
                  />
                ))}
                {addable.map(r => (
                  <Button
                    key={r.role}
                    label={r.soon ? `${r.label} · Soon` : `Add ${r.label}`}
                    icon={UserPlus}
                    variant="secondary"
                    disabled={r.soon}
                    to={r.soon ? undefined : `/onboarding/role?add=1&role=${r.role}`}
                  />
                ))}
              </div>
            </Card>
          </section>

          <Group label="Account & security">
            <ListItem icon={Pencil} title="Edit profile" subtitle="Name, email, birthday, city and bio" onClick={() => setEditOpen(true)} />
            <ListItem icon={Shield} title="Privacy & security" to="/privacy" />
          </Group>

          <Group label="Help & legal">
            <ListItem icon={HelpCircle} title="Help & contact" to="/contact" />
            <ListItem icon={FileText} title="Terms of service" to="/terms" />
          </Group>

          <div className="flex flex-col items-center gap-3">
            <Button label="Log Out" icon={LogOut} variant="outline" fullWidth onClick={signOut} />
            <button type="button" onClick={deleteAccount} className="t-button-sm inline-flex items-center gap-1.5 py-2 text-danger hover:underline">
              <Trash2 size={14} aria-hidden /> Delete Account
            </button>
            <Text variant="caption" tone="subtle">
              Gymmigo web
            </Text>
          </div>
        </div>
      </div>

      <Sheet
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        eyebrow="Unique fitness ID"
        title={code ?? 'Card pending'}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button label="Copy link" variant="secondary" fullWidth disabled={!code} onClick={copyLink} />
            <Button label="Open FitCard" fullWidth onClick={openCard} />
          </div>
        }>
        <div className="mx-auto w-fit rounded-gm-xl bg-white p-4">
          <QRCodeSVG value={fitnessQrPayload(card.data, code)} size={214} bgColor="#FFFFFF" fgColor="#131315" />
        </div>
        <Text variant="footnote" tone="muted" className="mt-3 text-center">
          Let a gym or friend scan this to open your FitCard.
        </Text>
      </Sheet>

      <EditProfileSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={p}
        onSaved={async () => {
          await qc.invalidateQueries({ queryKey: profileKeys.me });
          await refreshUser();
        }}
      />
      <MigoSetupSheet open={migoOpen} onClose={() => setMigoOpen(false)} initial={fitnessInitial} onSaved={() => qc.invalidateQueries({ queryKey: profileKeys.fitness })} />
      <AddressesSheet open={addrOpen} onClose={() => setAddrOpen(false)} addresses={addrList} onChanged={() => qc.invalidateQueries({ queryKey: profileKeys.addresses })} />
    </div>
  );
}
