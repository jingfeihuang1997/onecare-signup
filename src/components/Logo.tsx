/**
 * The OneCare mark: four rounded tiles on a transparent background, in the text colour,
 * with the top right tile turned on its corner. Decorative, because the name "OneCare" is
 * always written next to it. The same drawing is in public/favicon.svg.
 */
export function Logo() {
  return (
    <svg className="oc-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <rect x="0.5" y="0.5" width="10" height="10" rx="2.4" />
      <rect x="13.65" y="2.15" width="8.2" height="8.2" rx="2" transform="rotate(45 17.75 6.25)" />
      <rect x="0.5" y="13.5" width="10" height="10" rx="2.4" />
      <rect x="13.5" y="13.5" width="10" height="10" rx="2.4" />
    </svg>
  );
}
