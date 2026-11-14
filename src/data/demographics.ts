import type { StringKey } from '../i18n';

// MOCK OPTION LISTS for "More about [name]" (SPEC 5.6). OneCare has not supplied the
// choices; the spreadsheet only says to include "Prefer not to say". The race list follows
// the US federal (OMB) categories. Replace both when OneCare confirms. See
// docs/TO-BE-VERIFIED.md.

export const SEX_OPTIONS: readonly { id: string; label: StringKey }[] = [
  { id: 'female', label: 'sex.female' },
  { id: 'male', label: 'sex.male' },
  { id: 'another', label: 'sex.another' },
  { id: 'prefer-not', label: 'sex.preferNot' },
];

export const RACE_OPTIONS: readonly { id: string; label: StringKey }[] = [
  { id: 'aian', label: 'race.aian' },
  { id: 'asian', label: 'race.asian' },
  { id: 'black', label: 'race.black' },
  { id: 'nhpi', label: 'race.nhpi' },
  { id: 'white', label: 'race.white' },
  { id: 'other', label: 'race.other' },
  { id: 'prefer-not', label: 'race.preferNot' },
];
