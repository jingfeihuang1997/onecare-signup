import { useEffect } from 'react';

/** Names the browser tab after the screen, so each page has its own title (WCAG 2.4.2). */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
