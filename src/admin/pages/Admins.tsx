import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, UserPlus } from 'lucide-react';
import { Badge, Button, Dialog, ErrorState, Sheet, Skeleton, Text, TextField, Toggle } from '../../components/kit';
import { adminGet, adminPatch, adminPost } from '../api';
import { useAdmin } from '../useAdmin';
import { when } from '../format';
import { DataTable, Field, PageTitle, Select, StatusPill } from '../ui';
import { ActivityList } from './ApiActivity';
import { useAdminAction } from '../useAdminAction';

type AdminRow = {
  id: string; username: string; full_name: string | null; role: string; role_label: string; extra_permissions: string[]; denied_permissions: string[];
  permissions: string[]; phone_masked: string | null; phone_verified: boolean; must_change_password: boolean; is_active: boolean;
  locked_until: string | null; last_login_at: string | null; created_at: string; parent_id?: string | null; can_manage?: boolean;
};
type TreeRow = AdminRow & { depth: number };

/** Order admins as a reporting tree (manager first, then their team, indented). */
function asTree(rows: AdminRow[]): TreeRow[] {
  const ids = new Set(rows.map(r => r.id));
  const kids = new Map<string, AdminRow[]>();
  rows.forEach(r => { const p = r.parent_id && ids.has(r.parent_id) ? r.parent_id : ''; kids.set(p, [...(kids.get(p) ?? []), r]); });
  const out: TreeRow[] = [];
  const walk = (p: string, depth: number) => (kids.get(p) ?? []).forEach(r => { if (!out.some(o => o.id === r.id)) { out.push({ ...r, depth }); walk(r.id, depth + 1); } });
  walk('', 0);
  rows.forEach(r => { if (!out.some(o => o.id === r.id)) out.push({ ...r, depth: 0 }); });
  return out;
}
type Meta = { permissions: { key: string; label: string }[]; roles: { key: string; label: string; permissions: string[] }[] };
type Override = 'role' | 'grant' | 'deny';

