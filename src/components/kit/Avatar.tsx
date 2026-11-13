import { useState } from 'react';
import { cn } from './cn';

import { initialsOf } from './initials';

type Props = {
  name?: string | null;
  src?: string | null;
  size?: number;
  /** Ring colour (e.g. a Run Room member colour). */
  ring?: string;
  className?: string;
  status?: 'online' | 'none';
};

/** Image or initials on accent-soft, optional coloured ring (room members). */
export function Avatar({ name, src, size = 40, ring, className, status = 'none' }: Props) {
  const [failed, setFailed] = useState(false);
  const showImg = !!src && !failed;
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent-text', className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.36)),
        boxShadow: ring ? `0 0 0 2px var(--gm-surface), 0 0 0 ${size >= 48 ? 4 : 3.5}px ${ring}` : undefined,
      }}
      aria-label={name ?? undefined}>
      {showImg ? (
        <img src={src!} alt="" className="h-full w-full rounded-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden>{initialsOf(name)}</span>
      )}
      {status === 'online' ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-success" /> : null}
    </span>
  );
}
