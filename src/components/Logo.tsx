/**
 * The OneCare mark: four rounded tiles on a transparent background, in the text colour.
 * The top right tile is tilted a little and sits slightly higher than the others.
 * Decorative, because the name "OneCare" is always written next to it. The same drawing
 * is in public/favicon.svg.
 */
export function Logo() {
  return (
    <svg className="oc-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <rect x="0.6" y="1.4" width="11" height="11" rx="3" />
      <rect x="12.2" y="1" width="11" height="11" rx="3" transform="rotate(8 17.7 6.5)" />
      <rect x="0.6" y="13" width="11" height="11" rx="3" />
      <rect x="12.2" y="13" width="11" height="11" rx="3" />
    </svg>
  );
}
