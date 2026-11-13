import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab focus inside `ref` while active, focuses the first field, restores focus on close. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    const items = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null || el === document.activeElement);
    const first = root.querySelector<HTMLElement>('[data-autofocus]') ?? items()[0];
    (first ?? root).focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const head = list[0];
      const tail = list[list.length - 1];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };
    root.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('keydown', onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [ref, active]);
}

let locks = 0;
/** Stops the page behind a sheet from scrolling (nested sheets share one lock). */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      locks -= 1;
      if (locks === 0) document.body.style.overflow = prev;
    };
  }, [active]);
}
