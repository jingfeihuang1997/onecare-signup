import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, type I18nValue } from './context';
import { translate, type Language } from './translate';

interface Props {
  initialLanguage?: Language;
  children: ReactNode;
}

/** Holds the chosen language and sets it on <html lang> (SPEC 4.6). */
export function I18nProvider({ initialLanguage = 'en', children }: Props) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nValue>(
    () => ({ language, setLanguage, t: (key, vars) => translate(language, key, vars) }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
