import { useEffect } from 'react';

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

// A page that has just loaded (first visit, or a refresh) keeps focus where the browser
// put it: moving it would draw a focus ring around a heading nobody asked for. Once the
// person has pressed a key or a button, opening a panel or a step moves focus as usual.
let interacted = false;
if (typeof document !== 'undefined') {
  const note = () => {
    interacted = true;
  };
  document.addEventListener('pointerdown', note, { capture: true, once: true });
  document.addEventListener('keydown', note, { capture: true, once: true });
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
    if (interacted) element.focus({ preventScroll: true });
    const anchor = element.closest<HTMLElement>('.oc-panel') ?? element;
    if (typeof anchor.scrollIntoView === 'function') {
      anchor.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
    // `target` reads refs, so it is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
