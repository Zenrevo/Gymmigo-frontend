import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Sheet, Text, TextField, Toggle, useToast } from '../components/kit';
import { adminError, adminGet, adminPost, type Paged } from './api';
import { useAdmin } from './useAdmin';

/** Create a member, gym owner and/or trainer account. They sign in with this phone + OTP as usual. */
export function CreatePersonSheet({ onClose, defaultRole }: { onClose: () => void; defaultRole?: 'trainer' | 'gym_owner' }) {
  const { can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState({ phone: '', full_name: '', email: '', city: '', business_name: '', gstin: '', experience_years: '', bio: '', reason: '' });
  const [roles, setRoles] = useState<string[]>(defaultRole ? ['user', defaultRole] : ['user']);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(p => ({ ...p, [k]: e.target.value }));
  const has = (r: string) => roles.includes(r);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await adminPost<{ id: string }>('/actions/people', {
        phone: f.phone, full_name: f.full_name, email: f.email || undefined, city: f.city || undefined, roles, verified,
        business_name: has('gym_owner') ? f.business_name : undefined, gstin: f.gstin || undefined,
        experience_years: has('trainer') && f.experience_years ? Number(f.experience_years) : undefined, bio: f.bio || undefined,
        reason: f.reason || undefined,
      });
      toast({ tone: 'success', title: 'Account created' });
      await qc.invalidateQueries({ queryKey: ['admin'] });
      onClose();
      if (can('data.explore')) navigate(`/admin/users/${res.id}`);
    } catch (e) {
      setError(adminError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} eyebrow="New account" title="Add a person" size="lg"
      footer={<Button fullWidth label="Create account" loading={busy} disabled={f.phone.replace(/\D/g, '').length < 10 || f.full_name.trim().length < 2} onClick={submit} />}>
      <div className="flex flex-col gap-4">
        <TextField label="Mobile number" inputMode="numeric" value={f.phone} onChange={set('phone')} helper="They sign in with this number and an OTP." />
        <TextField label="Full name" value={f.full_name} onChange={set('full_name')} />
        <TextField label="Email" optional value={f.email} onChange={set('email')} />
        <TextField label="City" optional value={f.city} onChange={set('city')} />
        <div className="flex flex-col gap-2">
          <Text variant="label" tone="subtle">Roles</Text>
          <Checkbox label="Member (always)" checked disabled onChange={() => undefined} />
          <Checkbox label="Trainer" checked={has('trainer')} disabled={!can('trainers.edit')} onChange={on => setRoles(on ? [...roles, 'trainer'] : roles.filter(r => r !== 'trainer'))} />
          <Checkbox label="Gym owner" checked={has('gym_owner')} disabled={!can('gyms.edit')} onChange={on => setRoles(on ? [...roles, 'gym_owner'] : roles.filter(r => r !== 'gym_owner'))} />
        </div>
        {has('gym_owner') ? (
          <>
            <TextField label="Business name" value={f.business_name} onChange={set('business_name')} />
            <TextField label="GSTIN" optional value={f.gstin} onChange={set('gstin')} />
          </>
        ) : null}
        {has('trainer') ? (
          <>
            <TextField label="Years of experience" optional type="number" value={f.experience_years} onChange={set('experience_years')} />
            <TextField label="Short bio" optional value={f.bio} onChange={set('bio')} />
          </>
        ) : null}
        {(has('trainer') || has('gym_owner')) && can('verification.manage') ? <Toggle label="Mark as verified now" checked={verified} onChange={setVerified} /> : null}
        <TextField label="Reason" optional value={f.reason} onChange={set('reason')} helper="Saved in the audit log." />
        {error ? <p role="alert" className="t-footnote rounded-gm-md bg-danger-soft px-3 py-2 text-danger">{error}</p> : null}
      </div>
    </Sheet>
  );
}

type UserHit = { id: string; phone: string; full_name: string | null; roles: string[] };

/** Create a gym: pick its owner by phone, then the gym's basics. Runs as that owner (same rules as the app). */
export function CreateGymSheet({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [owner, setOwner] = useState<UserHit | null>(null);
  const [g, setG] = useState({ name: '', city: '', state: '', contact_phone: '', contact_email: '', max_capacity: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const find = async () => {
    setError('');
    setOwner(null);
    try {
      const res = await adminGet<Paged<UserHit>>('/users', { q: phone.replace(/\D/g, '').slice(-10), page_size: 5 });
      const hit = res.items[0];
      if (!hit) setError('No account with that number. Create the owner first (Users → Add person).');
      else if (!hit.roles.includes('gym_owner')) setError(`${hit.full_name ?? hit.phone} isn't a gym owner yet. Add the role on their page first.`);
      else setOwner(hit);
    } catch (e) {
      setError(adminError(e).message);
    }
  };
  const create = async () => {
    if (!owner) return;
    setBusy(true);
    setError('');
    try {
      const data: Record<string, unknown> = { name: g.name, city: g.city || undefined, state: g.state || undefined,
        contact_phone: g.contact_phone || undefined, contact_email: g.contact_email || undefined, max_capacity: g.max_capacity ? Number(g.max_capacity) : undefined };
      const res = await adminPost<{ result?: { id?: string; gym?: { id?: string } } }>(`/actions/member/${owner.id}/gym.create`, { data });
      toast({ tone: 'success', title: 'Gym created' });
      await qc.invalidateQueries({ queryKey: ['admin'] });
      onClose();
      const gid = res.result?.gym?.id ?? res.result?.id;
      if (gid) navigate(`/admin/gyms/${gid}`);
    } catch (e) {
      setError(adminError(e).message);
    } finally {
      setBusy(false);
    }
  };
  const set = (k: keyof typeof g) => (e: { target: { value: string } }) => setG(p => ({ ...p, [k]: e.target.value }));
  return (
    <Sheet open onClose={onClose} eyebrow="New gym" title="Add a gym" size="lg"
      footer={owner ? <Button fullWidth label="Create gym" loading={busy} disabled={g.name.trim().length < 2} onClick={create} /> : undefined}>
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-2">
          <div className="flex-1"><TextField label="Owner's mobile number" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <Button size="md" variant="secondary" label="Find" onClick={find} disabled={phone.replace(/\D/g, '').length < 10} />
        </div>
        {owner ? <Text>Owner: <strong>{owner.full_name ?? owner.phone}</strong> ({owner.phone})</Text> : null}
        {owner ? (
          <>
            <TextField label="Gym name" value={g.name} onChange={set('name')} />
            <TextField label="City" optional value={g.city} onChange={set('city')} />
            <TextField label="State" optional value={g.state} onChange={set('state')} />
            <TextField label="Contact phone" optional value={g.contact_phone} onChange={set('contact_phone')} />
            <TextField label="Contact email" optional value={g.contact_email} onChange={set('contact_email')} />
            <TextField label="Max capacity" optional type="number" value={g.max_capacity} onChange={set('max_capacity')} />
            <Text variant="caption" tone="subtle">Add address, hours, plans and equipment on the gym's page after creating it.</Text>
          </>
        ) : null}
        {error ? <p role="alert" className="t-footnote rounded-gm-md bg-danger-soft px-3 py-2 text-danger">{error}</p> : null}
      </div>
    </Sheet>
  );
}
