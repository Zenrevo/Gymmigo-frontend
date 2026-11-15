import { useEffect } from 'react';

/** Browser tab title for app pages: "Explore · Gymmigo". */
export function usePageTitle(label?: string | null) {
  useEffect(() => {
    document.title = label ? `${label} · Gymmigo` : 'Gymmigo';
  }, [label]);
}
