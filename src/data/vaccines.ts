import type { StringKey } from '../i18n';
import type { Vaccine, VaccineId, VaccineProduct } from '../types';

// The 16 vaccines of SPEC 5.3. Names and "Why it matters" copy are in the dictionaries
// (vaccine.<id>.name, vaccine.<id>.short, vaccine.<id>.why).
//
// displayOrder is the tie-break after the status sort. It reproduces the order of
// docs/reference/A05-Vaccines.html (SPEC 10.2).
//
// DRAFT: the product lists and the one-line note under each product
// (product.<id>.details in the dictionaries) were written by Claude from general knowledge
// of vaccines licensed in the United States (SPEC 10.1, item 23). They are not clinical
// guidance, and which products a clinic stocks is not defined yet. See docs/TO-BE-VERIFIED.md.

function product(id: string, name: string, shortName: string, suggestedFromAge?: number): VaccineProduct {
  // data.test.ts checks that every one of these keys exists in the dictionaries.
  return { id, name, shortName, details: `product.${id}.details` as StringKey, suggestedFromAge };
}

export const VACCINES: readonly Vaccine[] = [
  {
    id: 'flu',
    displayOrder: 1,
    products: [
      product('fluzone-hd', 'Fluzone High-Dose', 'Fluzone High-Dose', 65),
      product('fluad', 'Fluad', 'Fluad', 65),
      product('flublok', 'Flublok', 'Flublok'),
      product('fluzone', 'Fluzone', 'Fluzone'),
    ],
  },
  {
    id: 'covid',
    displayOrder: 2,
    products: [
      product('spikevax', 'Spikevax (Moderna)', 'Spikevax'),
      product('comirnaty', 'Comirnaty (Pfizer)', 'Comirnaty'),
      product('nuvaxovid', 'Nuvaxovid (Novavax)', 'Nuvaxovid'),
    ],
  },
  {
    id: 'rsv',
    displayOrder: 3,
    products: [
      product('arexvy', 'Arexvy (GSK)', 'Arexvy'),
      product('abrysvo', 'Abrysvo (Pfizer)', 'Abrysvo'),
      product('mresvia', 'mResvia (Moderna)', 'mResvia'),
    ],
  },
  {
    id: 'tdap',
    displayOrder: 4,
    products: [
      product('boostrix', 'Boostrix (GSK)', 'Boostrix'),
      product('adacel', 'Adacel (Sanofi)', 'Adacel'),
    ],
  },
  {
    id: 'shingles',
    displayOrder: 5,
    products: [
      product('shingrix', 'Shingrix (GSK)', 'Shingrix'),
    ],
  },
  {
    id: 'pneumococcal',
    displayOrder: 6,
    products: [
      product('prevnar20', 'Prevnar 20 (Pfizer)', 'Prevnar 20'),
      product('capvaxive', 'Capvaxive (Merck)', 'Capvaxive'),
      product('vaxneuvance', 'Vaxneuvance (Merck)', 'Vaxneuvance'),
      product('pneumovax23', 'Pneumovax 23 (Merck)', 'Pneumovax 23'),
    ],
  },
  {
    id: 'hepb',
    displayOrder: 7,
    products: [
      product('heplisav-b', 'Heplisav-B (Dynavax)', 'Heplisav-B'),
      product('engerix-b', 'Engerix-B (GSK)', 'Engerix-B'),
      product('recombivax-hb', 'Recombivax HB (Merck)', 'Recombivax HB'),
    ],
  },
  {
    id: 'hepa',
    displayOrder: 8,
    products: [
      product('havrix', 'Havrix (GSK)', 'Havrix'),
      product('vaqta', 'Vaqta (Merck)', 'Vaqta'),
    ],
  },
  {
    id: 'mmr',
    displayOrder: 9,
    products: [
      product('mmr-ii', 'M-M-R II (Merck)', 'M-M-R II'),
      product('priorix', 'Priorix (GSK)', 'Priorix'),
    ],
  },
  {
    id: 'varicella',
    displayOrder: 10,
    products: [
      product('varivax', 'Varivax (Merck)', 'Varivax'),
    ],
  },
  {
    id: 'polio',
    displayOrder: 11,
    products: [
      product('ipol', 'IPOL (Sanofi)', 'IPOL'),
    ],
  },
  {
    id: 'menacwy',
    displayOrder: 12,
    products: [
      product('menquadfi', 'MenQuadfi (Sanofi)', 'MenQuadfi'),
      product('menveo', 'Menveo (GSK)', 'Menveo'),
    ],
  },
  {
    id: 'dtap',
    displayOrder: 13,
    products: [
      product('daptacel', 'Daptacel (Sanofi)', 'Daptacel'),
      product('infanrix', 'Infanrix (GSK)', 'Infanrix'),
    ],
  },
  {
    id: 'hib',
    displayOrder: 14,
    products: [
      product('acthib', 'ActHIB (Sanofi)', 'ActHIB'),
      product('pedvaxhib', 'PedvaxHIB (Merck)', 'PedvaxHIB'),
      product('hiberix', 'Hiberix (GSK)', 'Hiberix'),
    ],
  },
  {
    id: 'rotavirus',
    displayOrder: 15,
    products: [
      product('rotateq', 'RotaTeq (Merck)', 'RotaTeq'),
      product('rotarix', 'Rotarix (GSK)', 'Rotarix'),
    ],
  },
  {
    id: 'hpv',
    displayOrder: 16,
    products: [
      product('gardasil9', 'Gardasil 9 (Merck)', 'Gardasil 9'),
    ],
  },
];

export const VACCINE_IDS: readonly VaccineId[] = VACCINES.map((vaccine) => vaccine.id);

const BY_ID = new Map(VACCINES.map((vaccine) => [vaccine.id, vaccine]));

export function getVaccine(id: VaccineId): Vaccine {
  const vaccine = BY_ID.get(id);
  if (!vaccine) throw new Error(`Unknown vaccine: ${id}`);
  return vaccine;
}
