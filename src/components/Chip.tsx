import type { ReactNode } from 'react';
import { cx } from './cx';

export type ChipTone = 'due' | 'had' | 'none';

interface ChipProps {
  /** Vaccine status: due now, had it, or no record. */
  tone?: ChipTone;
  children: ReactNode;
}

export function Chip({ tone = 'none', children }: ChipProps) {
  return (
    <span
      className={cx('oc-chip', tone === 'due' && 'oc-chip--due', tone === 'had' && 'oc-chip--had')}
    >
      {children}
    </span>
  );
}
