import { en, type StringKey } from './en';
import { es } from './es';
import { zhHans } from './zh-Hans';

export type Language = 'en' | 'es' | 'zh-Hans';
export type Vars = Record<string, string | number>;
export type Translate = (key: StringKey, vars?: Vars) => string;

export const LANGUAGES: readonly Language[] = ['en', 'es', 'zh-Hans'];

const dictionaries: Record<Language, Partial<Record<StringKey, string>>> = {
  en,
  es,
  'zh-Hans': zhHans,
};

/** Looks a string up in the chosen language, falls back to English, and fills {placeholders}. */
export function translate(language: Language, key: StringKey, vars?: Vars): string {
  const template = dictionaries[language][key] ?? en[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
