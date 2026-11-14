import { SEED_ADDRESSES, SEED_CARD_READINGS, SEED_CLINIC, SEED_RECORDS } from '../data/seed';
import { VACCINE_IDS } from '../data/vaccines';
import type { AddressSuggestion, DateOfBirth, VaccineStatus } from '../types';
import type { SignupServices } from './types';

interface MockOptions {
  /** How long each call takes. Tests pass 0. */
  delayMs?: number;
}

const MAX_SUGGESTIONS = 5;
const MIN_QUERY_LENGTH = 3;

// MOCK: so the type-ahead answers any street a tester types, not only the seed list, a
// house number plus a street name is completed with a few Michigan cities. A real address
// service replaces this (see docs/TO-BE-VERIFIED.md).
const MOCK_CITIES = [
  { city: 'Ann Arbor', state: 'MI', zip: '48104' },
  { city: 'Ypsilanti', state: 'MI', zip: '48197' },
  { city: 'Detroit', state: 'MI', zip: '48201' },
  { city: 'Lansing', state: 'MI', zip: '48910' },
  { city: 'Grand Rapids', state: 'MI', zip: '49503' },
];
const STREET_SUFFIX = /\b(st|street|rd|road|ave|avenue|dr|drive|ln|lane|ct|court|blvd|way|pl|place|pkwy|hwy)\.?$/i;

function completeStreet(query: string): AddressSuggestion[] {
  const match = /^(\d{1,6})\s+([a-z][a-z .'-]{1,40})$/i.exec(query.trim().replace(/,+$/, ''));
  if (!match) return [];
  const name = (match[2] ?? '')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const street = `${match[1]} ${STREET_SUFFIX.test(name) ? name : `${name} St`}`;
  return MOCK_CITIES.map((place, index) => ({ id: `typed-${index}`, street, ...place }));
}

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function sameDate(a: DateOfBirth, b: DateOfBirth): boolean {
  return (
    Number(a.month) === Number(b.month) &&
    Number(a.day) === Number(b.day) &&
    Number(a.year) === Number(b.year)
  );
}

/**
 * Mock services backed by the seed data. No network: nothing here calls a real endpoint.
 * Results are copies, so callers cannot change the seed.
 */
export function createMockServices({ delayMs = 250 }: MockOptions = {}): SignupServices {
  const respond = <T>(value: T): Promise<T> =>
    new Promise((resolve) => {
      setTimeout(() => resolve(structuredClone(value)), delayMs);
    });

  const fail = (message: string): Promise<never> =>
    new Promise<never>((_resolve, reject) => {
      setTimeout(() => reject(new Error(message)), delayMs);
    });

  let submissions = 0;

  return {
    getClinic(token) {
      if (token !== SEED_CLINIC.token) return fail(`No clinic for token "${token}"`);
      return respond(SEED_CLINIC);
    },

    lookupPatient(firstName, lastName, dob) {
      const match = SEED_RECORDS.find(
        (record) =>
          sameText(record.firstName, firstName) &&
          sameText(record.lastName, lastName) &&
          sameDate(record.dob, dob),
      );
      return respond(
        match ? { found: true, maskedRecord: match.record } : { found: false, maskedRecord: null },
      );
    },

    getVaccineStatus(patientId) {
      const known = SEED_RECORDS.find((record) => record.record.patientId === patientId);
      const statuses: VaccineStatus[] = VACCINE_IDS.map(
        (vaccineId) =>
          known?.statuses.find((status) => status.vaccineId === vaccineId) ?? {
            vaccineId,
            status: 'none',
            lastDate: null,
            lastProductId: null,
          },
      );
      return respond(statuses);
    },

    readCard(_image, side, expect = 'other') {
      return respond(SEED_CARD_READINGS[expect][side]);
    },

    searchAddress(query) {
      const text = query.trim().toLowerCase();
      if (text.length < MIN_QUERY_LENGTH) return respond([]);
      const matches = SEED_ADDRESSES.filter((address) =>
        `${address.street}, ${address.city}, ${address.state} ${address.zip}`
          .toLowerCase()
          .includes(text),
      );
      return respond([...matches, ...completeStreet(query)].slice(0, MAX_SUGGESTIONS));
    },

    submitSignup(draft) {
      if (!draft.signature) return fail('The sign-up is not signed');
      submissions += 1;
      return respond({ confirmationId: `OC-MOCK-${String(submissions).padStart(4, '0')}` });
    },
  };
}
