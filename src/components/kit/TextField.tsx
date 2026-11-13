import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

type FieldChrome = {
  label?: ReactNode;
  optional?: boolean;
  helper?: ReactNode;
  error?: ReactNode;
  className?: string;
};

function FieldShell({ id, label, optional, helper, error, className, children }: FieldChrome & { id: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={id} className="t-label flex items-center gap-1.5 text-ink-muted">
          {label}
          {optional ? <span className="t-caption normal-case tracking-normal text-ink-subtle">(optional)</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="t-footnote text-danger">
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-help`} className="t-footnote text-ink-subtle">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

const inputBox =
  'flex items-center gap-2 rounded-gm-lg border bg-surface px-4 transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--gm-accent-soft)]';

type TextFieldProps = FieldChrome &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'prefix'> & {
    prefix?: ReactNode;
    suffix?: ReactNode;
    inputClassName?: string;
  };

/** App `TextField`: uppercase label, 52px input, 14px radius, accent focus ring, error/helper line. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, optional, helper, error, className, prefix, suffix, inputClassName, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} optional={optional} helper={helper} error={error} className={className}>
      <div className={cn(inputBox, 'h-[52px]', error ? 'border-danger' : 'border-border-strong', rest.disabled && 'opacity-60')}>
        {prefix ? <span className="t-body-strong shrink-0 text-ink-muted">{prefix}</span> : null}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : helper ? `${fieldId}-help` : undefined}
          className={cn('t-body h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-subtle', inputClassName)}
          {...rest}
        />
        {suffix}
      </div>
    </FieldShell>
  );
});

type TextAreaProps = FieldChrome & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, optional, helper, error, className, id, rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} optional={optional} helper={helper} error={error} className={className}>
      <div className={cn(inputBox, 'py-3', error ? 'border-danger' : 'border-border-strong')}>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          className="t-body min-w-0 flex-1 resize-y bg-transparent text-ink outline-none placeholder:text-ink-subtle"
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

type DateTimeProps = FieldChrome & Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type' | 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
};

/** Native date picker styled as a TextField; value is YYYY-MM-DD. */
export function DateField({ value, onChange, ...rest }: DateTimeProps) {
  return <TextField type="date" value={value} onChange={e => onChange(e.target.value)} inputClassName="[color-scheme:inherit]" {...rest} />;
}

/** Native time picker; value is HH:MM (24h). */
export function TimeField({ value, onChange, ...rest }: DateTimeProps) {
  return <TextField type="time" value={value} onChange={e => onChange(e.target.value)} inputClassName="[color-scheme:inherit]" {...rest} />;
}
