import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { KeyRound, ShieldCheck, Smartphone } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { Button, Card, OtpInput, Text, TextField } from '../components/kit';
import { adminError, adminPost, type LoginStep, type Session } from './api';
import { useAdmin } from './useAdmin';
import { passwordChecks } from './password';

type Step =
  | { kind: 'credentials' }
  | { kind: 'otp'; token: string; phone: string }
  | { kind: 'setup'; token: string; phoneLocked: boolean; phoneMasked: string | null; username: string; codeSentTo?: string };

/** /admin/login — username + password, then a phone OTP. First sign-in binds the phone and replaces the temp credentials. */
export default function AdminLogin() {
  const { admin, startSession } = useAdmin();
  const location = useLocation();
  const [step, setStep] = useState<Step>({ kind: 'credentials' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const expired = (location.state as { expired?: boolean } | null)?.expired;

  if (admin) return <Navigate to="/admin" replace />;

  const call = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setBusy(true);
    setError('');
    try {
      return await fn();
    } catch (e) {
      setError(adminError(e).message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const onLogin = (s: LoginStep) => {
    if (s.stage === 'done') startSession(s);
    else if (s.stage === 'otp') setStep({ kind: 'otp', token: s.challenge_token, phone: s.phone_masked });
    else setStep({ kind: 'setup', token: s.challenge_token, phoneLocked: s.phone_locked, phoneMasked: s.phone_masked, username: s.username });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex items-center gap-3">
          <BrandLogo size={40} />
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Admin</span>
        </div>
        <Card padding="lg">
          {step.kind === 'credentials' ? (
            <Credentials busy={busy} error={error} expired={!!expired} onSubmit={(u, p) => call(() => adminPost<LoginStep>('/auth/login', { username: u, password: p })).then(r => r && onLogin(r))} />
          ) : step.kind === 'otp' ? (
            <OtpStep
              phone={step.phone}
              busy={busy}
              error={error}
              onVerify={otp => call(() => adminPost<Session>('/auth/otp/verify', { challenge_token: step.token, otp })).then(r => r && startSession(r))}
              onResend={() => call(() => adminPost('/auth/otp/resend', { challenge_token: step.token }))}
              onBack={() => setStep({ kind: 'credentials' })}
            />
          ) : (
            <Setup step={step} setStep={setStep} busy={busy} error={error} call={call} onDone={startSession} />
          )}
        </Card>
        <Text variant="caption" tone="subtle" align="center" className="mt-4">
          Every admin action is recorded in a tamper-proof audit log.
        </Text>
      </div>
    </div>
  );
}

function ErrorLine({ error }: { error: string }) {
  return error ? <p role="alert" className="t-footnote mt-3 rounded-gm-md bg-danger-soft px-3 py-2 text-danger">{error}</p> : null;
}

function Credentials({ busy, error, expired, onSubmit }: { busy: boolean; error: string; expired: boolean; onSubmit: (u: string, p: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim() && password) onSubmit(username.trim(), password);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <Text variant="h2" as="h1">Sign in to Gymmigo Admin</Text>
        <Text tone="muted" className="mt-1">{expired ? 'Your session ended. Sign in again.' : 'Username and password, then a code on your phone.'}</Text>
      </div>
      <TextField label="Username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
      <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
      <ErrorLine error={error} />
      <Button type="submit" label="Continue" icon={KeyRound} loading={busy} disabled={!username.trim() || !password} fullWidth />
    </form>
  );
}

function OtpStep({ phone, busy, error, onVerify, onResend, onBack }: { phone: string; busy: boolean; error: string; onVerify: (otp: string) => void; onResend: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState('');
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Text variant="h2" as="h1">Enter the code</Text>
        <Text tone="muted" className="mt-1">We sent a 6-digit code to {phone}.</Text>
      </div>
      <OtpInput value={otp} onChange={setOtp} autoFocus error={!!error} onComplete={onVerify} />
      <ErrorLine error={error} />
      <Button label="Verify and sign in" icon={ShieldCheck} loading={busy} disabled={otp.length < 6} fullWidth onClick={() => onVerify(otp)} />
      <div className="flex justify-between">
        <Button size="sm" variant="ghost" label="Back" onClick={onBack} />
        <Button size="sm" variant="ghost" label="Resend code" disabled={busy} onClick={onResend} />
      </div>
    </div>
  );
}

function Setup({ step, setStep, busy, error, call, onDone }: {
  step: Extract<Step, { kind: 'setup' }>;
  setStep: (s: Step) => void;
  busy: boolean;
  error: string;
  call: <T>(fn: () => Promise<T>) => Promise<T | null>;
  onDone: (s: Session) => void;
}) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState(step.username === 'gymmigo.admin' ? '' : step.username);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const checks = passwordChecks(password, username);
  const strong = checks.every(c => c.ok);

  const sendCode = async () => {
    const r = await call(() => adminPost<{ phone_masked: string }>('/auth/setup/send-otp', { challenge_token: step.token, phone: step.phoneLocked ? undefined : phone }));
    if (r) setStep({ ...step, codeSentTo: r.phone_masked });
  };

  const complete = async (e: FormEvent) => {
    e.preventDefault();
    const r = await call(() => adminPost<Session>('/auth/setup/complete', {
      challenge_token: step.token, phone: step.phoneLocked ? undefined : phone, otp,
      new_username: username.trim().toLowerCase(), new_password: password, full_name: fullName.trim() || undefined,
    }));
    if (r) onDone(r);
  };

  if (!step.codeSentTo) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <Text variant="h2" as="h1">Secure your account</Text>
          <Text tone="muted" className="mt-1">
            You signed in with a temporary password. Verify your phone, then choose your own username and password.
            Sign-in codes will go to this phone.
          </Text>
        </div>
        {step.phoneLocked ? (
          <Text>Code will be sent to <strong>{step.phoneMasked}</strong>.</Text>
        ) : (
          <TextField label="Your mobile number" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))} autoFocus />
        )}
        <ErrorLine error={error} />
        <Button label="Send code" icon={Smartphone} loading={busy} disabled={!step.phoneLocked && phone.replace(/\D/g, '').length < 10} fullWidth onClick={sendCode} />
      </div>
    );
  }

  return (
    <form onSubmit={complete} className="flex flex-col gap-4">
      <div>
        <Text variant="h2" as="h1">Set your sign-in details</Text>
        <Text tone="muted" className="mt-1">Code sent to {step.codeSentTo}.</Text>
      </div>
      <OtpInput value={otp} onChange={setOtp} autoFocus />
      <TextField label="Your name" optional value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" />
      <TextField label="New username" helper="4–32 characters: lowercase letters, numbers, dot, dash, underscore." value={username} onChange={e => setUsername(e.target.value.toLowerCase())} autoComplete="username" />
      <TextField label="New password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
      <ul className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <li key={c.label} className={c.ok ? 't-caption text-success' : 't-caption text-ink-subtle'}>{c.ok ? '✓' : '•'} {c.label}</li>
        ))}
      </ul>
      <TextField label="Confirm password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" error={confirm && confirm !== password ? 'Passwords don’t match.' : undefined} />
      <ErrorLine error={error} />
      <Button type="submit" label="Save and sign in" icon={ShieldCheck} loading={busy} disabled={otp.length < 6 || !strong || password !== confirm || username.trim().length < 4} fullWidth />
      <Button type="button" size="sm" variant="ghost" label="Resend code" disabled={busy} onClick={sendCode} />
    </form>
  );
}
