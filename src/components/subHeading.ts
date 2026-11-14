import { createContext, useContext } from 'react';

/**
 * The heading level for parts inside a section: 3 under an option A panel (an h2), 2 under
 * an option B step heading (an h1). The shell sets it, so levels never skip.
 */
export const SubHeadingContext = createContext<2 | 3>(3);

export function useSubHeading(): 'h2' | 'h3' {
  return useContext(SubHeadingContext) === 2 ? 'h2' : 'h3';
}
