import type {
  AddressSuggestion,
  CardReading,
  Clinic,
  DateOfBirth,
  Helper,
  MaskedRecord,
  Pharmacy,
  VaccineStatus,
} from '../types';
import { VACCINE_IDS } from './vaccines';

// Seed data for the mock services. It reproduces the reference scenario of SPEC section 8:
// Ana Lopez signing up her mother Maria Lopez, born Apr 12, 1954, at Cedar Lane Pharmacy,
// Tue, Dec 1, 2026 at 10:00 AM. Every person and number here is made up.

export const SEED_PHARMACY: Pharmacy = {
  id: 'cedar-lane',
  name: 'Cedar Lane Pharmacy',
  phone: '[pharmacy phone]',
  state: 'MI',
  registry: 'MCIR',
  productChoice: true,
};

export const SEED_CLINIC: Clinic = {
  token: 'cedar-lane-2026-12-01',
  pharmacy: SEED_PHARMACY,
  date: '2026-12-01',
  time: '10:00',
  timeZone: 'America/Detroit',
  address: '[Clinic address]',
  offeredVaccines: [...VACCINE_IDS],
  productChoice: null,
};

/** A patient the pharmacy already knows. */
export interface SeedRecord {
  firstName: string;
  lastName: string;
  dob: DateOfBirth;
  record: MaskedRecord;
  statuses: VaccineStatus[];
}

const MARIA_STATUSES: VaccineStatus[] = [
  { vaccineId: 'flu', status: 'due', lastDate: '2025-10-14', lastProductId: 'fluzone-hd' },
  { vaccineId: 'covid', status: 'due', lastDate: '2025-10-14', lastProductId: 'spikevax' },
  { vaccineId: 'rsv', status: 'had', lastDate: '2024-09-20', lastProductId: null },
  { vaccineId: 'tdap', status: 'had', lastDate: '2019-06-03', lastProductId: null },
  { vaccineId: 'shingles', status: 'had', lastDate: '2023-07-18', lastProductId: null },
  { vaccineId: 'pneumococcal', status: 'had', lastDate: '2025-03-11', lastProductId: null },
];

export const SEED_MARIA: SeedRecord = {
  firstName: 'Maria',
  lastName: 'Lopez',
  dob: { month: '04', day: '12', year: '1954' },
  record: {
    patientId: 'patient-maria-lopez',
    address: '•••• Maple St, Ann Arbor, MI ••104',
    phone: '(•••) •••-0142',
    insurance: { kind: 'medicare', ending: 'K73' },
  },
  statuses: MARIA_STATUSES,
};

export const SEED_RECORDS: readonly SeedRecord[] = [SEED_MARIA];

/** The helper in the reference scenario. */
export const SEED_HELPER: Helper = {
  firstName: 'Ana',
  lastName: 'Lopez',
  relationship: 'child',
  relationshipOther: '',
  phone: '(313) 555-0142',
};

/** The second seed patient: the pharmacy has no record of him (SPEC section 8). */
export const SEED_NEW_PATIENT: { firstName: string; lastName: string; dob: DateOfBirth } = {
  firstName: 'Daniel',
  lastName: 'Brooks',
  dob: { month: '09', day: '23', year: '1988' },
};

/** What the mock card reader returns. One field per side has a low confidence on purpose. */
export const SEED_CARD_READINGS: Record<'medicare' | 'other', Record<'front' | 'back', CardReading>> = {
  medicare: {
    front: {
      side: 'front',
      fields: { medicareNumber: { value: '1EG4-TE5-MK73', confidence: 0.96 } },
    },
    back: { side: 'back', fields: {} },
  },
  other: {
    front: {
      side: 'front',
      fields: {
        company: { value: 'Sample Health Plan', confidence: 0.97 },
        planName: { value: 'Sample PPO', confidence: 0.91 },
        memberId: { value: 'SMP000123456', confidence: 0.94 },
        groupId: { value: '0001234', confidence: 0.58 },
      },
    },
    back: {
      side: 'back',
      fields: {
        bin: { value: '000000', confidence: 0.93 },
        pcn: { value: 'SAMPLE', confidence: 0.61 },
      },
    },
  },
};

/** Small local list for the address type-ahead. US addresses only (SPEC 5.6). */
export const SEED_ADDRESSES: readonly AddressSuggestion[] = [
  { id: 'addr-1', street: '1420 Maple St', city: 'Ann Arbor', state: 'MI', zip: '48104' },
  { id: 'addr-2', street: '1420 Maple Rd', city: 'Troy', state: 'MI', zip: '48084' },
  { id: 'addr-3', street: '1420 Maple Ave', city: 'Kalamazoo', state: 'MI', zip: '49008' },
  { id: 'addr-4', street: '1420 Maplewood Dr', city: 'Lansing', state: 'MI', zip: '48910' },
  { id: 'addr-5', street: '1420 Maple Ln', city: 'Grand Rapids', state: 'MI', zip: '49503' },
  { id: 'addr-6', street: '1420 Maple Ct', city: 'Flint', state: 'MI', zip: '48503' },
  { id: 'addr-7', street: '88 Cedar Lane', city: 'Ann Arbor', state: 'MI', zip: '48105' },
  { id: 'addr-8', street: '305 Oak St', city: 'Ypsilanti', state: 'MI', zip: '48197' },
  { id: 'addr-9', street: '2210 Washtenaw Ave', city: 'Ann Arbor', state: 'MI', zip: '48104' },
  { id: 'addr-10', street: '57 Birch Rd', city: 'Dearborn', state: 'MI', zip: '48124' },
  { id: 'addr-11', street: '940 Lakeview Dr', city: 'Toledo', state: 'OH', zip: '43606' },
  { id: 'addr-12', street: '16 Elm Ct', city: 'Detroit', state: 'MI', zip: '48201' },
];
