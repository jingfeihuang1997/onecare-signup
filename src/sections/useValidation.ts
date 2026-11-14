import { useCallback, useState } from 'react';

/**
 * Shows field errors on blur and on Continue (never while the person is still typing a
 * field for the first time), and moves focus to the first field with an error.
 *
 * `errors` maps the id of each field's input to its message, or null when it is fine,
 * in the order the fields appear.
 */
export function useValidation<Field extends string>(errors: Record<Field, string | null>) {
  const [touched, setTouched] = useState<ReadonlySet<Field>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  /** Mark a field as visited, from its onBlur. */
  const touch = useCallback((field: Field) => {
    setTouched((current) => (current.has(field) ? current : new Set(current).add(field)));
  }, []);

  /** The message to show under a field right now. */
  const shown = (field: Field): string | undefined =>
    submitted || touched.has(field) ? (errors[field] ?? undefined) : undefined;

  /** For Continue: shows every error and focuses the first. Returns true when there is none. */
  const validate = (focusIds: Partial<Record<Field, string>> = {}): boolean => {
    setSubmitted(true);
    const first = (Object.keys(errors) as Field[]).find((field) => errors[field] !== null);
    if (!first) return true;
    document.getElementById(focusIds[first] ?? first)?.focus();
    return false;
  };

  const reset = useCallback(() => {
    setTouched(new Set());
    setSubmitted(false);
  }, []);

  return { shown, touch, validate, reset };
}
