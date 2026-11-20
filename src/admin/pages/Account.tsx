import { useState } from 'react';
import { Badge, Button, Card, OtpInput, Text, TextField } from '../../components/kit';
import { adminError, adminPost, type Session } from '../api';
import { useAdmin } from '../useAdmin';
import { passwordChecks } from '../password';
import { when } from '../format';
import { Field, PageTitle } from '../ui';

/** My account: profile, permissions, and changing username/password (OTP to my phone + current password). */
export default function Account() {
  const { admin, startSession } = useAdmin();
  const [codeSent, setCodeSent] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [current, setCurrent] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'danger' | 'success'; text: string } | null>(null);
  if (!admin) return null;

  const checks = passwordChecks(password, username || admin.username);
  const pwOk = !password || (checks.every(c => c.ok) && password === confirm);
  const userOk = !username || /^[a-z0-9][a-z0-9._-]{3,31}$/.test(username);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ tone: 'danger', text: adminError(e).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageTitle title="My account" subtitle="Your profile, access and sign-in details." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <Text variant="subtitle" className="mb-2">Profile</Text>
          <Field label="Name">{admin.full_name}</Field>
          <Field label="Username">@{admin.username}</Field>
          <Field label="Role">{admin.role_label}</Field>
          <Field label="Codes go to">{admin.phone_masked}</Field>
          <Field label="Last sign-in">{when(admin.last_login_at)}</Field>
          <Field label="Password changed">{when(admin.password_changed_at)}</Field>
          <Text variant="label" tone="subtle" className="mb-2 mt-4">What you can do</Text>
          <div className="flex flex-wrap gap-1">{admin.permissions.map(p => <Badge key={p} label={p} />)}</div>
        </Card>

        <Card>
          <Text variant="subtitle">Change username or password</Text>
          <Text variant="footnote" tone="muted" className="mb-4">We’ll send a code to {admin.phone_masked}. After saving, other sessions are signed out.</Text>
          {!codeSent ? (
            <Button label="Send code" loading={busy} onClick={() => act(async () => setCodeSent((await adminPost<{ phone_masked: string }>('/auth/credentials/send-otp')).phone_masked))} />
          ) : (
            <form
              className="flex flex-col gap-3"
              onSubmit={e => {
                e.preventDefault();
                void act(async () => {
                  const s = await adminPost<Session>('/auth/credentials', { otp, current_password: current, new_username: username || undefined, new_password: password || undefined });
                  startSession(s);
                  setCodeSent(null);
                  setOtp(''); setCurrent(''); setUsername(''); setPassword(''); setConfirm('');
                  setMsg({ tone: 'success', text: 'Saved. You’re signed in with your new details.' });
                });
              }}
            >
              <Text variant="caption" tone="subtle">Code sent to {codeSent}</Text>
              <OtpInput value={otp} onChange={setOtp} autoFocus />
              <TextField label="Current password" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} />
              <TextField label="New username" optional value={username} onChange={e => setUsername(e.target.value.toLowerCase())} error={!userOk ? '4–32 characters: a–z, 0–9, dot, dash, underscore.' : undefined} autoComplete="username" />
              <TextField label="New password" optional type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
              {password ? (
                <>
                  <ul className="grid grid-cols-2 gap-1">{checks.map(c => <li key={c.label} className={c.ok ? 't-caption text-success' : 't-caption text-ink-subtle'}>{c.ok ? '✓' : '•'} {c.label}</li>)}</ul>
                  <TextField label="Confirm new password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} error={confirm && confirm !== password ? 'Passwords don’t match.' : undefined} autoComplete="new-password" />
                </>
              ) : null}
              <Button type="submit" label="Save" loading={busy} disabled={otp.length < 6 || !current || (!username && !password) || !pwOk || !userOk} />
            </form>
          )}
          {msg ? <p role="status" className={msg.tone === 'danger' ? 't-footnote mt-3 text-danger' : 't-footnote mt-3 text-success'}>{msg.text}</p> : null}
        </Card>
      </div>
    </>
  );
}
