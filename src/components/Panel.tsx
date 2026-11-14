import { useId, type ReactNode, type Ref } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { WhyWeAsk } from './WhyWeAsk';

interface PanelProps {
  /** Number shown in the mark until the section is done. */
  number: number;
  title: string;
  /** Small label after the title, for example "Optional". */
  tag?: string;
  /** One line shown while folded. A folded panel is the review of its section. */
  summary?: ReactNode;
  done?: boolean;
  open: boolean;
  onToggle: () => void;
  /** Content of the "Why we ask" row under the title. */
  why?: ReactNode;
  id?: string;
  /** The head button, so the shell can move focus to the panel's heading when it opens. */
  headRef?: Ref<HTMLButtonElement>;
  children?: ReactNode;
}

/**
 * Option A section. The whole head is one button that opens the panel for editing;
 * there is no separate Edit button. Open: title, "Why we ask", divider, then the body.
 */
export function Panel({
  number,
  title,
  tag,
  summary,
  done = false,
  open,
  onToggle,
  why,
  id,
  headRef,
  children,
}: PanelProps) {
  const bodyId = useId();
  const showCheck = done && !open;
  return (
    <section className={cx('oc-panel', open && 'is-open', showCheck && 'is-done')} id={id}>
      <h2 className="oc-panel__h">
        <button
          type="button"
          className="oc-panel__head"
          ref={headRef}
          aria-expanded={open}
          aria-controls={open ? bodyId : undefined}
          onClick={onToggle}
        >
          <span className="oc-panel__mark" aria-hidden="true">
            {showCheck ? <Icon name="check" size={17} strokeWidth={3} /> : number}
          </span>
          <span className="oc-panel__text">
            <span className="oc-panel__title">
              {title}
              {tag ? (
                <>
                  {' '}
                  <span className="oc-tag">{tag}</span>
                </>
              ) : null}
            </span>
            {!open && summary ? <span className="oc-panel__sum">{summary}</span> : null}
          </span>
          <span className="oc-chev">
            <Icon name={open ? 'chevronUp' : 'chevronDown'} />
          </span>
        </button>
      </h2>
      {open ? (
        <div className="oc-panel__body" id={bodyId}>
          <WhyWeAsk>{why}</WhyWeAsk>
          {children}
        </div>
      ) : null}
    </section>
  );
}
