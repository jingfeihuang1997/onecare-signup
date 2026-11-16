import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SEED_NEW_PATIENT } from '../data/seed';
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
  typePatient,
} from '../test/app';

// Save time at the clinic (SPEC 5.6 and 10.1, item 16): optional, before signing.

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

/** The highlighted block that holds the health questions. */
const healthBlock = () => main().getByRole('heading', { name: 'Health questions' }).closest('.oc-card') as HTMLElement;
/** The address suggestions only: the Race select has options too. */
const suggestions = async () => within(await main().findByRole('listbox')).getAllByRole('option');
const answerTo = (number: number) => within(main().getByRole('group', { name: `Answer to question ${number}` }));
const tick = (name: string) => userEvent.click(main().getByRole('checkbox', { name }));

describe('Save time at the clinic: everything on view', () => {
  it('shows every part at once, with nothing folded', async () => {
    await toExtras();
    expect(main().getByText('Optional. Anything you add now is one less form at the clinic.')).toBeInTheDocument();
    for (const title of ['Health questions', "Daniel's home address", 'Reminders']) {
      expect(main().getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(main().getByRole('combobox', { name: 'Start typing the address' })).toBeInTheDocument();
    expect(main().getByLabelText('Phone number (optional)')).toHaveAccessibleDescription(
      'In case the pharmacy needs to reach Daniel.',
    );
    expect(main().getByRole('checkbox', { name: 'Remind me by email' })).not.toBeChecked();
    expect(main().getByRole('checkbox', { name: 'Remind me by text message' })).not.toBeChecked();
    expect(main().getByLabelText('Race (optional)')).toBeInTheDocument();
    // Sex moved to the Patient section.
    expect(main().queryByLabelText(/^Sex/)).not.toBeInTheDocument();
    // Nothing here folds: the only disclosure is "Why we ask".
    expect(
      within(head('Save time at the clinic').closest('.oc-panel') as HTMLElement)
        .getAllByRole('button', { expanded: false })
        .map((button) => button.textContent),
    ).toEqual(['Why we ask']);
  });

  it('highlights the health questions, and says "Not started" until they are opened and saved', async () => {
    await toExtras();
    expect(healthBlock()).toHaveClass('oc-card--tint');
    expect(healthBlock()).toHaveTextContent('Answer these now to save time at the clinic.');
    expect(healthBlock()).toHaveTextContent('Not started');
    expect(healthBlock()).not.toHaveTextContent(/all set to No|are No/);
    expect(within(healthBlock()).getByRole('button', { name: 'Answer health questions' })).toBeInTheDocument();
  });

  it('"Why we ask" explains every part of the section', async () => {
    await toExtras();
    await press('Why we ask');
    const reasons = within(main().getByText('Draft wording, not yet approved.').parentElement as HTMLElement);
    expect(reasons.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Health questions',
      'Home address',
      'Phone number',
      'Reminders',
      'Race',
    ]);
  });

  it('race offers "Prefer not to say"', async () => {
    await toExtras();
    const race = main().getByLabelText('Race (optional)');
    expect(within(race).getByRole('option', { name: 'Prefer not to say' })).toBeInTheDocument();
    await userEvent.selectOptions(race, 'Asian');
    await press('Continue to sign');
    await atPath('/a/signup/sign');
    expect(head('Save time at the clinic')).toHaveTextContent('Race added');
  });
});

describe('Save time at the clinic: phone and reminders', () => {
  it('the phone number is optional, and checked only when filled in', async () => {
    await toExtras();
    const phone = main().getByLabelText('Phone number (optional)');
    expect(phone).toHaveAttribute('type', 'tel');
    await userEvent.type(phone, '313555');
    await press('Continue to sign');
    expect(phone).toHaveAccessibleDescription(/Enter a 10-digit phone number, like \(313\) 555-0142\./);
    expect(phone).toHaveFocus();
    expect(path()).toBe('/a/signup/extras');

    await userEvent.type(phone, '0199');
    await press('Continue to sign');
    await atPath('/a/signup/sign');
    expect(head('Save time at the clinic')).toHaveTextContent('Phone added');
  });

  it('email reminder: offers the confirmation email first, or a different one', async () => {
    await toExtras();
    expect(main().getByText('Would you like a reminder before the clinic? Choose email, text message, or both.')).toBeInTheDocument();
    expect(
      main().getByText('The sign-up confirmation is emailed whether or not you choose a reminder.'),
    ).toBeInTheDocument();
    // Nothing is asked until a reminder is chosen.
    expect(main().queryByRole('radio')).not.toBeInTheDocument();

    await tick('Remind me by email');
    const to = within(main().getByRole('group', { name: 'Where to send the email reminder' }));
    expect(to.getByRole('radio', { name: /^test@example\.com/ })).toBeChecked();
    expect(to.getByRole('radio', { name: /^test@example\.com/ }).closest('label')).toHaveTextContent(
      'The email given for the confirmation',
    );
    expect(main().queryByLabelText('Email for the reminder')).not.toBeInTheDocument();

    await userEvent.click(to.getByRole('radio', { name: 'Use a different email' }));
    const other = main().getByLabelText('Email for the reminder');
    await waitFor(() => expect(other).toHaveFocus());
    await userEvent.type(other, 'daniel@');
    await press('Continue to sign');
    expect(other).toHaveAccessibleDescription(/Enter the full email address, like name@example\.com\./);
    expect(path()).toBe('/a/signup/extras');

    // Going back to the email already given needs nothing more.
    await userEvent.click(to.getByRole('radio', { name: /^test@example\.com/ }));
    expect(main().queryByLabelText('Email for the reminder')).not.toBeInTheDocument();
    await press('Continue to sign');
    await atPath('/a/signup/sign');
    expect(head('Save time at the clinic')).toHaveTextContent('Reminder added');
  });

  it('text reminder: offers the phone number given earlier, or a different one', async () => {
    await toExtras();
    await tick('Remind me by text message');
    // The helper gave a mobile number in "Your details".
    const to = within(main().getByRole('group', { name: 'Where to send the text reminder' }));
    expect(to.getByRole('radio', { name: /^\(313\) 555-0142/ })).toBeChecked();

    // A phone number typed above takes its place.
    await userEvent.type(main().getByLabelText('Phone number (optional)'), '(313) 555-0199');
    expect(to.getByRole('radio', { name: /^\(313\) 555-0199/ })).toBeChecked();

    await userEvent.click(to.getByRole('radio', { name: 'Use a different number' }));
    await userEvent.type(main().getByLabelText('Mobile number for the reminder'), '(734) 555-0100');
    // Both kinds can be chosen together.
    await tick('Remind me by email');
    await press('Continue to sign');
    await atPath('/a/signup/sign');
  });

  it('text reminder with no phone number yet: asks for one', async () => {
    await start('/a', 'Myself');
    await passPatientNotFound();
    await atPath('/a/signup/vaccines');
    await passVaccines();
    await atPath('/a/signup/insurance');
    await passInsurance();
    await atPath('/a/signup/extras');
    expect(main().getByLabelText('Phone number (optional)')).toHaveAccessibleDescription(
      'In case the pharmacy needs to reach you.',
    );

    await tick('Remind me by text message');
    expect(main().queryByRole('radio')).not.toBeInTheDocument();
    const phone = main().getByLabelText('Mobile number for the reminder');
    await press('Continue to sign');
    expect(phone).toHaveAccessibleDescription(/Enter a 10-digit phone number/);
    await userEvent.type(phone, '3135550123');
    await press('Continue to sign');
    await atPath('/a/signup/sign');
  });
});

describe('Save time at the clinic: health questions', () => {
  it('A: opens as its own view inside the panel, with 14 questions all set to No', async () => {
    await toExtras('/a');
    await press('Answer health questions');

    expect(main().getByRole('heading', { name: 'Health questions' })).toHaveFocus();
    expect(
      main().getByText('All 14 start as No. Change any that should be Yes or Not sure, answering for Daniel.'),
    ).toBeInTheDocument();
    expect(main().getAllByRole('group', { name: /^Answer to question/ })).toHaveLength(14);
    expect(main().getAllByRole('button', { name: 'No', pressed: true })).toHaveLength(14);
    expect(main().getByText('1. Are you sick today?')).toBeInTheDocument();
    // The rest of the section and the Continue / Skip buttons are not on this view.
    expect(main().queryByRole('heading', { name: 'Reminders' })).not.toBeInTheDocument();
    expect(main().queryByRole('button', { name: 'Skip for now' })).not.toBeInTheDocument();
    expect(head('Save time at the clinic')).toHaveAttribute('aria-expanded', 'true');
  });

  it('counts the answers changed from No', async () => {
    await toExtras('/a');
    await press('Answer health questions');
    await userEvent.click(answerTo(2).getByRole('button', { name: 'Yes' }));
    await userEvent.click(answerTo(5).getByRole('button', { name: 'Not sure' }));
    await userEvent.click(answerTo(9).getByRole('button', { name: 'Yes' }));
    await userEvent.click(answerTo(9).getByRole('button', { name: 'No' }));
    await press('Save answers');

    expect(healthBlock()).toHaveTextContent('Saved: 2 of 14 changed from No');
    await press('Change answers');
    expect(answerTo(2).getByRole('button', { name: 'Yes' })).toHaveAttribute('aria-pressed', 'true');
    expect(answerTo(5).getByRole('button', { name: 'Not sure' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('saving without a change says all 14 are No', async () => {
    await toExtras('/a');
    await press('Answer health questions');
    await press('Save answers');
    expect(healthBlock()).toHaveTextContent('Saved: all 14 are No');
  });

  it('B: is its own step with its own heading, and Back discards the changes', async () => {
    await toExtras('/b');
    expect(screen.getByRole('heading', { level: 1, name: 'Want to skip the clipboard?' })).toBeInTheDocument();
    await press('Answer health questions');

    expect(screen.getByRole('heading', { level: 1, name: 'Health questions about Daniel' })).toHaveFocus();
    // The step heading names the view, so the section does not repeat it.
    expect(main().getAllByRole('heading')).toHaveLength(1);
    await userEvent.click(answerTo(1).getByRole('button', { name: 'Yes' }));
    await press('Back');
    expect(screen.getByRole('heading', { level: 1, name: 'Want to skip the clipboard?' })).toBeInTheDocument();
    // Opened but not saved: still "Not started".
    expect(healthBlock()).toHaveTextContent('Not started');
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
    await press('Continue to sign');
    await atPath('/a/signup/sign');
    expect(head('Save time at the clinic')).toHaveTextContent('Address added');
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
    await press('Search for the address instead');
    expect(main().getByText('57 Birch Rd Apt 2, Dearborn, MI 48124')).toBeInTheDocument();
  });

  it('prefills from the record when there is one, still masked', async () => {
    await toExtras('/a', true);
    expect(main().getByRole('heading', { name: "Maria's home address" })).toBeInTheDocument();
    expect(
      main().getByText('On file at Cedar Lane Pharmacy: •••• Maple St, Ann Arbor, MI ••104'),
    ).toBeInTheDocument();
    await press('Use a different address');
    expect(main().getByRole('combobox', { name: 'Start typing the address' })).toHaveValue('');
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
    const view = await start('/a', 'Myself');
    await typePatient(SEED_NEW_PATIENT);
    await userEvent.selectOptions(main().getByLabelText('Sex'), 'Male');
    await main().findByText(/on file yet/);
    await press('Continue');
    await atPath('/a/signup/vaccines');
    await passVaccines();
    await atPath('/a/signup/insurance');
    await passInsurance();
    await atPath('/a/signup/extras');

    await press('Answer health questions');
    await userEvent.click(answerTo(3).getByRole('button', { name: 'Yes' }));
    await press('Save answers');
    await userEvent.selectOptions(main().getByLabelText('Race (optional)'), 'White');
    await userEvent.type(main().getByLabelText('Phone number (optional)'), '(313) 555-0199');
    await tick('Remind me by text message');
    await press('Continue to sign');
    await atPath('/a/signup/sign');

    expect(head('Save time at the clinic')).toHaveTextContent(
      'Health questions answered · Phone added · Reminder added · Race added',
    );
    const stored = view.storage.getItem(STORAGE_KEY) ?? '';
    // The phone number and the reminder choice may be kept; the rest may not.
    expect(stored).toContain('(313) 555-0199');
    expect(stored).toContain('"remindByText":true');
    for (const secret of ['"sex"', '"race"', 'male', 'white', '"health"', '"answers"', '"yes"']) {
      expect(stored, `${secret} reached device memory`).not.toContain(secret);
    }
  });
});
