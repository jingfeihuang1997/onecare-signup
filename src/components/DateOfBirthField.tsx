import { useId, type ReactNode } from 'react';
import { useI18n, type StringKey } from '../i18n';
import { cx } from './cx';
import { FieldError } from './Field';

export interface DateOfBirthValue {
  month: string;
  day: string;
  year: string;
}

interface DateOfBirthFieldProps {
  value: DateOfBirthValue;
  onChange: (value: DateOfBirthValue) => void;
  /** Replaces the default "Date of birth" legend. */
  legend?: string;
  error?: ReactNode;
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

/** Date of birth as three numeric inputs: month, day, year (SPEC 5.2). */
export function DateOfBirthField({ value, onChange, legend, error }: DateOfBirthFieldProps) {
  const { t } = useI18n();
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <fieldset
      className={cx('oc-fieldset', Boolean(error) && 'is-invalid')}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="oc-label">{legend ?? t('dob.legend')}</legend>
      <div className="oc-dob">
        {PARTS.map((part) => (
          <div className="oc-field" key={part.key}>
            <label className="oc-hint" htmlFor={`${id}-${part.key}`}>
              {t(part.label)}
            </label>
            <input
              className="oc-input"
              id={`${id}-${part.key}`}
              type="text"
              inputMode="numeric"
              autoComplete={part.autoComplete}
              placeholder={t(part.placeholder)}
              maxLength={part.maxLength}
              value={value[part.key]}
              aria-invalid={error ? true : undefined}
              onChange={(event) =>
                onChange({ ...value, [part.key]: event.target.value.replace(/\D/g, '') })
              }
            />
          </div>
        ))}
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}
