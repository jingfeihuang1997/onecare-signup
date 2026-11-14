import { useEffect, useRef, type ReactNode } from 'react';

/**
 * The header and the progress display. It stays at the top of the screen while the page
 * scrolls, and tells the stylesheet how tall it is (--oc-top-h) so a panel that scrolls
 * into view stops just below it.
 */
export function TopBar({ children }: { children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = bar.current;
    if (!element) return;
    const publish = () =>
      document.documentElement.style.setProperty('--oc-top-h', `${Math.round(element.offsetHeight)}px`);
    publish();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="oc-top" ref={bar}>
      {children}
    </div>
  );
}
