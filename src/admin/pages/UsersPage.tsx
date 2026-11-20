import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Checkbox, ErrorState, Sheet, Skeleton, Text } from '../../components/kit';
import { adminGet, adminPost, adminPut, type Paged } from '../api';
import { useAdmin } from '../useAdmin';
import { inr, when } from '../format';
import { DataTable, Field, PageTitle, Pager, PromptDialog, SearchBox, Select, StatusPill, Toolbar } from '../ui';
import { useAdminAction } from '../useAdminAction';
import { useDebounced } from '../useDebounced';

type UserRow = {
  id: string; phone: string; email: string | null; full_name: string | null; roles: string[]; active_role: string;
  is_active: boolean; is_banned: boolean; ban_reason: string | null; created_at: string; last_login_at: string | null;
};
type UserDetail = UserRow & {
  active_sessions: number;
  trainer: { id: string; verification_status: string; rejection_reason: string | null; experience_years: number | null; rating_avg: number | null } | null;
  gym_owner: { id: string; business_name: string | null; verification_status: string; rejection_reason: string | null; gstin: string | null } | null;
  gyms: { id: string; name: string; city: string | null; is_verified: boolean; is_active: boolean }[];
  memberships: { id: string; gym: string; status: string; payment_status: string; amount: number; start_date: string; end_date: string }[];
  bookings: { id: string; status: string; payment_status: string; total_amount: number; sessions: string; start_date: string }[];
};

const ROLE_LABEL: Record<string, string> = { user: 'Member', trainer: 'Trainer', gym_owner: 'Gym owner', gym_manager: 'Gym manager' };
const status = (u: UserRow) => (u.is_banned ? 'banned' : !u.is_active ? 'deactivated' : 'active');

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [role, setRole] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ['admin', 'users', q, role, state, page],
    queryFn: () => adminGet<Paged<UserRow>>('/users', { q, role, status: state, page, page_size: 25 }),
  });

  return (
    <>
      <PageTitle title="Users" subtitle="Everyone with a Gymmigo account: members, trainers and gym staff." />
      <Toolbar>
        <SearchBox value={search} onChange={v => (setSearch(v), setPage(1))} placeholder="Name, phone or email" />
        <Select label="Role" value={role} onChange={v => (setRole(v), setPage(1))} options={[{ value: '', label: 'All roles' }, ...Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))]} />
        <Select label="Status" value={state} onChange={v => (setState(v), setPage(1))} options={[{ value: '', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'banned', label: 'Banned' }, { value: 'deactivated', label: 'Deactivated' }]} />
      </Toolbar>
      {list.isLoading ? <Skeleton className="h-64" rounded="xl" /> : list.isError || !list.data ? <ErrorState onRetry={() => list.refetch()} /> : (
        <>
          <DataTable
            rows={list.data.items}
            rowKey={u => u.id}
            onRowClick={u => setOpenId(u.id)}
            empty="No users match."
            columns={[
              { key: 'name', label: 'User', render: u => <><div className="font-semibold">{u.full_name || '—'}</div><div className="text-xs text-ink-subtle">{u.phone}</div></> },
              { key: 'roles', label: 'Roles', render: u => <div className="flex flex-wrap justify-end gap-1 md:justify-start">{u.roles.map(r => <Badge key={r} label={ROLE_LABEL[r] ?? r} />)}</div> },
              { key: 'status', label: 'Status', render: u => <StatusPill status={status(u)} /> },
              { key: 'joined', label: 'Joined', render: u => when(u.created_at, false) },
              { key: 'seen', label: 'Last sign-in', render: u => when(u.last_login_at) },
            ]}
          />
          <Pager page={page} pageSize={25} total={list.data.total} onPage={setPage} />
        </>
      )}
      <UserSheet id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

function UserSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { can } = useAdmin();
  const { busy, run } = useAdminAction();
  const [banOpen, setBanOpen] = useState(false);
  const [editRoles, setEditRoles] = useState<string[] | null>(null);
  const q = useQuery({ queryKey: ['admin', 'user', id], queryFn: () => adminGet<UserDetail>(`/users/${id}`), enabled: !!id });
  const u = q.data;
  const refresh = ['users', 'user', 'overview'];

  return (
    <Sheet open={!!id} onClose={() => (setEditRoles(null), onClose())} eyebrow="User" title={u?.full_name || u?.phone || 'User'} size="lg">
      {!u ? <Skeleton className="h-60" rounded="xl" /> : (
        <div className="flex flex-col gap-5">
          <div>
            <Field label="Phone">{u.phone}</Field>
            <Field label="Email">{u.email}</Field>
            <Field label="Status"><StatusPill status={status(u)} /></Field>
            {u.ban_reason ? <Field label="Ban reason">{u.ban_reason}</Field> : null}
            <Field label="Active role">{ROLE_LABEL[u.active_role] ?? u.active_role}</Field>
            <Field label="Joined">{when(u.created_at)}</Field>
            <Field label="Last sign-in">{when(u.last_login_at)}</Field>
            <Field label="Signed-in devices">{u.active_sessions}</Field>
          </div>

          {can('users.manage') ? (
            <div className="flex flex-wrap gap-2">
              {u.is_banned ? (
                <Button size="sm" variant="secondary" label="Lift ban" loading={busy === 'unban'} onClick={() => run('unban', () => adminPost(`/users/${u.id}/unban`), 'Ban lifted', refresh)} />
              ) : (
                <Button size="sm" variant="danger" label="Ban user" onClick={() => setBanOpen(true)} />
              )}
              {u.is_active ? (
                <Button size="sm" variant="outline" label="Deactivate" loading={busy === 'deact'} onClick={() => run('deact', () => adminPost(`/users/${u.id}/deactivate`), 'Account deactivated', refresh)} />
              ) : (
                <Button size="sm" variant="secondary" label="Reactivate" loading={busy === 'act'} onClick={() => run('act', () => adminPost(`/users/${u.id}/activate`), 'Account reactivated', refresh)} />
              )}
              <Button size="sm" variant="outline" label="Sign out everywhere" loading={busy === 'revoke'} onClick={() => run('revoke', () => adminPost(`/users/${u.id}/revoke-sessions`), 'Signed out of every device', refresh)} />
            </div>
          ) : null}

          <section>
            <div className="mb-2 flex items-center justify-between">
              <Text variant="label" tone="subtle">App roles</Text>
              {can('users.roles') && !editRoles ? <Button size="sm" variant="ghost" label="Edit" onClick={() => setEditRoles(u.roles)} /> : null}
            </div>
            {editRoles ? (
              <div className="flex flex-col gap-2">
                {Object.entries(ROLE_LABEL).map(([r, label]) => (
                  <Checkbox key={r} label={label} checked={editRoles.includes(r)} disabled={r === 'user'} onChange={on => setEditRoles(on ? [...editRoles, r] : editRoles.filter(x => x !== r))} />
                ))}
                <div className="flex gap-2">
                  <Button size="sm" label="Save roles" loading={busy === 'roles'} onClick={async () => (await run('roles', () => adminPut(`/users/${u.id}/roles`, { roles: editRoles }), 'Roles updated', refresh)) && setEditRoles(null)} />
                  <Button size="sm" variant="ghost" label="Cancel" onClick={() => setEditRoles(null)} />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">{u.roles.map(r => <Badge key={r} label={ROLE_LABEL[r] ?? r} />)}</div>
            )}
          </section>

          {u.trainer ? (
            <section>
              <Text variant="label" tone="subtle" className="mb-1">Trainer profile</Text>
              <Field label="Verification"><StatusPill status={u.trainer.verification_status} /></Field>
              <Field label="Experience">{u.trainer.experience_years != null ? `${u.trainer.experience_years} yrs` : null}</Field>
              <Field label="Rating">{u.trainer.rating_avg != null ? `${u.trainer.rating_avg.toFixed(1)} ★` : null}</Field>
            </section>
          ) : null}
          {u.gym_owner ? (
            <section>
              <Text variant="label" tone="subtle" className="mb-1">Gym owner</Text>
              <Field label="Business">{u.gym_owner.business_name}</Field>
              <Field label="GSTIN">{u.gym_owner.gstin}</Field>
              <Field label="Verification"><StatusPill status={u.gym_owner.verification_status} /></Field>
              {u.gyms.map(g => <Field key={g.id} label="Gym">{g.name}{g.city ? `, ${g.city}` : ''} · {g.is_verified ? 'verified' : 'unverified'}</Field>)}
            </section>
          ) : null}
          {u.memberships.length ? (
            <section>
              <Text variant="label" tone="subtle" className="mb-1">Memberships</Text>
              {u.memberships.map(m => <Field key={m.id} label={m.gym}><StatusPill status={m.status} /> <StatusPill status={m.payment_status} /> {inr(m.amount)}</Field>)}
            </section>
          ) : null}
          {u.bookings.length ? (
            <section>
              <Text variant="label" tone="subtle" className="mb-1">Trainer plans</Text>
              {u.bookings.map(b => <Field key={b.id} label={`From ${when(b.start_date, false)}`}><StatusPill status={b.status} /> <StatusPill status={b.payment_status} /> {inr(b.total_amount)} · {b.sessions}</Field>)}
            </section>
          ) : null}
        </div>
      )}
      <PromptDialog
        open={banOpen}
        tone="danger"
        title="Ban this user?"
        message="They are signed out of every device and can’t sign in until the ban is lifted."
        label="Reason (saved in the audit log)"
        confirmLabel="Ban user"
        onCancel={() => setBanOpen(false)}
        onConfirm={async reason => {
          if (u && (await run('ban', () => adminPost(`/users/${u.id}/ban`, { reason }), 'User banned', refresh))) setBanOpen(false);
        }}
      />
    </Sheet>
  );
}
