import { createContext, useContext, useMemo } from 'react';
import { translate, type Language, type Translate } from './translate';

export interface I18nValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translate;
}

// Without a provider, components render in English. That keeps unit tests short.
export const I18nContext = createContext<I18nValue>({
  language: 'en',
  setLanguage: () => undefined,
  t: (key, vars) => translate('en', key, vars),
});

/** Set by a shell to choose its copy variant, for example "pass" in option B. */
export const CopyVariantContext = createContext<string | undefined>(undefined);

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  const variant = useContext(CopyVariantContext);
  return useMemo<I18nValue>(
    () =>
      variant
        ? { ...value, t: (key, vars) => translate(value.language, key, vars, variant) }
        : value,
    [value, variant],
  );
}
