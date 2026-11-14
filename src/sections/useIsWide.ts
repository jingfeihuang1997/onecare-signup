import { useEffect, useState } from 'react';

const QUERY = '(min-width: 900px)';

function matches(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

/**
 * True from 900px wide, the breakpoint of the two-column layout. Used where a section
 * offers different controls, not just a different layout: drop zones instead of the camera.
 */
export function useIsWide(): boolean {
  const [wide, setWide] = useState(matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(QUERY);
    const update = () => setWide(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return wide;
}
