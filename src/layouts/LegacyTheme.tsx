import type { ReactNode } from 'react';

/**
 * Marks pages not yet rebuilt on the kit. Their colours were converted to theme tokens, so this no longer
 * forces dark; it is kept as a marker so feature forks can find (and drop) it when they rebuild a page.
 */
export function Legacy({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
