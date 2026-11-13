import { cn } from './cn';

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

/** iOS-style switch (accessible name required). */
export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-[30px] w-[50px] shrink-0 items-center rounded-full border transition-colors duration-200 disabled:opacity-40',
        checked ? 'border-selection bg-selection' : 'border-border-strong bg-surface-sunken',
        className,
      )}>
      <span
        aria-hidden
        className={cn('ml-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200', checked && 'translate-x-[20px]')}
      />
    </button>
  );
}

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function Checkbox({ checked, onChange, label, disabled, className, id }: CheckboxProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-start gap-3', disabled && 'cursor-not-allowed opacity-50', className)}>
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-gm-sm border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
          checked ? 'border-selection bg-selection text-on-selection' : 'border-border-strong bg-surface',
        )}>
        {checked ? (
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
            <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {label ? <span className="t-footnote text-ink-muted">{label}</span> : null}
    </label>
  );
}
