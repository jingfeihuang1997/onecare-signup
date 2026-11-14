import { useI18n } from '../i18n';
import { cx } from './cx';
import { Icon } from './Icon';

export type StampState = 'todo' | 'current' | 'done';

export interface StampItem {
  id: string;
  label: string;
  /** What an unfinished stamp shows: "1", "2", or "+" for the optional step. */
  mark: string;
  state: StampState;
}

interface StampsProps {
  items: readonly StampItem[];
  /** Inside the pass: no card around the row. */
  flat?: boolean;
}

/** Option B: one stamp per step. Done stamps are filled and tilted. */
export function Stamps({ items, flat = false }: StampsProps) {
  const { t } = useI18n();
  const currentIndex = items.findIndex((item) => item.state === 'current');
  const allDone = items.length > 0 && items.every((item) => item.state === 'done');
  const label = allDone
    ? t('stamps.allDone')
    : t('stamps.progress', { current: Math.max(currentIndex, 0) + 1, total: items.length });

  return (
    <nav className={cx('oc-stamps', flat && 'oc-stamps--flat')} aria-label={label}>
      {items.map((item) => (
        <div
          key={item.id}
          className={cx(
            'oc-stamp',
            item.state === 'done' && 'is-done',
            item.state === 'current' && 'is-current',
          )}
          aria-current={item.state === 'current' ? 'step' : undefined}
        >
          <span className="oc-stamp__mark" aria-hidden="true">
            {item.state === 'done' ? <Icon name="check" size={18} strokeWidth={3} /> : item.mark}
          </span>
          <span>{item.label}</span>
          {item.state === 'done' ? <span className="oc-sr">{t('stamps.done')}</span> : null}
        </div>
      ))}
    </nav>
  );
}
