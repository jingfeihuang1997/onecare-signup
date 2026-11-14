import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SEED_CLINIC } from '../data/seed';
import type { SignupServices } from '../services';
import {
  atPath,
  head,
  main,
  passHelper,
  passPatientFound,
  passPatientNotFound,
  press,
  start,
} from '../test/app';

// Vaccines (SPEC 5.3 and 10.1), for Maria: the reference scenario of A05 and B05.

async function toVaccines(option: '/a' | '/b' = '/a', overrides?: Partial<SignupServices>) {
  const view = await start(option, option === '/a' ? 'Someone else' : "Someone I'm helping", undefined, overrides);
  await passPatientFound();
  await atPath(option === '/a' ? '/a/signup/helper' : '/b/helper');
  await passHelper();
  await atPath(option === '/a' ? '/a/signup/vaccines' : '/b/vaccines');
  return view;
}

const list = () => main().getByText('Influenza (flu)').closest('.oc-vaxlist') as HTMLElement;
const rowOf = (name: string) => within(list()).getByText(name).closest('.oc-vax') as HTMLElement;
const box = (name: string) => within(rowOf(name)).getByRole('checkbox');
const details = (name: string) => within(rowOf(name)).getByRole('button', { name: `Details for ${name}` });
const tick = (name: string) => userEvent.click(box(name));
const expandedRows = () =>
  within(list())
    .getAllByRole('button', { name: /^Details for/ })
    .filter((button) => button.getAttribute('aria-expanded') === 'true');

