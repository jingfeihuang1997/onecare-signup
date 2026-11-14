import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, type I18nValue } from './context';
import { translate, type Language } from './translate';

interface Props {
  initialLanguage?: Language;
  /** Called when the person picks a language, so the choice can be remembered. */
  onChange?: (language: Language) => void;
  children: ReactNode;
}

/** Holds the chosen language and sets it on <html lang> (SPEC 4.6). */
export function I18nProvider({ initialLanguage = 'en', onChange, children }: Props) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(
    (next: Language) => {
      setLanguageState(next);
      onChange?.(next);
    },
    [onChange],
  );

  const value = useMemo<I18nValue>(
    () => ({ language, setLanguage, t: (key, vars) => translate(language, key, vars) }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
