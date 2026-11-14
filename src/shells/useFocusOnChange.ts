import { useEffect } from 'react';

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/**
 * When `key` changes (a panel or a step opens), moves focus to its heading and brings it
 * into view. Scrolling is instant for people who asked for reduced motion.
 */
export function useFocusOnChange(
  key: string | null,
  target: () => HTMLElement | null | undefined,
): void {
  useEffect(() => {
    if (key === null) return;
    const element = target();
    if (!element) return;
    element.focus({ preventScroll: true });
    const anchor = element.closest<HTMLElement>('.oc-panel') ?? element;
    if (typeof anchor.scrollIntoView === 'function') {
      anchor.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
    // `target` reads refs, so it is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