describe.each(['/a', '/b'] as const)('Vaccines in option %s', (option) => {
  it('lists all 16 vaccines: due, then had, then no record', async () => {
    await toVaccines(option);
    const rows = [...list().querySelectorAll('.oc-vax')].map((row) => ({
      name: row.querySelector('.oc-vax__name')?.textContent,
      chip: row.querySelector('.oc-chip')?.textContent,
    }));
    expect(rows).toEqual([
      { name: 'Influenza (flu)', chip: 'Due now' },
      { name: 'COVID-19', chip: 'Due now' },
      { name: 'RSV', chip: 'Had it · Sep 2024' },
      { name: 'Tdap', chip: 'Had it · Jun 2019' },
      { name: 'Shingles (Zoster)', chip: 'Had it · Jul 2023' },
      { name: 'Pneumococcal', chip: 'Had it · Mar 2025' },
      { name: 'Hepatitis B', chip: 'No record' },
      { name: 'Hepatitis A', chip: 'No record' },
      { name: 'MMR', chip: 'No record' },
      { name: 'Varicella', chip: 'No record' },
      { name: 'Polio (IPV)', chip: 'No record' },
      { name: 'Meningococcal ACWY', chip: 'No record' },
      { name: 'DTaP', chip: 'No record' },
      { name: 'Hib', chip: 'No record' },
      { name: 'Rotavirus', chip: 'No record' },
      { name: 'HPV', chip: 'No record' },
    ]);
    expect(main().getByText(/right for Maria at the clinic/)).toBeInTheDocument();
    expect(
      main().getByText("Based on the state immunization registry (MCIR) and Cedar Lane Pharmacy's records. Records can be incomplete."),
    ).toBeInTheDocument();
    expect(expandedRows()).toHaveLength(0);
  });

  it('adding a vaccine opens it, with the product from last time already chosen', async () => {
    await toVaccines(option);
    await tick('Influenza (flu)');

    const flu = within(rowOf('Influenza (flu)'));
    expect(rowOf('Influenza (flu)')).toHaveClass('is-selected');
    expect(details('Influenza (flu)')).toHaveAttribute('aria-expanded', 'true');
    expect(flu.getByText('Last dose on record: Oct 14, 2025')).toBeInTheDocument();
    expect(flu.getByRole('group', { name: 'Which Flu vaccine?' })).toBeInTheDocument();
    const previous = flu.getByRole('radio', { name: /^Fluzone High-Dose/ });
    expect(previous).toBeChecked();
    expect(previous.closest('label')).toHaveTextContent('Same as last time · Suggested for age 65+');
    // Last dose, then the product, then the three folded rows, in that order.
    expect(
      [...rowOf('Influenza (flu)').querySelectorAll('.oc-disc')].map((item) => item.textContent),
    ).toEqual(['Other options (5)', 'Why it matters', 'About this vaccine', 'Good to know before the shot']);
    for (const row of flu.getAllByRole('button', { name: /options|matters|About|Good to know/ })) {
      expect(row).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('keeps one row open at a time; a folded, selected row shows its product in one line', async () => {
    await toVaccines(option);
    await tick('Influenza (flu)');
    await tick('COVID-19');

    expect(expandedRows()).toHaveLength(1);
    expect(details('COVID-19')).toHaveAttribute('aria-expanded', 'true');
    expect(details('Influenza (flu)')).toHaveAttribute('aria-expanded', 'false');
    expect(box('Influenza (flu)')).toBeChecked();
    expect(within(rowOf('Influenza (flu)')).getByText('Fluzone High-Dose · same as last time')).toHaveClass('oc-vax__pick');

    // The chevron opens and folds the details without changing the selection.
    await userEvent.click(details('Tdap'));
    expect(expandedRows()).toHaveLength(1);
    expect(details('Tdap')).toHaveAttribute('aria-expanded', 'true');
    expect(box('Tdap')).not.toBeChecked();
    expect(within(rowOf('COVID-19')).getByText('Spikevax (Moderna) · same as last time')).toBeInTheDocument();
  });
});

describe('Vaccines: product choice', () => {
  it('"Other options" holds the other products and ends with the two fixed choices', async () => {
    await toVaccines();
    await tick('Influenza (flu)');
    const flu = within(rowOf('Influenza (flu)'));
    await userEvent.click(flu.getByRole('button', { name: 'Other options (5)' }));
    expect(flu.getAllByRole('radio').map((radio) => radio.closest('label')?.querySelector('.oc-choice__title')?.textContent)).toEqual([
      'Fluzone High-Dose',
      'Fluad',
      'Flublok',
      'Fluzone',
      'No preference',
      "I'd like to ask the pharmacist",
    ]);

    await userEvent.click(flu.getByRole('radio', { name: "I'd like to ask the pharmacist" }));
    expect(flu.getByRole('radio', { name: /^Fluzone High-Dose/ })).not.toBeChecked();
    expect(flu.getByText("Chosen: I'd like to ask the pharmacist")).toBeInTheDocument();

    await userEvent.click(details('Influenza (flu)'));
    expect(within(rowOf('Influenza (flu)')).getByText("I'd like to ask the pharmacist")).toHaveClass('oc-vax__pick');
  });

  it('a vaccine with no product list has no product choice', async () => {
    await toVaccines();
    await tick('Hepatitis B');
    const row = within(rowOf('Hepatitis B'));
    expect(row.getByText('No dose on record.')).toBeInTheDocument();
    expect(row.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('is hidden entirely when the clinic turns product choice off', async () => {
    await toVaccines('/a', {
      getClinic: () => Promise.resolve({ ...structuredClone(SEED_CLINIC), productChoice: false }),
    });
    await tick('Influenza (flu)');
    const flu = within(rowOf('Influenza (flu)'));
    expect(flu.getByText('Last dose on record: Oct 14, 2025')).toBeInTheDocument();
    expect(flu.queryByRole('radio')).not.toBeInTheDocument();
    expect(flu.queryByRole('button', { name: /Other options/ })).not.toBeInTheDocument();
    expect(flu.getByRole('button', { name: 'Why it matters' })).toBeInTheDocument();

    await tick('COVID-19');
    expect(rowOf('Influenza (flu)').querySelector('.oc-vax__pick')).toBeNull();
    await press('Continue');
    await atPath('/a/signup/insurance');
    expect(head('Vaccines')).toHaveTextContent('Flu · COVID-19');
  });
});

describe('Vaccines: reminders and details', () => {
  it('warns when the patient already had the vaccine, without blocking', async () => {
    await toVaccines();
    await tick('RSV');
    const rsv = within(rowOf('RSV'));
    expect(
      rsv.getByText(
        'Our records show Maria had this vaccine on Sep 20, 2024, so they may not need another one. You can keep it and the pharmacist will confirm.',
      ),
    ).toHaveClass('oc-note--warn');

    await userEvent.click(rsv.getByRole('button', { name: 'Keep it' }));
    expect(rsv.queryByText(/Our records show/)).not.toBeInTheDocument();
    expect(box('RSV')).toBeChecked();

    // Ticking it again later brings the warning back; "Remove" takes the vaccine off.
    await tick('RSV');
    await tick('RSV');
    await userEvent.click(within(rowOf('RSV')).getByRole('button', { name: 'Remove' }));
    expect(box('RSV')).not.toBeChecked();
    expect(within(rowOf('RSV')).queryByText(/Our records show/)).not.toBeInTheDocument();
  });

  it('the warning stays visible while another row is open', async () => {
    await toVaccines();
    await tick('RSV');
    await tick('Influenza (flu)');
    expect(details('RSV')).toHaveAttribute('aria-expanded', 'false');
    expect(within(rowOf('RSV')).getByText(/Our records show/)).toBeInTheDocument();
  });

  it('says when a vaccine is not usual at the patient’s age, and still lets it through', async () => {
    await toVaccines();
    expect(main().queryByText(/not usually given/)).not.toBeInTheDocument();
    await tick('HPV');
    expect(
      within(rowOf('HPV')).getByText(
        "This vaccine is not usually given at Maria's age. You can keep it and the pharmacist will confirm.",
      ),
    ).toBeInTheDocument();
    await press('Continue');
    await atPath('/a/signup/insurance');
  });

  it('opens the three folded rows, each with its explanation', async () => {
    await toVaccines();
    await userEvent.click(details('Shingles (Zoster)'));
    const row = within(rowOf('Shingles (Zoster)'));
    expect(row.getByText('Last dose on record: Jul 18, 2023')).toBeInTheDocument();
    await userEvent.click(row.getByRole('button', { name: 'Why it matters' }));
    await userEvent.click(row.getByRole('button', { name: 'About this vaccine' }));
    await userEvent.click(row.getByRole('button', { name: 'Good to know before the shot' }));
    expect(row.getByText(/Shingles is a painful rash/)).toBeInTheDocument();
    expect(row.getByText(/^This vaccine is given as a shot at the clinic\./)).toBeInTheDocument();
    expect(row.getByText(/^Wear a top with sleeves that roll up easily\./)).toBeInTheDocument();
  });

  it('works from the keyboard: Space ticks the box, Enter on the chevron opens the details', async () => {
    await toVaccines();
    box('Tdap').focus();
    await userEvent.keyboard(' ');
    expect(box('Tdap')).toBeChecked();

    details('MMR').focus();
    await userEvent.keyboard('{Enter}');
    expect(details('MMR')).toHaveAttribute('aria-expanded', 'true');
    expect(box('MMR')).not.toBeChecked();
    await userEvent.keyboard(' ');
    expect(details('MMR')).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Vaccines: continuing', () => {
  it('needs at least one vaccine, or "not sure"', async () => {
    await toVaccines();
    await press('Continue');
    expect(main().getByText('Pick at least one vaccine, or tick "I\'m not sure".')).toBeInTheDocument();
    expect(head('Vaccines')).toHaveAttribute('aria-expanded', 'true');

    await tick('COVID-19');
    expect(main().queryByText(/Pick at least one vaccine/)).not.toBeInTheDocument();
  });

  it('"not sure" clears nothing and goes along with the selections', async () => {
    await toVaccines();
    await tick('Influenza (flu)');
    await tick('COVID-19');
    await userEvent.click(main().getByRole('checkbox', { name: /^I'm not sure what Maria needs/ }));
    expect(box('Influenza (flu)')).toBeChecked();
    expect(box('COVID-19')).toBeChecked();

    await press('Continue');
    await atPath('/a/signup/insurance');
    expect(head('Vaccines')).toHaveTextContent('Flu (Fluzone High-Dose) · COVID-19 (Spikevax)');
    expect(head('Vaccines').closest('.oc-panel')).toHaveClass('is-done');
  });

  it('uses "you" when the person signs up for themselves, and nothing is on record', async () => {
    await start('/a', 'Myself');
    await passPatientNotFound();
    await atPath('/a/signup/vaccines');
    expect(main().getByText(/right for you at the clinic/)).toBeInTheDocument();
    expect(main().getByRole('checkbox', { name: /^I'm not sure what I need/ })).toBeInTheDocument();
    expect(list().querySelectorAll('.oc-vax')).toHaveLength(16);
    expect([...list().querySelectorAll('.oc-chip')].every((chip) => chip.textContent === 'No record')).toBe(true);
  });
});
