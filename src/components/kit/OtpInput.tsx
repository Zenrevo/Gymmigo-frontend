import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from './cn';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  error?: boolean;
  disabled?: boolean;
  onComplete?: (value: string) => void;
};

/** Six boxes, digits only, paste-aware, backspace moves back (app `OtpInput`). */
export function OtpInput({ value, onChange, length = 6, autoFocus, error, disabled, onComplete }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (autoFocus) refs.current[Math.min(value.length, length - 1)]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  const setAt = (i: number, ch: string) => {
    const d = ch.replace(/\D/g, '');
    if (!d) return;
    if (d.length > 1) {
      const clean = commit(value.slice(0, i) + d);
      refs.current[Math.min(clean.length, length - 1)]?.focus();
      return;
    }
    const arr = digits.slice();
    arr[i] = d;
    const clean = commit(arr.join(''));
    if (i < length - 1 && clean.length > i) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = digits.slice();
      if (arr[i]) {
        arr[i] = '';
        commit(arr.join(''));
      } else if (i > 0) {
        arr[i - 1] = '';
        commit(arr.join(''));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const clean = commit(e.clipboardData.getData('text'));
    refs.current[Math.min(clean.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          maxLength={length}
          onChange={e => setAt(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={e => e.target.select()}
          className={cn(
            't-h1 h-14 w-full min-w-0 max-w-14 rounded-gm-lg border bg-surface text-center text-ink outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_var(--gm-accent-soft)]',
            error ? 'border-danger' : d ? 'border-border-strong' : 'border-border',
          )}
        />
      ))}
    </div>
  );
}
