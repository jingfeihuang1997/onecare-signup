import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { STORAGE_KEY } from '../state';
import {
  atPath,
  head,
  main,
  passHelper,
  passInsurance,
  passPatientFound,
  passPatientNotFound,
  passVaccines,
  path,
  press,
  start,
} from '../test/app';

// Save time at the clinic (SPEC 5.6): optional, before signing.

/** Up to the optional section. Maria has an address on file; Daniel (found: false) does not. */
async function toExtras(option: '/a' | '/b' = '/a', found = false) {
  const view = await start(option, option === '/a' ? 'Someone else' : "Someone I'm helping");
  const at = (section: string) => (option === '/a' ? `/a/signup/${section}` : `/b/${section}`);
  if (found) await passPatientFound();
  else await passPatientNotFound();
  await atPath(at('helper'));
  await passHelper();
  await atPath(at('vaccines'));
  await passVaccines();
  await atPath(at('insurance'));
  await passInsurance();
  await atPath(at('extras'));
  return view;
}

const sub = (title: string | RegExp) => main().getByRole('button', { name: title });
/** The address suggestions only: the Sex and Race selects have options too. */
const suggestions = async () => within(await main().findByRole('listbox')).getAllByRole('option');
const answerTo = (number: number) => within(main().getByRole('group', { name: `Answer to question ${number}` }));

