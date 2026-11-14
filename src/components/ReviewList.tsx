import type { ReactNode } from 'react';
import { Icon } from './Icon';

export interface ReviewRow {
  id: string;
  label: string;
  value: ReactNode;
  /** Opens this value for editing. */
  onClick: () => void;
}

interface ReviewListProps {
  rows: readonly ReviewRow[];
}

/** Values readable without opening anything; tapping a row opens it for editing (SPEC 4.3). */
export function ReviewList({ rows }: ReviewListProps) {
  return (
    <div className="oc-review">
      {rows.map((row) => (
        <button type="button" className="oc-review__row" key={row.id} onClick={row.onClick}>
          <span className="oc-review__text">
            <span className="oc-review__label">{row.label}</span>
            <span className="oc-review__value">{row.value}</span>
          </span>
          <span className="oc-chev">
            <Icon name="chevronRight" />
          </span>
        </button>
      ))}
    </div>
  );
}
