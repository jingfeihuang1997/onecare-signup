import { en, type StringKey } from './en';
import { entryText, type Dictionary } from './entry';
import { es } from './es';
import { zhHans } from './zh-Hans';

export type Language = 'en' | 'es' | 'zh-Hans';
export type Vars = Record<string, string | number>;
export type Translate = (key: StringKey, vars?: Vars) => string;

export const LANGUAGES: readonly Language[] = ['en', 'es', 'zh-Hans'];

/** Every dictionary has every key; a unit test and the Dictionary type both check it. */
export const DICTIONARIES: Record<Language, Dictionary> = {
  en,
  es,
  'zh-Hans': zhHans,
};

/**
 * Looks a string up in the chosen language and fills {placeholders}.
 *
 * A shell may name a copy variant. Then "key#variant" is used where the dictionary has it.
 * That is how option B says "Me" where option A says "Myself", without the section that
 * shows the text knowing which option it is in.
 */
export function translate(language: Language, key: StringKey, vars?: Vars, variant?: string): string {
  const variantKey = variant ? (`${key}#${variant}` as StringKey) : null;
  const useKey = variantKey && variantKey in en ? variantKey : key;
  // English is the safety net if a dictionary is ever edited by hand and loses a key.
  const template = entryText(DICTIONARIES[language][useKey] ?? en[useKey]);
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
