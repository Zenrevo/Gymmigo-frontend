import type { ReactNode } from 'react';
import { Text } from '../../../../components/kit';

/** A label / value line. */
export function Row({ label, value, strong, tone }: { label: ReactNode; value: ReactNode; strong?: boolean; tone?: 'success' | 'danger' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <Text variant={strong ? 'bodyStrong' : 'footnote'} tone={strong ? 'default' : 'muted'}>{label}</Text>
      <Text variant={strong ? 'bodyStrong' : 'footnote'} tone={tone ?? 'default'}>{value}</Text>
    </div>
  );
}
