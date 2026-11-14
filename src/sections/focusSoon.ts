/**
 * Moves focus to an element once React has finished the update in progress. Used when
 * the control that was just pressed disappears, so keyboard and screen-reader users are
 * not left with focus on nothing.
 */
export function focusSoon(id: string): void {
  setTimeout(() => document.getElementById(id)?.focus(), 0);
}
