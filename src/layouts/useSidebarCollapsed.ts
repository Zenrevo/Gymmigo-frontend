import { useCallback, useEffect, useState } from 'react';

const KEY = 'gymmigo_sidebar_collapsed';
const NARROW = '(min-width: 768px) and (max-width: 1100px)';

const readStored = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Sidebar rail state. The user's choice is persisted; on 768–1100px widths the rail is collapsed
 * by default and an expand there lasts until the width changes.
 */
export function useSidebarCollapsed() {
  const [stored, setStored] = useState(readStored);
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(NARROW).matches);
  const [narrowExpanded, setNarrowExpanded] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.(NARROW);
    if (!mq) return;
    const on = () => {
      setNarrow(mq.matches);
      setNarrowExpanded(false);
    };
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const collapsed = narrow ? !narrowExpanded : stored;

  const toggle = useCallback(() => {
    if (narrow) {
      setNarrowExpanded(v => !v);
      return;
    }
    setStored(v => {
      try {
        localStorage.setItem(KEY, v ? '0' : '1');
      } catch {
        /* private mode */
      }
      return !v;
    });
  }, [narrow]);

  return { collapsed, toggle };
}
