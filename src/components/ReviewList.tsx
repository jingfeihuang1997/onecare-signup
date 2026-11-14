import type { ReactNode } from 'react';
import { Icon } from './Icon';

export interface ReviewRow {
  id: string;
  label: string;
  value: ReactNode;
  /** Opens this value for editing. Leave out for a value that cannot be changed here. */
  onClick?: () => void;
}

interface ReviewListProps {
  rows: readonly ReviewRow[];
}

/** Values readable without opening anything; tapping a row opens it for editing (SPEC 4.3). */
export function ReviewList({ rows }: ReviewListProps) {
  return (
    <div className="oc-review">
      {rows.map((row) => {
        const text = (
          <span className="oc-review__text">
            <span className="oc-review__label">{row.label}</span>
            <span className="oc-review__value">{row.value}</span>
          </span>
        );
        return row.onClick ? (
          <button type="button" className="oc-review__row" key={row.id} onClick={row.onClick}>
            {text}
            <span className="oc-chev">
              <Icon name="chevronRight" />
            </span>
          </button>
        ) : (
          <div className="oc-review__row" key={row.id}>
            {text}
          </div>
        );
      })}
    </div>
  );
}
