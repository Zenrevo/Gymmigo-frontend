import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Award, Building2, Calendar, CheckCircle2, Flame, MapPin, Package, ScanLine, Trophy, User, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListGroup,
  ListItem,
  SectionHeader,
  SignatureCard,
  Skeleton,
  Text,
} from '../../components/kit';
import DailyDrop from './DailyDrop';
import BookingDetailModal from '../../components/BookingDetailModal';
import QRScannerModal from '../../components/QRScannerModal';
import MembershipDetailView from '../Dashboard/MembershipDetailView';
import api from '../../utils/api';

/* eslint-disable @typescript-eslint/no-explicit-any -- these endpoints have no typed client yet */

type MemberData = {
  memberships?: any[];
  current_check_in?: any;
  ai_tagline?: string;
  trainer_bookings: any[];
  upcoming_sessions: any[];
};

/** Fetches what the member Home needs: passes, check-in, trainer bookings and sessions (same calls as before). */
function useMemberHomeData() {
  const [data, setData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const res = await api.get('/memberships/my');
      const d: MemberData = { ...(res.data?.data ?? {}), trainer_bookings: [], upcoming_sessions: [] };
      try {
        const [bookings, sessions] = await Promise.all([
          api.get('/trainer-bookings/bookings/my?role=user'),
          api.get('/trainer-bookings/sessions/my?role=user'),
        ]);
        d.trainer_bookings = bookings.data?.data?.bookings || [];
        d.upcoming_sessions = (sessions.data?.data?.sessions || []).filter((s: any) => ['pending_confirmation', 'scheduled'].includes(s.status));
      } catch {
        // trainer data is optional on Home
      }
      setData(d);
    } catch {
      setData({ trainer_bookings: [], upcoming_sessions: [] });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { data, loading, reload: load };
}

/** Members' gym Home: today's move, check-in, Club progress, passes, trainers and sessions. */
export default function GymHome() {
  const { data, loading, reload } = useMemberHomeData();
  const [stats, setStats] = useState<any>(null);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [clubReward, setClubReward] = useState<{ pending?: any; available?: any } | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    let live = true;
    api
      .get('/memberships/dashboard-stats')
      .then(r => live && setStats(r.data?.data || null))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const groups = useMemo(() => {
    const map: Record<string, any> = {};
    (data?.memberships ?? []).forEach((m: any) => {
      const g = (map[m.gym_id] ??= { gym_id: m.gym_id, gym_name: m.gym_name, gym_logo_url: m.gym_logo_url, current_occupancy: m.current_occupancy, max_capacity: m.max_capacity, status: m.status, memberships: [] });
      g.memberships.push(m);
      if (m.status === 'active') g.status = 'active';
    });
    return Object.values(map);
  }, [data?.memberships]);
  const primaryGym = groups.find((g: any) => g.status === 'active');

  const trainers = useMemo(() => {
    const map: Record<string, any> = {};
    (data?.trainer_bookings ?? []).forEach((b: any) => {
      const g = map[b.trainer_id];
      if (!g) map[b.trainer_id] = { ...b };
      else {
        g.sessions_remaining += b.sessions_remaining;
        g.total_sessions += b.total_sessions || 0;
        if (g.sessions_remaining === 0 && b.sessions_remaining > 0) g.id = b.id;
      }
    });
    return Object.values(map).filter((b: any) => b.sessions_remaining > 0);
  }, [data?.trainer_bookings]);

  useEffect(() => {
    let live = true;
    if (!primaryGym?.gym_id) {
      setClubReward(null);
      return;
    }
    Promise.all([
      api.get(`/clubs/fitcard/me?gym_id=${primaryGym.gym_id}`),
      api.get(`/clubs/reward-claims/my?gym_id=${primaryGym.gym_id}`).catch(() => ({ data: { data: { claims: [] } } })),
    ])
      .then(([fit, claimsRes]) => {
        if (!live) return;
        const clubs = fit.data?.data?.clubs || [];
        const claims = claimsRes.data?.data?.claims || [];
        setClubReward({
          pending: claims.find((c: any) => c.status === 'claimed'),
          available: clubs.find((club: any) => !claims.some((c: any) => c.club_code === club.code && c.status !== 'cancelled')),
        });
      })
      .catch(() => live && setClubReward(null));
    return () => {
      live = false;
    };
  }, [primaryGym?.gym_id]);

  const claimReward = async () => {
    const available = clubReward?.available;
    if (!primaryGym?.gym_id || !available?.code) return;
    setClaiming(true);
    try {
      await api.post('/clubs/reward-claims', { gym_id: primaryGym.gym_id, club_code: available.code });
      setClubReward({ pending: { club_name: available.name, reward_label: available.reward_preview || 'Reward claim sent', status: 'claimed' }, available: null });
    } catch {
      // the Clubs page shows the full error state
    } finally {
      setClaiming(false);
    }
  };

  if (selectedMembership) {
    return (
      <MembershipDetailView gymGroup={selectedMembership} onBack={() => setSelectedMembership(null)} />
    );
  }

  const checkedIn = Boolean(data?.current_check_in);
  const score = stats?.daily_score?.score ?? stats?.today_score ?? 0;
  const streak = stats?.streak ?? 0;
  const points = stats?.competition?.total_points ?? 0;
  const target = stats?.weekly_target_days ?? 4;
  const activeDays = stats?.week_active_days ?? 0;
  const nudge = stats?.daily_score?.coach_nudge || data?.ai_tagline || 'Check in, train, and keep your week moving.';
  const sessions = data?.upcoming_sessions ?? [];

  return (
    <div className="flex flex-col gap-8">
      <SignatureCard className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-gm-xl border border-white/10 bg-white/5">
              <span className="t-metric text-white">{stats ? score : '–'}</span>
              <span className="t-label-sm text-white/50">Score</span>
            </div>
            <div>
              <Text variant="label" tone="accent">
                Member home
              </Text>
              <Text variant="h2" className="text-white">
                {checkedIn ? 'Move in progress' : primaryGym ? "Today's move" : 'Find your move'}
              </Text>
              <Text variant="callout" className="mt-1 max-w-xl text-white/65">
                {nudge}
              </Text>
            </div>
          </div>
          <Button
            label={checkedIn ? 'Workout active' : 'Scan check-in'}
            icon={checkedIn ? CheckCircle2 : ScanLine}
            variant={checkedIn ? 'danger' : 'primary'}
            size="md"
            onClick={() => setShowScanner(true)}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Trophy, value: activeDays, label: 'Active days' },
            { icon: Flame, value: streak, label: 'Streak' },
            { icon: Award, value: points, label: 'Points' },
          ].map(s => (
            <div key={s.label} className="rounded-gm-md border border-white/10 bg-white/5 p-3">
              <s.icon size={15} className="mb-1.5 text-[#FF8A65]" />
              <p className="t-title text-white">{s.value}</p>
              <p className="t-label-sm text-white/45">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="t-caption text-white/55">Weekly progress</span>
            <span className="t-caption text-white/55">
              {activeDays}/{target} active days
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#FF5722]" style={{ width: `${Math.min(100, (activeDays / Math.max(1, target)) * 100)}%` }} />
          </div>
        </div>
      </SignatureCard>

      {primaryGym ? (
        <ListGroup>
          <ListItem icon={Trophy} title="Club Road" subtitle={`${points} pts · ${streak} day streak`} to="/app/clubs" chevron />
          <ListItem icon={Award} title="My FitCard" subtitle="Your fitness identity card" to="?social=true&socialTab=profile" chevron />
          <ListItem icon={Users} title="Social feed" subtitle="Buddies and posts" to="?social=true&socialTab=feed" chevron />
          {clubReward?.available ? (
            <ListItem
              icon={Package}
              title="Reward ready"
              subtitle={claiming ? 'Sending claim…' : clubReward.available.reward_preview || clubReward.available.name}
              onClick={claiming ? undefined : claimReward}
              right={<Badge label="Claim" tone="success" />}
            />
          ) : (
            <ListItem
              icon={Package}
              title={clubReward?.pending ? 'Claim sent' : 'FitCard'}
              subtitle={clubReward?.pending ? clubReward.pending.reward_label || 'Show at the gym desk' : 'Share and invite'}
              to="/app/clubs"
              chevron
            />
          )}
        </ListGroup>
      ) : null}

      <DailyDrop />

      <section className="flex flex-col gap-3">
        <SectionHeader label="Active memberships" meta={groups.length ? `${groups.length}` : undefined} />
        {loading ? (
          <Skeleton className="h-24" />
        ) : groups.length ? (
          <ListGroup>
            {groups.map((g: any) => {
              const load = (g.current_occupancy ?? 0) / (g.max_capacity || 100);
              return (
                <ListItem
                  key={g.gym_id}
                  leading={
                    <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-gm-md bg-surface-sunken text-ink-muted">
                      {g.gym_logo_url ? <img src={g.gym_logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 size={20} />}
                    </span>
                  }
                  title={g.gym_name}
                  subtitle={
                    <span className="inline-flex items-center gap-1.5">
                      <Activity size={12} className={load > 0.8 ? 'text-danger' : load > 0.5 ? 'text-warning' : 'text-success'} />
                      {g.current_occupancy ?? 0}/{g.max_capacity || 100} live · {g.memberships.length} plan{g.memberships.length === 1 ? '' : 's'}
                    </span>
                  }
                  right={<Badge label={g.status} tone={g.status === 'active' ? 'success' : 'danger'} />}
                  onClick={() => setSelectedMembership(g)}
                  chevron
                />
              );
            })}
          </ListGroup>
        ) : (
          <EmptyState icon={Building2} title="No memberships yet" message="Find a gym near you and join a plan." actionLabel="Explore gyms" actionTo="/app/discovery" compact />
        )}
      </section>

      {trainers.length ? (
        <section className="flex flex-col gap-3">
          <SectionHeader label="Your trainers" />
          <ListGroup>
            {trainers.map((b: any) => (
              <ListItem
                key={b.id}
                icon={User}
                title={b.trainer_name || 'Trainer'}
                subtitle={`${b.package_name || 'Personal training'} · ${b.sessions_completed ?? 0}/${b.total_sessions} sessions`}
                right={<Badge label={b.status} tone={b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'neutral'} />}
                onClick={() => setSelectedBooking(b)}
                chevron
              />
            ))}
          </ListGroup>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <SectionHeader label={sessions.length ? 'Upcoming sessions' : 'Personal training'} />
        {sessions.length ? (
          <ListGroup>
            {sessions.slice(0, 3).map((s: any) => (
              <ListItem
                key={s.id}
                icon={Calendar}
                title={`${String(s.session_type || 'Training').replace(/^\w/, c => c.toUpperCase())} session`}
                subtitle={
                  <span className="inline-flex flex-wrap items-center gap-x-2">
                    {new Date(s.scheduled_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {s.scheduled_time}
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {s.location || 'Trainer gym'}
                    </span>
                  </span>
                }
                right={<Badge label={s.status === 'pending_confirmation' ? 'Pending' : s.status} tone="accent" />}
                to={`/app/sessions/${s.id}`}
                chevron
              />
            ))}
          </ListGroup>
        ) : null}
        <Card padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Text variant="callout" tone="muted">
            Book verified trainers for 1:1 sessions.
          </Text>
          <Button label="Find a trainer" size="md" variant="secondary" to="/app/discovery" />
        </Card>
      </section>

      <div data-theme="dark">
        <QRScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} onSuccess={() => reload()} />
        <BookingDetailModal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} booking={selectedBooking} role="user" />
      </div>
    </div>
  );
}