describe('Save time at the clinic: the four sub-panels', () => {
  it('opens with every sub-panel already expanded, so nothing is hidden behind a tap', async () => {
    await toExtras();
    expect(main().getByText('Optional. Anything you add now is one less form at the clinic.')).toBeInTheDocument();
    expect(sub(/^Health questions/)).toHaveTextContent('14 answers, all set to No');
    for (const title of [/^More about Daniel/, /^Daniel's home address/, /^Reminders/]) {
      expect(sub(title)).toHaveAttribute('aria-expanded', 'true');
    }
    expect(main().getByLabelText('Sex')).toBeInTheDocument();
    expect(main().getByRole('combobox', { name: 'Start typing the address' })).toBeInTheDocument();
    expect(main().getByLabelText('Email for a reminder')).toBeInTheDocument();
  });

  it('each sub-panel folds on its own into a one-line summary', async () => {
    await toExtras();
    await userEvent.click(sub(/^More about Daniel/));
    expect(sub(/^More about Daniel/)).toHaveAttribute('aria-expanded', 'false');
    expect(sub(/^More about Daniel/)).toHaveTextContent('Sex · Race');
    // The others stay as they were.
    expect(sub(/^Reminders/)).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(sub(/^Daniel's home address/));
    await userEvent.click(sub(/^Reminders/));
    expect(sub(/^Daniel's home address/)).toHaveTextContent('Add an address');
    expect(sub(/^Reminders/)).toHaveTextContent('Phone or email for a reminder');
    await userEvent.click(sub(/^More about Daniel/));
    expect(main().getByLabelText('Sex')).toBeInTheDocument();
  });

  it('"More about" offers "Prefer not to say" for sex and for race', async () => {
    await toExtras();
    const sex = main().getByLabelText('Sex');
    const race = main().getByLabelText('Race');
    expect(within(sex).getByRole('option', { name: 'Prefer not to say' })).toBeInTheDocument();
    expect(within(race).getByRole('option', { name: 'Prefer not to say' })).toBeInTheDocument();

    await userEvent.selectOptions(sex, 'Prefer not to say');
    await userEvent.selectOptions(race, 'Asian');
    await userEvent.click(sub(/^More about Daniel/));
    expect(sub(/^More about Daniel/)).toHaveTextContent('Prefer not to say · Asian');
  });

  it('Reminders: phone and email, checked only when filled in', async () => {
    await toExtras();
    const phone = main().getByLabelText('Phone number for a text reminder');
    expect(phone).toHaveAttribute('type', 'tel');
    expect(main().getByLabelText('Email for a reminder')).toHaveAttribute('type', 'email');

    await userEvent.type(main().getByLabelText('Email for a reminder'), 'daniel@');
    await userEvent.click(sub(/^Reminders/));
    await press('Continue to sign');
    // The sub-panel reopens to show what is wrong, and the sign-up stays here.
    expect(await main().findByText('Enter the full email address, like name@example.com.')).toBeInTheDocument();
    expect(path()).toBe('/a/signup/extras');

    await userEvent.type(main().getByLabelText('Email for a reminder'), 'example.com');
    await press('Continue to sign');
    await atPath('/a/signup/sign');
    expect(head('Save time at the clinic')).toHaveTextContent('Reminder added');
  });
});

describe('Save time at the clinic: health questions', () => {
  it('A: opens as its own view inside the panel, with 14 questions all set to No', async () => {
    await toExtras('/a');
    await userEvent.click(sub(/^Health questions/));

    expect(main().getByRole('heading', { name: 'Health questions' })).toHaveFocus();
    expect(
      main().getByText('All 14 start as No. Change any that should be Yes or Not sure, answering for Daniel.'),
    ).toBeInTheDocument();
    expect(main().getAllByRole('group', { name: /^Answer to question/ })).toHaveLength(14);
    expect(main().getAllByRole('button', { name: 'No', pressed: true })).toHaveLength(14);
    expect(main().getByText('1. Are you sick today?')).toBeInTheDocument();
    // The other sub-panels and the Continue / Skip buttons are not on this view.
    expect(main().queryByRole('button', { name: /^Reminders/ })).not.toBeInTheDocument();
    expect(main().queryByRole('button', { name: 'Skip for now' })).not.toBeInTheDocument();
    expect(head('Save time at the clinic')).toHaveAttribute('aria-expanded', 'true');
  });

  it('counts the answers changed from No in the summary', async () => {
    await toExtras('/a');
    await userEvent.click(sub(/^Health questions/));
    await userEvent.click(answerTo(2).getByRole('button', { name: 'Yes' }));
    await userEvent.click(answerTo(5).getByRole('button', { name: 'Not sure' }));
    await userEvent.click(answerTo(9).getByRole('button', { name: 'Yes' }));
    await userEvent.click(answerTo(9).getByRole('button', { name: 'No' }));
    await press('Save answers');

    expect(sub(/^Health questions/)).toHaveTextContent('Saved: 2 of 14 changed from No');
    await userEvent.click(sub(/^Health questions/));
    expect(answerTo(2).getByRole('button', { name: 'Yes' })).toHaveAttribute('aria-pressed', 'true');
    expect(answerTo(5).getByRole('button', { name: 'Not sure' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('saving without a change says all 14 are No', async () => {
    await toExtras('/a');
    await userEvent.click(sub(/^Health questions/));
    await press('Save answers');
    expect(sub(/^Health questions/)).toHaveTextContent('Saved: all 14 are No');
  });

  it('B: is its own step with its own heading, and Back discards the changes', async () => {
    await toExtras('/b');
    expect(screen.getByRole('heading', { level: 1, name: 'Want to skip the clipboard?' })).toBeInTheDocument();
    await userEvent.click(sub(/^Health questions/));

    expect(screen.getByRole('heading', { level: 1, name: 'Health questions about Daniel' })).toHaveFocus();
    // The step heading names the view, so the section does not repeat it.
    expect(main().getAllByRole('heading')).toHaveLength(1);
    await userEvent.click(answerTo(1).getByRole('button', { name: 'Yes' }));
    await press('Back');
    expect(screen.getByRole('heading', { level: 1, name: 'Want to skip the clipboard?' })).toBeInTheDocument();
    expect(sub(/^Health questions/)).toHaveTextContent('14 answers, all set to No');
    expect(path()).toBe('/b/extras');
  });
});

describe('Save time at the clinic: home address', () => {
  it('suggests addresses from three characters, and works with the keyboard only', async () => {
    await toExtras();
    const input = main().getByRole('combobox', { name: 'Start typing the address' });

    await userEvent.type(input, '14');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await userEvent.type(input, '20 Map');
    const options = await suggestions();
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveTextContent('1420 Maple StAnn Arbor, MI 48104');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect((await suggestions())[1]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', (await suggestions())[1]?.id);
    await userEvent.keyboard('{Enter}');

    expect(main().queryByRole('combobox', { name: 'Start typing the address' })).not.toBeInTheDocument();
    expect(main().getByText('1420 Maple Rd, Troy, MI 48084')).toBeInTheDocument();
    await userEvent.click(sub(/^Daniel's home address/));
    expect(sub(/^Daniel's home address/)).toHaveTextContent('1420 Maple Rd, Troy, MI 48084');
  });

  it('"Type the address by hand" shows street, unit, city, state and ZIP', async () => {
    await toExtras();
    await press('Type the address by hand');
    await userEvent.type(main().getByLabelText('Street address'), '57 Birch Rd');
    await userEvent.type(main().getByLabelText('Apartment or unit (optional)'), 'Apt 2');
    await userEvent.type(main().getByLabelText('City'), 'Dearborn');
    await userEvent.type(main().getByLabelText('State'), 'mi');
    await userEvent.type(main().getByLabelText('ZIP code'), '48124x');
    expect(main().getByLabelText('State')).toHaveValue('MI');
    expect(main().getByLabelText('ZIP code')).toHaveValue('48124');
    await userEvent.click(sub(/^Daniel's home address/));
    expect(sub(/^Daniel's home address/)).toHaveTextContent('57 Birch Rd Apt 2, Dearborn, MI 48124');
  });

  it('prefills from the record when there is one, still masked', async () => {
    await toExtras('/a', true);
    expect(
      main().getByText('On file at Cedar Lane Pharmacy: •••• Maple St, Ann Arbor, MI ••104'),
    ).toBeInTheDocument();
    await press('Use a different address');
    expect(main().getByRole('combobox', { name: 'Start typing the address' })).toHaveValue('');
    // Folded, the sub-panel shows the address on file, still masked.
    await press('Type the address by hand');
    await press('Search for the address instead');
    await userEvent.click(sub(/^Maria's home address/));
    expect(sub(/^Maria's home address/)).toHaveTextContent('•••• Maple St, Ann Arbor, MI ••104');
  });
});

describe('Save time at the clinic: any street', () => {
  it('suggests an address for a street that is not in the sample list, and says so when it has none', async () => {
    await toExtras();
    const input = main().getByRole('combobox', { name: 'Start typing the address' });
    await userEvent.type(input, '77 sunset blvd');
    const options = await suggestions();
    expect(options[0]).toHaveTextContent('77 Sunset BlvdAnn Arbor, MI 48104');
    expect(options).toHaveLength(5);

    await userEvent.clear(input);
    await userEvent.type(input, 'somewhere');
    expect(await main().findByText('No address found for that. You can type the address by hand.')).toBeInTheDocument();
    expect(main().queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('Save time at the clinic: continue or skip', () => {
  it.each(['/a', '/b'] as const)('%s: "Continue to sign" and "Skip for now" are the same kind of button', async (option) => {
    await toExtras(option);
    const next = main().getByRole('button', { name: 'Continue to sign' });
    const skip = main().getByRole('button', { name: 'Skip for now' });
    expect(next).toHaveClass('oc-btn');
    expect(skip).toHaveClass('oc-btn');
    expect(skip).not.toHaveClass('oc-btn--small', 'oc-btn--link');
  });

  it.each([
    { option: '/a' as const, sign: '/a/signup/sign' },
    { option: '/b' as const, sign: '/b/sign' },
  ])('$option: skipping everything still reaches Sign', async ({ option, sign }) => {
    await toExtras(option);
    await press('Skip for now');
    await atPath(sign);
    if (option === '/a') {
      expect(head('Save time at the clinic')).toHaveTextContent('Skipped for now');
      expect(head('Save time at the clinic').closest('.oc-panel')).toHaveClass('is-done');
    }
  });

  it('keeps what was added, and never writes health answers, sex or race to the device', async () => {
    const view = await toExtras();
    await userEvent.click(sub(/^Health questions/));
    await userEvent.click(answerTo(3).getByRole('button', { name: 'Yes' }));
    await press('Save answers');
    await userEvent.selectOptions(main().getByLabelText('Sex'), 'Male');
    await userEvent.selectOptions(main().getByLabelText('Race'), 'White');
    await userEvent.type(main().getByLabelText('Phone number for a text reminder'), '(313) 555-0199');
    await press('Continue to sign');
    await atPath('/a/signup/sign');

    expect(head('Save time at the clinic')).toHaveTextContent(
      'Health questions answered · More about Daniel added · Reminder added',
    );
    const stored = view.storage.getItem(STORAGE_KEY) ?? '';
    // The reminder phone may be kept; the rest of this section may not.
    expect(stored).toContain('(313) 555-0199');
    for (const secret of ['"sex"', '"race"', 'male', 'white', '"health"', '"answers"', '"yes"']) {
      expect(stored, `${secret} reached device memory`).not.toContain(secret);
    }
  });
});
