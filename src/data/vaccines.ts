import type { Vaccine, VaccineId } from '../types';

// The 16 vaccines of SPEC 5.3. Names and "Why it matters" copy are in the dictionaries
// (vaccine.<id>.name, vaccine.<id>.short, vaccine.<id>.why).
//
// displayOrder is the tie-break after the status sort. It reproduces the order of
// docs/reference/A05-Vaccines.html (SPEC 10.2).
//
// MOCK: the product lists are samples so the product choice can be shown. Which products
// a clinic stocks is not defined yet. See docs/TO-BE-VERIFIED.md.
export const VACCINES: readonly Vaccine[] = [
  {
    id: 'flu',
    displayOrder: 1,
    products: [
      { id: 'fluzone-hd', name: 'Fluzone High-Dose', shortName: 'Fluzone High-Dose', suggestedFromAge: 65 },
      { id: 'fluad', name: 'Fluad', shortName: 'Fluad', suggestedFromAge: 65 },
      { id: 'flublok', name: 'Flublok', shortName: 'Flublok' },
      { id: 'fluzone', name: 'Fluzone', shortName: 'Fluzone' },
    ],
  },
  {
    id: 'covid',
    displayOrder: 2,
    products: [
      { id: 'spikevax', name: 'Spikevax (Moderna)', shortName: 'Spikevax' },
      { id: 'comirnaty', name: 'Comirnaty (Pfizer)', shortName: 'Comirnaty' },
      { id: 'nuvaxovid', name: 'Nuvaxovid (Novavax)', shortName: 'Nuvaxovid' },
    ],
  },
  { id: 'rsv', displayOrder: 3, products: [] },
  { id: 'tdap', displayOrder: 4, products: [] },
  { id: 'shingles', displayOrder: 5, products: [] },
  { id: 'pneumococcal', displayOrder: 6, products: [] },
  { id: 'hepb', displayOrder: 7, products: [] },
  { id: 'hepa', displayOrder: 8, products: [] },
  { id: 'mmr', displayOrder: 9, products: [] },
  { id: 'varicella', displayOrder: 10, products: [] },
  { id: 'polio', displayOrder: 11, products: [] },
  { id: 'menacwy', displayOrder: 12, products: [] },
  { id: 'dtap', displayOrder: 13, products: [] },
  { id: 'hib', displayOrder: 14, products: [] },
  { id: 'rotavirus', displayOrder: 15, products: [] },
  { id: 'hpv', displayOrder: 16, products: [] },
];

export const VACCINE_IDS: readonly VaccineId[] = VACCINES.map((vaccine) => vaccine.id);

const BY_ID = new Map(VACCINES.map((vaccine) => [vaccine.id, vaccine]));

export function getVaccine(id: VaccineId): Vaccine {
  const vaccine = BY_ID.get(id);
  if (!vaccine) throw new Error(`Unknown vaccine: ${id}`);
  return vaccine;
}
