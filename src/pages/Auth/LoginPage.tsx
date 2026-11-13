import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { Badge, Button, Checkbox, OtpInput, TextField } from '../../components/kit';
import AuthLayout from '../../layouts/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import api, { getApiErrorMessage } from '../../utils/api';
import { landingAfterLogin } from '../../auth/onboarding';

const RESEND_SECONDS = 30;
const formatPhone = (p: string) => `+91 ${p.slice(0, 5)} ${p.slice(5)}`;

/** Phone entry → OTP, same copy and rules as the app (10 digits, terms agreed, 30 s resend). */
export default function LoginPage() {
  const { login, token, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondsLeft]);

  if (token && !isLoading && user && step === 'phone') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from.startsWith('/app') ? from : landingAfterLogin(user)} replace />;
  }

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (phone.length !== 10) return setError('Enter your 10-digit mobile number.');
    if (!agreed) return setError('Please accept the Terms and Privacy Policy to continue.');
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/send-otp', { phone: `+91${phone}` });
      if (res.data.success) {
        setStep('otp');
        setOtp('');
        setSecondsLeft(RESEND_SECONDS);
      } else setError(res.data.message || 'Failed to send OTP');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { phone: `+91${phone}` });
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const verify = async (code = otp) => {
    if (code.length < 4) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', { phone: `+91${phone}`, otp: code });
      if (res.data.success) {
        const { user: userData, tokens, is_new_user } = res.data.data;
        login(tokens.access_token, tokens.refresh_token, userData);
        navigate(landingAfterLogin(userData, is_new_user), { replace: true });
      } else setError(res.data.message || 'Invalid code');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <AuthLayout footer={<Button label="Verify & continue" fullWidth loading={loading} disabled={otp.length < 4} onClick={() => verify()} />}>
        <button
          type="button"
          onClick={() => setStep('phone')}
          aria-label="Back"
          className="inline-flex h-10 w-10 items-center justify-center rounded-gm-md border border-border bg-surface text-ink hover:bg-surface-sunken">
          <ArrowLeft size={18} aria-hidden />
        </button>
        <h1 className="t-display mt-8 text-ink">Check your phone</h1>
        <p className="t-body mt-2 text-ink-muted">
          We’ve sent a code to <span className="t-body-strong text-ink">{formatPhone(phone)}</span>
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-accent-text">
          <MessageCircle size={13} aria-hidden />
          <Badge label="Sent on WhatsApp by Zenrevo" tone="accent" />
        </div>
        <form
          className="mt-8"
          onSubmit={e => {
            e.preventDefault();
            verify();
          }}>
          <OtpInput value={otp} onChange={v => (setOtp(v), error && setError(''))} autoFocus error={!!error} onComplete={verify} />
          {error ? (
            <p className="t-footnote mt-3 text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </form>
        <div className="mt-6 flex items-center justify-between">
          {secondsLeft > 0 ? (
            <span className="t-callout text-ink-subtle">Resend code in 0:{String(secondsLeft).padStart(2, '0')}</span>
          ) : (
            <button type="button" onClick={resend} disabled={resending} className="t-callout font-semibold text-accent-text hover:underline">
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
          <button type="button" onClick={() => setStep('phone')} className="t-callout text-ink-muted hover:text-ink">
            Change number
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      footer={
        <div className="flex flex-col items-center gap-3">
          <Button label="Send code" fullWidth loading={loading} disabled={!agreed || phone.length !== 10} onClick={() => sendCode()} />
          <span className="t-label-sm flex items-center gap-1.5 text-accent-text">
            <MessageCircle size={13} aria-hidden /> OTP will be sent via WhatsApp by Zenrevo
          </span>
        </div>
      }>
      <div className="pt-6 lg:pt-16">
        <Link to="/" aria-label="Gymmigo home" className="lg:hidden">
          <BrandLogo size={56} />
        </Link>
        <h1 className="t-display mt-8 text-ink lg:mt-0">Your number</h1>
        <p className="t-body mt-2 text-ink-muted">We’ll send a one-time code to sign you in or create your account.</p>
        <form className="mt-8 flex flex-col gap-5" onSubmit={sendCode}>
          <TextField
            label="Mobile number"
            prefix="+91"
            placeholder="10-digit mobile number"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            autoFocus
            onChange={e => {
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
              if (error) setError('');
            }}
            error={error || undefined}
          />
          <Checkbox
            checked={agreed}
            onChange={setAgreed}
            label={
              <>
                I agree to the{' '}
                <Link to="/terms" className="font-semibold text-accent-text underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-semibold text-accent-text underline">
                  Privacy Policy
                </Link>
                .
              </>
            }
          />
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>
      </div>
    </AuthLayout>
  );
}
