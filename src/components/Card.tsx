import type { ReactNode } from 'react';
import { cx } from './cx';

interface CardProps {
  /** Small muted line above the title, for example "Vaccination clinic". */
  kicker?: string;
  title?: ReactNode;
  /** More room between children, for cards that hold controls. */
  gap?: boolean;
  children?: ReactNode;
}

/** White box for the clinic summary and other grouped content. */
export function Card({ kicker, title, gap = false, children }: CardProps) {
  return (
    <section className={cx('oc-card', gap && 'oc-card--gap')}>
      {kicker ? <span className="oc-card__kicker">{kicker}</span> : null}
      {title ? <span className="oc-card__title">{title}</span> : null}
      {children}
    </section>
  );
}
