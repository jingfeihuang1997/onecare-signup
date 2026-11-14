import type { ReactNode } from 'react';
import { cx } from './cx';

interface NoteProps {
  /** Amber notice with a border, for something to double-check. It never blocks. */
  warn?: boolean;
  children: ReactNode;
}

export function Note({ warn = false, children }: NoteProps) {
  return <p className={cx('oc-note', warn && 'oc-note--warn')}>{children}</p>;
}
