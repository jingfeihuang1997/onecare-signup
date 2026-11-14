import { useId, type ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { WhyWeAsk } from './WhyWeAsk';

interface SubPanelProps {
  title: string;
  /** One line shown while folded. */
  summary?: ReactNode;
  open?: boolean;
  /** Folds or unfolds the sub-panel; with `drill`, opens the separate view. */
  onToggle: () => void;
  /** The head leads to its own view (health questions) instead of unfolding in place. */
  drill?: boolean;
  /** Content of the "Why we ask" row under the title. */
  why?: ReactNode;
  children?: ReactNode;
}

/** A panel inside "Save time at the clinic": no number, lighter border. */
export function SubPanel({
  title,
  summary,
  open = false,
  onToggle,
  drill = false,
  why,
  children,
}: SubPanelProps) {
  const bodyId = useId();
  const expanded = open && !drill;
  return (
    <section className={cx('oc-panel', 'oc-panel--sub', expanded && 'is-open')}>
      <h3 className="oc-panel__h">
        <button
          type="button"
          className="oc-panel__head"
          aria-expanded={drill ? undefined : expanded}
          aria-controls={expanded ? bodyId : undefined}
          onClick={onToggle}
        >
          <span className="oc-panel__text">
            <span className="oc-panel__title">{title}</span>
            {!expanded && summary ? <span className="oc-panel__sum">{summary}</span> : null}
          </span>
          <span className="oc-chev">
            <Icon name={drill ? 'chevronRight' : expanded ? 'chevronUp' : 'chevronDown'} />
          </span>
        </button>
      </h3>
      {expanded ? (
        <div className="oc-panel__body" id={bodyId}>
          <WhyWeAsk>{why}</WhyWeAsk>
          {children}
        </div>
      ) : null}
    </section>
  );
}
