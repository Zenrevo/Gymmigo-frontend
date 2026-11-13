import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, TextField, useToast } from '../../components/kit';
import { useAuth } from '../../context/AuthContext';
import api, { getApiErrorMessage } from '../../utils/api';
import { landingAfterOnboarding } from '../../auth/onboarding';
import { OnboardingFrame } from './OnboardingFrame';
import { readPendingProfile, savePendingProfile } from './pendingProfile';

/** Step 2: the app's ProfileDetailsScreen fields per role. Members continue to Location; others finish here. */
export default function ProfileDetailsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, markRoleCompleted } = useAuth();
  const role = params.get('role') ?? user?.active_role ?? 'user';
  const pending = readPendingProfile();
  const [form, setForm] = useState({
    full_name: pending?.full_name ?? user?.full_name ?? '',
    email: pending?.email ?? '',
    business_name: '',
    pan_number: '',
    experience_years: '',
    specializations: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!['user', 'trainer', 'gym_owner'].includes(role)) return <Navigate to="/onboarding/role" replace />;
  const isMember = role === 'user';
  const totalSteps = isMember ? 3 : 2;

  const set = (key: keyof typeof form) => (value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    if (error) setError('');
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!form.full_name.trim()) return setError('Full name is required.');
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    if (role === 'gym_owner' && !form.business_name.trim()) return setError('Business name is required.');
    if (role === 'trainer' && !form.experience_years.trim()) return setError('Experience years is required.');

    // Members add an (optional) address on the next step, which then saves everything.
    if (isMember) {
      savePendingProfile({ full_name: form.full_name.trim(), email: form.email.trim() });
      navigate('/onboarding/location');
      return;
    }

    setLoading(true);
    try {
      if (role === 'trainer') {
        await api.post('/trainer/profile/create', {
          full_name: form.full_name.trim(),
          bio: `Professional trainer with ${form.experience_years} years experience.`,
          experience_years: parseInt(form.experience_years, 10) || 0,
          expertises: form.specializations.split(',').map(s => s.trim()).filter(Boolean),
        });
      } else {
        await api.post('/gym-owner/profile/create', {
          full_name: form.full_name.trim(),
          email: form.email.trim() || undefined,
          business_name: form.business_name.trim(),
          pan_number: form.pan_number.trim() || undefined,
        });
      }
      await markRoleCompleted(role);
      toast({ tone: 'success', title: 'Profile completed!' });
      navigate(landingAfterOnboarding(role), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Verification failed. Please check required fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingFrame
      step={2}
      total={totalSteps}
      onBack={() => navigate('/onboarding/role')}
      footer={
        <div className="flex flex-col gap-3">
          {error ? (
            <p className="t-footnote text-center text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button label={isMember ? 'Continue' : 'Done'} fullWidth loading={loading} onClick={() => submit()} />
        </div>
      }>
      <p className="t-label text-accent-text">Set up your account</p>
      <h1 className="t-display mt-2 text-ink">{role === 'gym_owner' ? 'About your business' : 'Complete your profile'}</h1>
      <p className="t-body mt-2 text-ink-muted">Tell us a bit more about you to get started.</p>
      <form className="mt-8 flex flex-col gap-5" onSubmit={submit}>
        <TextField label="Full name" placeholder="John Doe" autoComplete="name" autoFocus value={form.full_name} onChange={e => set('full_name')(e.target.value)} />
        {role !== 'trainer' ? (
          <TextField
            label="Email address"
            optional
            type="email"
            placeholder="john@example.com"
            autoComplete="email"
            value={form.email}
            onChange={e => set('email')(e.target.value)}
          />
        ) : null}
        {role === 'gym_owner' ? (
          <>
            <TextField label="Business name" placeholder="Your gym or company name" value={form.business_name} onChange={e => set('business_name')(e.target.value)} />
            <TextField
              label="PAN number"
              optional
              placeholder="ABCDE1234F"
              maxLength={10}
              value={form.pan_number}
              onChange={e => set('pan_number')(e.target.value.toUpperCase())}
            />
          </>
        ) : null}
        {role === 'trainer' ? (
          <>
            <TextField
              label="Experience (years)"
              placeholder="e.g. 5"
              inputMode="numeric"
              value={form.experience_years}
              onChange={e => set('experience_years')(e.target.value.replace(/\D/g, ''))}
            />
            <TextField
              label="Specializations"
              optional
              placeholder="Strength, HIIT, Yoga"
              helper="Separate with commas"
              value={form.specializations}
              onChange={e => set('specializations')(e.target.value)}
            />
          </>
        ) : null}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </OnboardingFrame>
  );
}
