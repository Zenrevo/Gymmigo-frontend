import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, MessageCircle, Phone, UserPlus, Users } from 'lucide-react';
import clsx from 'clsx';
import api, { getApiErrorMessage } from '../../../utils/api';
import PageLoader from '../../../components/PageLoader';
import EmptyState from '../../../components/EmptyState';
import { useGym } from '../../../context/GymContext';
import { useNotification } from '../../../context/NotificationContext';

type ReferralLead = {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  status: string;
  note?: string | null;
  trial_at?: string | null;
  lost_reason?: string | null;
  converted_at?: string | null;
  created_at?: string | null;
  referrer?: {
    user_id: string;
    name: string;
    invite_code?: string | null;
  };
};

const statusOptions = ['all', 'new', 'contacted', 'trial_booked', 'converted', 'lost'];

const statusClasses: Record<string, string> = {
  new: 'border-accent-border bg-accent-soft text-accent-text',
  contacted: 'border-info/30 bg-info-soft text-info',
  trial_booked: 'border-warning/30 bg-warning-soft text-warning',
  converted: 'border-success/30 bg-success-soft text-success',
  lost: 'border-danger/30 bg-danger-soft text-danger',
};

const formatStatus = (status: string) => status.replaceAll('_', ' ');

const formatDate = (value?: string | null) => {
  if (!value) return 'Just now';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const ReferralLeadsTab = () => {
  const { gymId } = useGym();
  const { showNotification } = useNotification();
  const [leads, setLeads] = useState<ReferralLead[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState('');

  const fetchLeads = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError('');
    try {
      const query = status === 'all' ? '' : `?status=${status}`;
      const res = await api.get(`/clubs/gyms/${gymId}/referral-leads${query}`);
      const items = res.data?.data?.leads || [];
      setLeads(items);
      setNoteDrafts((current) => {
        const next = { ...current };
        items.forEach((lead: ReferralLead) => {
          if (next[lead.id] === undefined) next[lead.id] = lead.note || '';
        });
        return next;
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [gymId, status]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const stats = useMemo(() => {
    return leads.reduce(
      (acc, lead) => {
        acc.total += 1;
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );
  }, [leads]);

  const nextLead = useMemo(
    () => leads.find((lead) => ['new', 'trial_booked', 'contacted'].includes(lead.status)) || leads[0],
    [leads]
  );

  const updateLead = async (lead: ReferralLead, payload: Partial<ReferralLead> & { status?: string }) => {
    if (!gymId) return;
    setUpdatingId(lead.id);
    setError('');
    try {
      const res = await api.patch(`/clubs/gyms/${gymId}/referral-leads/${lead.id}`, payload);
      const updated = res.data?.data?.lead;
      if (updated) {
        setLeads((items) => items.map((item) => (item.id === lead.id ? updated : item)));
        setNoteDrafts((current) => ({ ...current, [lead.id]: updated.note || '' }));
      }
      showNotification('Lead updated', 'success');
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      showNotification(message, 'error');
    } finally {
      setUpdatingId('');
    }
  };

  const messageLead = async (lead: ReferralLead) => {
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer');
    if (lead.status === 'new') {
      await updateLead(lead, { status: 'contacted', note: noteDrafts[lead.id] || 'WhatsApp follow-up opened.' });
    }
  };

  const setTrialTomorrow = (lead: ReferralLead) => {
    const value = new Date();
    value.setDate(value.getDate() + 1);
    value.setHours(18, 0, 0, 0);
    updateLead(lead, {
      status: 'trial_booked',
      trial_at: value.toISOString(),
      note: noteDrafts[lead.id] || 'Trial booked for tomorrow evening.',
    });
  };

  if (loading) return <PageLoader message="Loading referral leads..." />;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-[linear-gradient(135deg,rgba(241,130,44,0.14),rgba(255,255,255,0.035)_45%,rgba(59,130,246,0.10))] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-border bg-accent-soft text-accent-text">
                <UserPlus size={20} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-accent-text">Growth Loop</p>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-ink sm:text-5xl">FitCard Referral Leads</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-ink-muted">
                Members share badges, friends claim trials, and your team gets the lead here.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Total" value={stats.total || 0} />
            <Stat label="New" value={stats.new || 0} />
            <Stat label="Converted" value={stats.converted || 0} />
          </div>
        </div>
      </section>

      {nextLead && (
        <section className="rounded-[1.5rem] border border-success/30 bg-success-soft p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-success">Next follow-up</p>
              <h2 className="mt-2 truncate text-2xl font-black text-ink">{nextLead.full_name}</h2>
              <p className="mt-1 text-sm font-semibold text-ink-muted">
                {nextLead.status === 'trial_booked' && nextLead.trial_at
                  ? `Trial ${formatDate(nextLead.trial_at)}`
                  : nextLead.status === 'new'
                  ? 'New FitCard lead'
                  : `Status: ${formatStatus(nextLead.status)}`}
              </p>
            </div>
            <button
              onClick={() => messageLead(nextLead)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-success px-5 py-3 text-xs font-black uppercase tracking-widest text-on-accent transition hover:brightness-110"
            >
              <MessageCircle size={15} /> WhatsApp
            </button>
          </div>
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusOptions.map((option) => (
          <button
            key={option}
            onClick={() => setStatus(option)}
            className={clsx(
              'shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
              status === option
                ? 'border-accent-border bg-accent-soft text-accent-text'
                : 'border-border bg-surface-raised text-ink-muted hover:text-ink'
            )}
          >
            {formatStatus(option)}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      {leads.length ? (
        <div className="grid gap-4">
          {leads.map((lead, index) => (
            <motion.article
              key={lead.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035 }}
              className="rounded-[1.5rem] border border-border bg-surface-raised p-5 transition hover:border-accent-border"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-accent-soft text-accent-text">
                    <Users size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-black text-ink">{lead.full_name}</h3>
                      <span className={clsx('rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest', statusClasses[lead.status] || 'border-border bg-surface-raised text-ink-muted')}>
                        {formatStatus(lead.status)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs font-bold text-ink-muted">
                      <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-accent-text" /> {lead.phone}</span>
                      <span className="inline-flex items-center gap-1.5"><CalendarClock size={13} className="text-accent-text" /> {formatDate(lead.created_at)}</span>
                      {lead.referrer?.name && <span className="inline-flex items-center gap-1.5"><MessageCircle size={13} className="text-accent-text" /> {lead.referrer.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <a href={`tel:${lead.phone}`} className="rounded-xl border border-border bg-surface-raised px-4 py-3 text-xs font-black uppercase tracking-widest text-ink transition hover:border-accent-border">
                    Call
                  </a>
                  <button onClick={() => messageLead(lead)} className="rounded-xl bg-success px-4 py-3 text-xs font-black uppercase tracking-widest text-on-accent transition hover:brightness-110">
                    WhatsApp
                  </button>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-border bg-surface-sunken p-4">
                <textarea
                  value={noteDrafts[lead.id] || ''}
                  onChange={(event) => setNoteDrafts((current) => ({ ...current, [lead.id]: event.target.value }))}
                  placeholder="Add follow-up note"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm font-semibold leading-5 text-ink outline-none transition placeholder:text-ink-subtle focus:border-accent-border"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <PipelineButton label="Contacted" active={lead.status === 'contacted'} loading={updatingId === lead.id} onClick={() => updateLead(lead, { status: 'contacted', note: noteDrafts[lead.id] || '' })} />
                  <PipelineButton label="Trial" active={lead.status === 'trial_booked'} loading={updatingId === lead.id} onClick={() => setTrialTomorrow(lead)} />
                  <PipelineButton label="Won" active={lead.status === 'converted'} loading={updatingId === lead.id} onClick={() => updateLead(lead, { status: 'converted', note: noteDrafts[lead.id] || '' })} />
                  <PipelineButton label="Lost" danger active={lead.status === 'lost'} loading={updatingId === lead.id} onClick={() => updateLead(lead, { status: 'lost', lost_reason: noteDrafts[lead.id] || 'Not interested right now.' })} />
                </div>
                {lead.trial_at && (
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-warning">Trial: {formatDate(lead.trial_at)}</p>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UserPlus}
          title="No referral leads yet"
          description="When members share FitCards and friends claim trials, those leads will appear here."
        />
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="min-w-[92px] rounded-2xl border border-border bg-surface-sunken p-4">
    <p className="text-[9px] font-black uppercase tracking-widest text-ink-subtle">{label}</p>
    <p className="mt-1 text-3xl font-black text-ink">{value}</p>
  </div>
);

const PipelineButton = ({
  label,
  active,
  danger,
  loading,
  onClick,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  loading?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={clsx(
      'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-[10px] font-black uppercase tracking-widest transition disabled:opacity-60',
      active
        ? 'border-accent bg-accent text-on-accent'
        : danger
        ? 'border-danger/30 bg-danger-soft text-danger hover:border-danger/30'
        : 'border-border bg-surface-raised text-ink-muted hover:border-accent-border hover:text-ink'
    )}
  >
    {loading ? <CheckCircle2 size={13} /> : null}
    {loading ? 'Saving' : label}
  </button>
);

export default ReferralLeadsTab;