export default function Admins() {
  const { admin: me, can } = useAdmin();
  const list = useQuery({ queryKey: ['admin', 'admins'], queryFn: () => adminGet<AdminRow[]>('/admins') });
  const meta = useQuery({ queryKey: ['admin', 'meta'], queryFn: () => adminGet<Meta>('/auth/meta'), staleTime: Infinity });
  const [editing, setEditing] = useState<AdminRow | 'new' | null>(null);
  const [secret, setSecret] = useState<{ username: string; temp_password: string } | null>(null);

  return (
    <>
      <PageTitle title="Admins & access" subtitle={can('admins.manage') ? 'Who can sign in to this console, who they report to, and what each person may do.' : 'You and your team. You can add sub-admins with up to the access you have.'} actions={<Button size="sm" icon={UserPlus} label={can('admins.manage') ? 'Add admin' : 'Add team member'} onClick={() => setEditing('new')} />} />
      {list.isLoading ? <Skeleton className="h-64" rounded="xl" /> : list.isError || !list.data ? <ErrorState onRetry={() => list.refetch()} /> : (
        <DataTable rows={asTree(list.data)} rowKey={a => a.id} onRowClick={setEditing} columns={[
          { key: 'u', label: 'Admin', render: a => <div style={{ paddingLeft: Math.min(a.depth, 4) * 16 }}><div className="font-semibold">{a.depth ? '↳ ' : ''}{a.full_name || a.username}{a.id === me?.id ? ' (you)' : ''}</div><div className="text-xs text-ink-subtle">@{a.username}</div></div> },
          { key: 'm', label: 'Reports to', render: a => { const p = list.data!.find(x => x.id === a.parent_id); return p ? p.full_name || `@${p.username}` : '—'; } },
          { key: 'r', label: 'Role', render: a => <Badge label={a.role_label} tone={a.role === 'super_admin' ? 'accent' : 'neutral'} /> },
          { key: 'p', label: 'Custom access', render: a => (a.extra_permissions.length || a.denied_permissions.length ? `+${a.extra_permissions.length} / −${a.denied_permissions.length}` : '—') },
          { key: 's', label: 'Status', render: a => <StatusPill status={!a.is_active ? 'deactivated' : a.must_change_password || !a.phone_verified ? 'pending' : 'active'} label={!a.is_active ? 'disabled' : a.must_change_password || !a.phone_verified ? 'setup pending' : 'active'} /> },
          { key: 'l', label: 'Last sign-in', render: a => when(a.last_login_at) },
        ]} />
      )}
      {meta.data ? (
        <AdminSheet
          key={editing === 'new' ? 'new' : editing?.id ?? 'none'}
          target={editing}
          all={list.data ?? []}
          meta={meta.data}
          isSelf={editing !== 'new' && editing?.id === me?.id}
          meIsSuper={me?.role === 'super_admin'}
          onClose={() => setEditing(null)}
          onSecret={s => (setEditing(null), setSecret(s))}
        />
      ) : null}
      <Dialog
        open={!!secret}
        onClose={() => setSecret(null)}
        title="Temporary password"
        message="Shown only once. Share it privately. At first sign-in they verify their phone with an OTP and choose their own username and password."
        actions={[{ label: 'Done', onClick: () => setSecret(null) }]}
      >
        {secret ? (
          <div className="mt-4 flex flex-col gap-2 rounded-gm-md bg-surface-sunken p-3">
            <Text variant="caption" tone="subtle">Username</Text>
            <code className="text-sm">{secret.username}</code>
            <Text variant="caption" tone="subtle">Password</Text>
            <div className="flex items-center justify-between gap-2">
              <code className="break-all text-sm">{secret.temp_password}</code>
              <Button size="sm" variant="ghost" icon={Copy} label="Copy" onClick={() => void navigator.clipboard?.writeText(secret.temp_password)} />
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

function AdminSheet({ target, all, meta, isSelf, meIsSuper, onClose, onSecret }: {
  target: AdminRow | 'new' | null;
  all: AdminRow[];
  meta: Meta;
  isSelf: boolean;
  meIsSuper: boolean;
  onClose: () => void;
  onSecret: (s: { username: string; temp_password: string }) => void;
}) {
  const isNew = target === 'new';
  const a = isNew ? null : target;
  const { busy, run } = useAdminAction();
  const { admin: me, can } = useAdmin();
  const manageAll = can('admins.manage');
  const mine = new Set((me?.permissions ?? []) as string[]);
  const [parent, setParent] = useState<string>(a ? a.parent_id ?? '' : manageAll ? '' : me?.id ?? '');
  const [showActivity, setShowActivity] = useState(false);
  // Who this admin may report to: anyone visible (managers see only their team), never themselves or their own team.
  const below = (id: string): Set<string> => { const s = new Set<string>(); const go = (p: string) => all.filter(x => x.parent_id === p).forEach(x => { s.add(x.id); go(x.id); }); go(id); return s; };
  const blocked = a ? new Set([a.id, ...below(a.id)]) : new Set<string>();
  const parentOptions = [...(manageAll ? [{ value: '', label: 'Nobody (top level)' }] : []), ...all.filter(x => !blocked.has(x.id)).map(x => ({ value: x.id, label: `${x.full_name || x.username} (@${x.username})` }))];
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState(a?.full_name ?? '');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(a?.role ?? 'support');
  const [active, setActive] = useState(a?.is_active ?? true);
  const [overrides, setOverrides] = useState<Record<string, Override>>(() => {
    const o: Record<string, Override> = {};
    a?.extra_permissions.forEach(p => (o[p] = 'grant'));
    a?.denied_permissions.forEach(p => (o[p] = 'deny'));
    return o;
  });
  const roleDefaults = new Set(meta.roles.find(r => r.key === role)?.permissions ?? []);
  const extra = Object.entries(overrides).filter(([, v]) => v === 'grant').map(([k]) => k);
  const denied = Object.entries(overrides).filter(([, v]) => v === 'deny').map(([k]) => k);
  const roleOptions = meta.roles.filter(r => (meIsSuper || r.key !== 'super_admin') && (manageAll || r.key === role || r.permissions.every(p => mine.has(p)))).map(r => ({ value: r.key, label: r.label }));
  const locked = !!a && ((a.role === 'super_admin' && !meIsSuper) || (a.can_manage === false && !isSelf));

  const create = async () => {
    const res = await adminPost<AdminRow & { temp_password: string }>('/admins', { username: username.trim().toLowerCase(), full_name: fullName || undefined, phone: phone || undefined, role, parent_id: parent || undefined, extra_permissions: extra, denied_permissions: denied });
    onSecret({ username: res.username, temp_password: res.temp_password });
  };

  return (
    <Sheet
      open={!!target}
      onClose={onClose}
      eyebrow={isNew ? 'New admin' : `@${a?.username}`}
      title={isNew ? 'Add an admin' : a?.full_name || a?.username}
      size="lg"
      footer={
        locked ? undefined : isNew ? (
          <Button fullWidth label="Create admin" loading={busy === 'create'} disabled={username.trim().length < 4} onClick={() => run('create', create, 'Admin created', ['admins'])} />
        ) : (
          <Button fullWidth label="Save changes" loading={busy === 'save'} onClick={async () => (await run('save', () => adminPatch(`/admins/${a!.id}`, { full_name: fullName, parent_id: !isSelf && parent !== (a!.parent_id ?? '') ? parent : undefined, role: isSelf ? undefined : role, is_active: isSelf ? undefined : active, extra_permissions: extra, denied_permissions: denied }), 'Admin updated', ['admins'])) && onClose()} />
        )
      }
    >
      <div className="flex flex-col gap-5">
        {locked ? <Text tone="warning">{a?.role === 'super_admin' && !meIsSuper ? 'Only a super admin can change a super admin.' : 'This admin is outside your team, so you can only view them.'}</Text> : null}
        {a ? (
          <div>
            <Field label="Phone for codes">{a.phone_masked ? `${a.phone_masked}${a.phone_verified ? '' : ' (not verified)'}` : 'Not set'}</Field>
            <Field label="Created">{when(a.created_at)}</Field>
            <Field label="Last sign-in">{when(a.last_login_at)}</Field>
            {a.locked_until ? <Field label="Locked until">{when(a.locked_until)}</Field> : null}
          </div>
        ) : null}
        {isNew ? (
          <>
            <TextField label="Username" helper="They can change it at first sign-in." value={username} onChange={e => setUsername(e.target.value.toLowerCase())} />
            <TextField label="Phone for sign-in codes" optional helper="If set, codes can only go to this number." value={phone} onChange={e => setPhone(e.target.value)} inputMode="numeric" />
          </>
        ) : null}
        <TextField label="Name" optional value={fullName} onChange={e => setFullName(e.target.value)} disabled={locked} />
        <div className="flex flex-wrap items-center gap-3">
          <Text variant="label" tone="subtle">Role</Text>
          <Select label="Role" value={role} onChange={setRole} options={roleOptions} />
          {isSelf ? <Text variant="caption" tone="subtle">You can’t change your own role.</Text> : null}
        </div>
        {!isSelf && !locked ? (
          <div className="flex flex-wrap items-center gap-3">
            <Text variant="label" tone="subtle">Reports to</Text>
            <Select label="Reports to" value={parent} onChange={setParent} options={parentOptions} />
            <Text variant="caption" tone="subtle">Their manager can manage them and their team.</Text>
          </div>
        ) : null}
        {!isNew && !isSelf && !locked ? <Toggle label="Account enabled" checked={active} onChange={setActive} /> : null}

        <section>
          <Text variant="label" tone="subtle">Permissions</Text>
          <Text variant="caption" tone="subtle">Role default, or grant/deny one permission just for this person.</Text>
          <div className="mt-2 flex flex-col">
            {meta.permissions.map(p => {
              const o = overrides[p.key] ?? 'role';
              const effective = o === 'grant' || (o === 'role' && roleDefaults.has(p.key));
              return (
                <div key={p.key} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0">
                  <span className="min-w-0">
                    <span className={effective ? 'text-sm text-ink' : 'text-sm text-ink-subtle line-through'}>{p.label}</span>
                    <span className="block font-mono text-[11px] text-ink-subtle">{p.key}</span>
                  </span>
                  <Select
                    label={`${p.label} access`}
                    value={o}
                    onChange={v => setOverrides(prev => ({ ...prev, [p.key]: v }))}
                    options={[
                      { value: 'role', label: roleDefaults.has(p.key) ? 'Role: allowed' : 'Role: not allowed' },
                      ...(meIsSuper || mine.has(p.key) || o === 'grant' ? [{ value: 'grant' as Override, label: 'Grant' }] : []),
                      { value: 'deny', label: 'Deny' },
                    ]}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {a && !isSelf && !locked ? (
          <section className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" label="Reset password" loading={busy === 'pw'} onClick={() => run('pw', async () => onSecret(await adminPost(`/admins/${a.id}/reset-password`)), 'New temporary password issued', ['admins'])} />
            <Button size="sm" variant="outline" label="Reset phone" loading={busy === 'phone'} onClick={() => run('phone', async () => onSecret(await adminPost(`/admins/${a.id}/reset-phone`)), 'Phone unbound', ['admins'])} />
            <Button size="sm" variant="outline" label="Sign out everywhere" loading={busy === 'out'} onClick={() => run('out', () => adminPost(`/admins/${a.id}/revoke-sessions`), 'Signed out', ['admins'])} />
          </section>
        ) : null}
        {a && can('audit.view') ? (
          <section>
            <Button size="sm" variant="ghost" label={showActivity ? 'Hide API activity' : 'Show API activity'} onClick={() => setShowActivity(v => !v)} />
            {showActivity ? <div className="mt-3"><ActivityList actorId={a.id} compact /></div> : null}
          </section>
        ) : null}
      </div>
    </Sheet>
  );
}
