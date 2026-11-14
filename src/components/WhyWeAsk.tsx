import type { ReactNode } from 'react';
import { useI18n } from '../i18n';
import { Disclosure } from './Disclosure';

interface WhyWeAskProps {
  /** The reasons. Leave out for a section that has none: only the divider is drawn. */
  children?: ReactNode;
}

/**
 * The row under every section title: "Why we ask" (folded), then a divider, then the
 * section body follows. Used by Panel, SubPanel and the step heading in option B.
 */
export function WhyWeAsk({ children }: WhyWeAskProps) {
  const { t } = useI18n();
  return (
    <div className="oc-why">
      {children ? (
        <Disclosure plain label={t('why.ask')}>
          {children}
        </Disclosure>
      ) : null}
      <hr className="oc-divider" />
    </div>
  );
}

export interface ReasonItem {
  field: string;
  reason: string;
}

interface ReasonListProps {
  items: readonly ReasonItem[];
  /** Marks the wording as a draft until OneCare approves it (SPEC 4.2). */
  draft?: boolean;
}

/** One reason per field, for the inside of a "Why we ask" row. */
export function ReasonList({ items, draft = false }: ReasonListProps) {
  const { t } = useI18n();
  return (
    <>
      {draft ? <p className="oc-small">{t('why.draftNote')}</p> : null}
      <dl className="oc-reasons">
        {items.map((item) => (
          <div className="oc-reasons__item" key={item.field}>
            <dt>{item.field}</dt>
            <dd>{item.reason}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
