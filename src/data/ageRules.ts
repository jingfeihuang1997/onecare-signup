import type { VaccineId } from '../types';

/** Ages, in whole years on the clinic date, at which a vaccine is shown. Both ends included. */
export interface AgeRule {
  minAge?: number;
  maxAge?: number;
}

export type AgeRules = Partial<Record<VaccineId, AgeRule>>;

// MOCK RULES. SPEC 5.3 says: "Age rules are config, not hard-coded: [rules to be supplied
// by OneCare]." These values are placeholders, chosen only so that the reference scenario
// works (at age 72: DTaP, Hib, Rotavirus and HPV are not offered) and so that every vaccine
// can be reached by changing the patient's age. They are not clinical guidance.
// Replace this object when OneCare supplies the rules. Tracked in docs/TO-BE-VERIFIED.md.
export const MOCK_AGE_RULES: AgeRules = {
  dtap: { maxAge: 6 },
  hib: { maxAge: 4 },
  rotavirus: { maxAge: 0 },
  hpv: { minAge: 9, maxAge: 45 },
  tdap: { minAge: 7 },
  shingles: { minAge: 50 },
  rsv: { minAge: 60 },
};

export function isAllowedAtAge(rules: AgeRules, vaccineId: VaccineId, age: number): boolean {
  const rule = rules[vaccineId];
  if (!rule) return true;
  if (rule.minAge !== undefined && age < rule.minAge) return false;
  if (rule.maxAge !== undefined && age > rule.maxAge) return false;
  return true;
}
