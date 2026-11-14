import { useId, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { Chip, type ChipTone } from './Chip';
import { cx } from './cx';
import { Icon } from './Icon';

interface VaccineRowProps {
  name: string;
  status: ChipTone;
  /** Chip text, for example "Due now" or "Had it · Sep 2024". */
  statusLabel: string;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** Current choice in one line (the product), shown while selected and folded. */
  pick?: ReactNode;
  /** Reminder shown while selected, for example the "had it" warning with Keep it / Remove. */
  reminder?: ReactNode;
  /** Details shown when expanded: last dose, product choice, the three folded rows. */
  children?: ReactNode;
}

/**
 * One vaccine. The checkbox selects it. Every row has the same chevron button, which
 * shows or hides the details. The pick line and the reminder are the row's current
 * state, not an expansion, so they do not count toward "one row expanded at a time".
 */
export function VaccineRow({
  name,
  status,
  statusLabel,
  selected,
  onSelectedChange,
  expanded,
  onExpandedChange,
  pick,
  reminder,
  children,
}: VaccineRowProps) {
  const { t } = useI18n();
  const bodyId = useId();
  return (
    <div className={cx('oc-vax', selected && 'is-selected')}>
      <div className="oc-vax__head">
        <label className="oc-vax__label">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelectedChange(event.target.checked)}
          />
          {/* The chip drops under the name when the row is too narrow for both. */}
          <span className="oc-vax__text">
            <span className="oc-vax__name">{name}</span>
            <Chip tone={status}>{statusLabel}</Chip>
          </span>
        </label>
        <button
          type="button"
          className="oc-vax__toggle"
          aria-label={t('vax.showDetails', { name })}
          aria-expanded={expanded}
          aria-controls={expanded ? bodyId : undefined}
          onClick={() => onExpandedChange(!expanded)}
        >
          <Icon name={expanded ? 'chevronUp' : 'chevronDown'} />
        </button>
      </div>
      {selected && !expanded && pick ? <p className="oc-vax__pick">{pick}</p> : null}
      {selected && reminder ? <div className="oc-vax__body">{reminder}</div> : null}
      {expanded ? (
        <div className="oc-vax__body" id={bodyId}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** The list that holds the rows. */
export function VaccineList({ children }: { children: ReactNode }) {
  return <div className="oc-vaxlist">{children}</div>;
}
