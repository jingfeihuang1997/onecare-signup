import { useI18n } from '../i18n';
import { cx } from './cx';
import { Icon } from './Icon';

export interface SectionNavItem {
  id: string;
  number: number;
  label: string;
  state: 'todo' | 'current' | 'done';
  /** Second line, for example "Done" or "You are here". The desktop side list leaves it out. */
  stateLabel?: string;
}

interface SectionNavProps {
  items: readonly SectionNavItem[];
  onSelect: (id: string) => void;
}

/** The list of sections: rows of the jump sheet and the desktop side list in option A. */
export function SectionNav({ items, onSelect }: SectionNavProps) {
  const { t } = useI18n();
  return (
    <nav className="oc-nav" aria-label={t('nav.sections')}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cx('oc-nav__item', item.state === 'current' && 'is-current')}
          aria-current={item.state === 'current' ? 'step' : undefined}
          onClick={() => onSelect(item.id)}
        >
          <span
            className={cx(
              'oc-panel__mark',
              item.state === 'done' && 'is-done',
              item.state === 'current' && 'is-current',
            )}
            aria-hidden="true"
          >
            {item.state === 'done' ? <Icon name="check" size={17} strokeWidth={3} /> : item.number}
          </span>
          <span className="oc-nav__text">
            <span>{item.label}</span>
            {item.stateLabel ? <span className="oc-nav__state">{item.stateLabel}</span> : null}
            {!item.stateLabel && item.state === 'done' ? (
              <span className="oc-sr">{t('nav.state.done')}</span>
            ) : null}
          </span>
        </button>
      ))}
    </nav>
  );
}
