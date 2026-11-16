import { useId, useMemo, useRef, type ReactNode } from 'react';
import { useI18n, type StringKey } from '../i18n';
import type { DateOfBirth } from '../types';
import { cx } from './cx';
import { FieldError } from './Field';

export type DateOfBirthValue = DateOfBirth;

interface DateOfBirthFieldProps {
  value: DateOfBirthValue;
  onChange: (value: DateOfBirthValue) => void;
  /** Replaces the default "Date of birth" legend. */
  legend?: string;
  error?: ReactNode;
  /** Id of the group. The month list gets `${id}-month`, so focus can be sent to it. */
  id?: string;
  /** Called when focus leaves the whole group, not when it moves between its controls. */
  onBlur?: () => void;
}

interface Part {
  key: 'day' | 'year';
  label: StringKey;
  placeholder: StringKey;
  autoComplete: string;
  maxLength: number;
}

const PARTS: readonly Part[] = [
  { key: 'day', label: 'dob.day', placeholder: 'dob.dayPlaceholder', autoComplete: 'bday-day', maxLength: 2 },
  { key: 'year', label: 'dob.year', placeholder: 'dob.yearPlaceholder', autoComplete: 'bday-year', maxLength: 4 },
];

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));

/** "4" and "04" are the same month; anything else is no month. */
function monthValue(month: string): string {
  const number = Number(month);
  return Number.isInteger(number) && number >= 1 && number <= 12 ? String(number).padStart(2, '0') : '';
}

/**
 * Date of birth (SPEC 5.2 and 10.1, item 13): a list of month names, then day and year as
 * numeric inputs. When the day is complete, focus moves on to the year.
 */
export function DateOfBirthField({ value, onChange, legend, error, id, onBlur }: DateOfBirthFieldProps) {
  const { t, language } = useI18n();
  const autoId = useId();
  const groupId = id ?? autoId;
  const errorId = `${groupId}-error`;
  const inputs = useRef<Partial<Record<Part['key'], HTMLInputElement | null>>>({});

  const monthNames = useMemo(() => {
    const format = new Intl.DateTimeFormat(language, { month: 'long', timeZone: 'UTC' });
    return MONTHS.map((month, index) => ({ value: month, name: format.format(new Date(Date.UTC(2000, index, 1))) }));
  }, [language]);

  return (
    <fieldset
      className={cx('oc-fieldset', Boolean(error) && 'is-invalid')}
      id={groupId}
      aria-describedby={error ? errorId : undefined}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
      }}
    >
      <legend className="oc-label">{legend ?? t('dob.legend')}</legend>
      <div className="oc-dob">
        <div className="oc-field oc-dob__month">
          <label className="oc-hint" htmlFor={`${groupId}-month`}>
            {t('dob.month')}
          </label>
          <select
            className="oc-input"
            id={`${groupId}-month`}
            autoComplete="bday-month"
            value={monthValue(value.month)}
            aria-invalid={error ? true : undefined}
            onChange={(event) => onChange({ ...value, month: event.target.value })}
          >
            <option value="">{t('dob.monthPlaceholder')}</option>
            {monthNames.map((month) => (
              <option key={month.value} value={month.value}>
                {month.name}
              </option>
            ))}
          </select>
        </div>
        {PARTS.map((part, index) => (
          <div className="oc-field" key={part.key}>
            <label className="oc-hint" htmlFor={`${groupId}-${part.key}`}>
              {t(part.label)}
            </label>
            <input
              className="oc-input"
              id={`${groupId}-${part.key}`}
              ref={(element) => {
                inputs.current[part.key] = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={part.autoComplete}
              placeholder={t(part.placeholder)}
              // Only the last input has a hard limit: the day passes extra digits on.
              maxLength={index === PARTS.length - 1 ? part.maxLength : undefined}
              value={value[part.key]}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                // Digits beyond the day spill into the year, so typing fast or pasting
                // "121954" lands in the right inputs.
                let rest = event.target.value.replace(/\D/g, '');
                const next = { ...value };
                let last = index;
                for (let at = index; at < PARTS.length; at += 1) {
                  const target = PARTS[at];
                  if (!target) break;
                  next[target.key] = rest.slice(0, target.maxLength);
                  rest = rest.slice(target.maxLength);
                  last = at;
                  if (!rest) break;
                }
                onChange(next);
                const lastPart = PARTS[last];
                const after = PARTS[last + 1];
                const completed = lastPart && next[lastPart.key].length === lastPart.maxLength;
                // Move on only when this change completed a part, not on every edit.
                const grew = lastPart && next[lastPart.key] !== value[lastPart.key];
                const focusOn = completed && grew && after ? after : last !== index ? lastPart : null;
                if (focusOn) inputs.current[focusOn.key]?.focus();
              }}
            />
          </div>
        ))}
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}
