import type { ReactNode } from 'react';
import { useI18n } from '../i18n';

interface PassProps {
  children: ReactNode;
}

/** Option B: the clinic pass. Its parts are separated by dashed tear lines. */
export function Pass({ children }: PassProps) {
  const { t } = useI18n();
  return (
    <section className="oc-pass" aria-label={t('pass.aria')}>
      {children}
    </section>
  );
}

interface PassPartProps {
  /** Small spaced-out label, for example "CLINIC PASS". */
  label?: string;
  title?: ReactNode;
  children?: ReactNode;
}

export function PassPart({ label, title, children }: PassPartProps) {
  return (
    <div className="oc-pass__part">
      {label ? <span className="oc-pass__label">{label}</span> : null}
      {title ? <span className="oc-pass__title">{title}</span> : null}
      {children}
    </div>
  );
}
