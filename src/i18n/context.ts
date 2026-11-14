import { createContext, useContext } from 'react';
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

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
