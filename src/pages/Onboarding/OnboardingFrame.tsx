import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ProgressSteps } from '../../components/kit';
import AuthLayout from '../../layouts/AuthLayout';

/** STEP 0X / 0N header + progress bar used by every onboarding step (app RoleSelect/ProfileDetails/Location). */
export function OnboardingFrame({
  step,
  total,
  onBack,
  canGoBack = true,
  footer,
  children,
}: {
  step: number;
  total: number;
  onBack?: () => void;
  canGoBack?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <AuthLayout footer={footer}>
      <div className="flex h-14 items-center">
        {canGoBack ? (
          <button
            type="button"
            aria-label="Back"
            onClick={onBack ?? (() => navigate(-1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-gm-md border border-border bg-surface text-ink hover:bg-surface-sunken">
            <ArrowLeft size={18} aria-hidden />
          </button>
        ) : null}
        <span className="t-label flex-1 text-center text-ink-subtle">
          STEP {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        {canGoBack ? <span className="w-10" /> : null}
      </div>
      <ProgressSteps total={total} current={step} className="mt-1" />
      <div className="pt-6">{children}</div>
    </AuthLayout>
  );
}
