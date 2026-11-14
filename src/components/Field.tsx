import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { useI18n } from '../i18n';
import { cx } from './cx';
import { Icon } from './Icon';

interface FrameProps {
  label: ReactNode;
  /** Adds "(optional)" after the label. */
  optional?: boolean;
  hint?: ReactNode;
  /** Message under the field. Shown with an icon, so it does not rely on color. */
  error?: ReactNode;
}

interface FrameIds {
  id: string;
  describedBy: string | undefined;
}

function useFieldIds(givenId: string | undefined, hint: ReactNode, error: ReactNode): FrameIds {
  const autoId = useId();
  const id = givenId ?? autoId;
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
    undefined;
  return { id, describedBy };
}

function FieldFrame({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: FrameProps & { id: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className={cx('oc-field', Boolean(error) && 'is-invalid')}>
      <label className="oc-label" htmlFor={id}>
        {label}
        {optional ? (
          <>
            {' '}
            <span className="oc-optional">{t('field.optional')}</span>
          </>
        ) : null}
      </label>
      {children}
      {hint ? (
        <span className="oc-hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}

/** Error line with an icon. Also used by DateOfBirthField. */
export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className="oc-error" id={id}>
      <Icon name="alert" size={18} />
      <span>{children}</span>
    </p>
  );
}

export type FieldProps = FrameProps & {
  /** Narrow input for a few characters, such as the last 4 of the SSN. */
  short?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>;

/** Labelled text input with optional hint and error. */
export function Field({ label, optional, hint, error, short, id, ...input }: FieldProps) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldFrame id={ids.id} label={label} optional={optional} hint={hint} error={error}>
      <input
        type="text"
        {...input}
        id={ids.id}
        className={cx('oc-input', short && 'oc-input--short')}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
      />
    </FieldFrame>
  );
}

export type SelectFieldProps = FrameProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'>;

/** Labelled select with the same frame as Field. */
export function SelectField({
  label,
  optional,
  hint,
  error,
  id,
  children,
  ...select
}: SelectFieldProps) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldFrame id={ids.id} label={label} optional={optional} hint={hint} error={error}>
      <select
        {...select}
        id={ids.id}
        className="oc-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
      >
        {children}
      </select>
    </FieldFrame>
  );
}
