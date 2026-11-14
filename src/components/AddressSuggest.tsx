import { useId, useState, type KeyboardEvent } from 'react';
import { useI18n } from '../i18n';
import { cx } from './cx';

export interface AddressSuggestion {
  id: string;
  /** Street line, for example "1420 Maple St". */
  main: string;
  /** City, state and ZIP. */
  sub: string;
}

interface AddressSuggestProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly AddressSuggestion[];
  onSelect: (suggestion: AddressSuggestion) => void;
}

/**
 * Address type-ahead as a combobox: focus stays in the input, the arrow keys move the
 * highlight, Enter picks, Escape hides the list.
 */
export function AddressSuggest({ label, value, onChange, suggestions, onSelect }: AddressSuggestProps) {
  const { t } = useI18n();
  const id = useId();
  const listId = `${id}-list`;
  const [highlight, setHighlight] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const open = suggestions.length > 0 && !dismissed;
  const active = open ? Math.min(highlight, suggestions.length - 1) : -1;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((active + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((active - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter') {
      const chosen = suggestions[active];
      if (chosen) {
        event.preventDefault();
        onSelect(chosen);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setDismissed(true);
    }
  };

  return (
    <div className="oc-stack oc-stack--tight">
      <div className="oc-field">
        <label className="oc-label" htmlFor={id}>
          {label}
        </label>
        <input
          className="oc-input"
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
          autoComplete="street-address"
          value={value}
          onChange={(event) => {
            setHighlight(0);
            setDismissed(false);
            onChange(event.target.value);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      <div
        className={cx('oc-suggest', !open && 'oc-sr')}
        id={listId}
        role="listbox"
        aria-label={t('address.suggestions')}
      >
        {open
          ? suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                role="option"
                id={`${id}-option-${index}`}
                tabIndex={-1}
                aria-selected={index === active}
                className={cx('oc-suggest__opt', index === active && 'is-active')}
                onClick={() => onSelect(suggestion)}
              >
                <span className="oc-suggest__main">{suggestion.main}</span>
                <span className="oc-suggest__sub">{suggestion.sub}</span>
              </button>
            ))
          : null}
      </div>
    </div>
  );
}
