import { useId, useRef, type ReactNode } from 'react';
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
  /** Id of the group. The month input gets `${id}-month`, so focus can be sent to it. */
  id?: string;
  /** Called when focus leaves the whole group, not when it moves between its inputs. */
  onBlur?: () => void;
}

interface Part {
  key: keyof DateOfBirthValue;
  label: StringKey;
  placeholder: StringKey;
  autoComplete: string;
  maxLength: number;
}

const PARTS: readonly Part[] = [
  { key: 'month', label: 'dob.month', placeholder: 'dob.monthPlaceholder', autoComplete: 'bday-month', maxLength: 2 },
  { key: 'day', label: 'dob.day', placeholder: 'dob.dayPlaceholder', autoComplete: 'bday-day', maxLength: 2 },
  { key: 'year', label: 'dob.year', placeholder: 'dob.yearPlaceholder', autoComplete: 'bday-year', maxLength: 4 },
];

/**
 * Date of birth as three numeric inputs: month, day, year (SPEC 5.2). When month or day
 * is complete, focus moves on to the next input.
 */
export function DateOfBirthField({ value, onChange, legend, error, id, onBlur }: DateOfBirthFieldProps) {
  const { t } = useI18n();
  const autoId = useId();
  const groupId = id ?? autoId;
  const errorId = `${groupId}-error`;
  const inputs = useRef<Partial<Record<keyof DateOfBirthValue, HTMLInputElement | null>>>({});

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
              // Only the last input has a hard limit: the others pass extra digits on.
              maxLength={index === PARTS.length - 1 ? part.maxLength : undefined}
              value={value[part.key]}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                // Digits beyond this part spill into the next ones, so typing fast, pasting
                // "04121954" or autofill all land in the right inputs.
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
