import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SEED_MARIA, SEED_NEW_PATIENT } from '../data/seed';
import { STORAGE_KEY } from '../state';
import {
  atPath,
  head,
  main,
  passHelper,
  passPatientFound,
  passPatientNotFound,
  path,
  press,
  renderAt,
  start,
  typeHelper,
  typeIdentity,
  typePatient,
} from '../test/app';

// Start, Patient and Your details (SPEC 5.1, 5.2, 5.5), driven through both options.

describe.each([
  { option: '/a' as const, other: 'Someone else' as const, self: 'Myself' as const, helper: '/a/signup/helper', vaccines: '/a/signup/vaccines' },
  { option: '/b' as const, other: "Someone I'm helping" as const, self: 'Me' as const, helper: '/b/helper', vaccines: '/b/vaccines' },
])('Patient in option $option', ({ option, other, self, helper, vaccines }) => {
  it('record found: shows the record masked, to confirm', async () => {
    await start(option, other);
    await typeIdentity(SEED_MARIA);
    await main().findByText(/^We found/);

    expect(main().getByText("We found Maria's record at Cedar Lane Pharmacy. Parts are hidden for privacy.")).toBeInTheDocument();
    // Focus moved from the fields, which are gone, to the top of the record.
    expect(main().getByText(/^Check that it is still right/)).toHaveFocus();
    // Sex and the confirmation email are still asked for: the record does not replace them.
    await press('Yes, this is right');
    expect(main().getByLabelText('Sex')).toHaveAccessibleDescription(
      'Choose one. "Prefer not to say" is one of the choices.',
    );
    expect(main().getByLabelText('Email for the confirmation')).toHaveAccessibleDescription(
      /Enter the full email address/,
    );
    expect(main().getByLabelText('Sex')).toHaveFocus();
    await userEvent.selectOptions(main().getByLabelText('Sex'), 'Female');
    await userEvent.type(main().getByLabelText('Email for the confirmation'), 'ana.lopez@example.com');
    const rows = main().getByText('Home address').closest('.oc-review');
    expect(rows).toHaveTextContent('NameMaria Lopez');
    expect(rows).toHaveTextContent('Preferred name (optional)Add a name');
    expect(rows).toHaveTextContent('Date of birthApr 12, 1954');
    expect(rows).toHaveTextContent('Home address•••• Maple St, Ann Arbor, MI ••104');
    expect(rows).toHaveTextContent('Phone(•••) •••-0142');
    expect(rows).toHaveTextContent('InsuranceMedicare number ending K73');
    // Nothing has moved on yet.
    expect(path()).not.toBe(helper);

    await press('Yes, this is right');
    await atPath(helper);
  });

  it('record found: a row opens the fields, and Continue comes back to the record', async () => {
    await start(option, other);
    await typePatient(SEED_MARIA);
    await main().findByText(/^We found/);
    await press(/^Preferred name/);

    await userEvent.type(main().getByLabelText('Preferred name (optional)'), 'Mari');
    await press('Continue');
    expect(await main().findByText("We found Mari's record at Cedar Lane Pharmacy. Parts are hidden for privacy.")).toBeInTheDocument();
    expect(main().getByText('Preferred name (optional)').closest('button')).toHaveTextContent('Mari');
  });

  it('"This is not Maria" clears the fields', async () => {
    await start(option, other);
    await typePatient(SEED_MARIA);
    await main().findByText(/^We found/);
    await press('This is not Maria');

    expect(main().getByLabelText('First name')).toHaveValue('');
    expect(main().getByLabelText('Last name')).toHaveValue('');
    expect(main().getByLabelText('Year')).toHaveValue('');
    expect(main().queryByText(/We found/)).not.toBeInTheDocument();
    // No errors are shown for fields the person has not touched since.
    expect(main().queryByText('Enter the first name.')).not.toBeInTheDocument();
  });

  it('no record: says so gently and continues', async () => {
    await start(option, other);
    await typePatient(SEED_NEW_PATIENT);
    expect(
      await main().findByText("We don't have Daniel on file yet. That's fine, we'll add them."),
    ).toBeInTheDocument();
    expect(main().queryByText(/We found/)).not.toBeInTheDocument();
    await press('Continue');
    await atPath(helper);
  });

  it('signing up yourself: the wording says "you", and there is no helper step', async () => {
    await start(option, self);
    expect(main().getByLabelText('Preferred name (optional)')).toHaveAttribute(
      'placeholder',
      'What should we call you?',
    );
    await typePatient(SEED_NEW_PATIENT);
    expect(
      await main().findByText("We don't have you on file yet. That's fine, we'll add you."),
    ).toBeInTheDocument();
    await press('Continue');
    await atPath(vaccines);
  });

  it('asks for sex and a confirmation email, and whose email it is', async () => {
    await start(option, self);
    const sex = main().getByLabelText('Sex');
    expect(within(sex).getAllByRole('option').map((item) => item.textContent)).toEqual([
      'Choose one',
      'Female',
      'Male',
      'Non-binary (X)',
      'Prefer not to say',
    ]);
    const owner = main().getByLabelText('Whose email is this?');
    expect(owner).toHaveDisplayValue('Mine');
    expect(within(owner).getAllByRole('option').map((item) => item.textContent)).toEqual([
      'Mine',
      'Daughter or son',
      'Spouse or partner',
      'Parent',
      'Legal guardian or representative',
      'Other',
    ]);

    // Without sex and an email the section does not move on.
    await typeIdentity(SEED_NEW_PATIENT);
    await main().findByText(/on file yet/);
    await press('Continue');
    const email = main().getByLabelText('Email for the confirmation');
    expect(email).toHaveAccessibleDescription(/Enter the full email address, like name@example.com\./);
    expect(sex).toHaveAccessibleDescription('Choose one. "Prefer not to say" is one of the choices.');
    expect(sex).toHaveFocus();
    await userEvent.selectOptions(sex, 'Prefer not to say');
    await userEvent.type(email, 'guardian@example.com');
    await userEvent.selectOptions(owner, 'Legal guardian or representative');
    await press('Continue');
    await atPath(vaccines);
  });

  it('for someone else: the email is "Mine" first, or the patient\'s', async () => {
    await start(option, other);
    await userEvent.type(main().getByLabelText('First name'), 'Daniel');
    const owner = main().getByLabelText('Whose email is this?');
    expect(owner).toHaveDisplayValue('Mine');
    expect(within(owner).getAllByRole('option').map((item) => item.textContent)).toEqual([
      'Mine',
      "Daniel's",
      // The same list as "Your relationship to Daniel" on the next step.
      'Daughter or son',
      'Spouse or partner',
      'Parent',
      'Legal guardian or representative',
      'Other',
    ]);
  });

  it('starts names with a capital letter', async () => {
    await start(option, self);
    await userEvent.type(main().getByLabelText('First name'), 'daniel');
    await userEvent.type(main().getByLabelText('Last name'), 'de la cruz');
    await userEvent.type(main().getByLabelText('Preferred name (optional)'), 'dan');
    expect(main().getByLabelText('First name')).toHaveValue('Daniel');
    expect(main().getByLabelText('Last name')).toHaveValue('De la cruz');
    expect(main().getByLabelText('Preferred name (optional)')).toHaveValue('Dan');
  });

  it('under 18: "Myself" still gets the helper step', async () => {
    await start(option, self);
    await typePatient({ firstName: 'Leo', lastName: 'Brooks', dob: { month: '06', day: '01', year: '2015' } });
    expect(
      await main().findByText(/You are under 18, so an adult needs to sign up for you/),
    ).toBeInTheDocument();
    await main().findByText(/on file yet/);
    await press('Continue');
    await atPath(helper);
    expect(main().getByLabelText('Your first name')).toBeInTheDocument();
  });
});

describe('Patient: date of birth and validation', () => {
  it('offers the months by name, and moves from day to year when the day is complete', async () => {
    await start('/a', 'Someone else');
    const month = main().getByLabelText('Month');
    expect(within(month).getAllByRole('option').map((item) => item.textContent)).toEqual([
      'Choose', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]);
    await userEvent.selectOptions(month, 'April');
    await userEvent.type(main().getByLabelText('Day'), '12');
    expect(main().getByLabelText('Year')).toHaveFocus();
    await userEvent.keyboard('1954');
    expect(main().getByLabelText('Month')).toHaveValue('04');
    expect(main().getByLabelText('Day')).toHaveValue('12');
    expect(main().getByLabelText('Year')).toHaveValue('1954');
  });

  it('rejects a date that does not exist, with the message under the field', async () => {
    await start('/a', 'Someone else');
    await userEvent.selectOptions(main().getByLabelText('Month'), 'February');
    await userEvent.type(main().getByLabelText('Day'), '301990');
    await userEvent.tab();
    const group = main().getByRole('group', { name: 'Date of birth' });
    expect(group).toHaveAccessibleDescription('Enter a real date, like 04 12 1954.');
    expect(within(group).getByLabelText('Month')).toHaveAttribute('aria-invalid', 'true');
  });

  it('gives a clear error for a date in the future', async () => {
    await start('/a', 'Someone else');
    await userEvent.selectOptions(main().getByLabelText('Month'), 'January');
    await userEvent.type(main().getByLabelText('Day'), '012099');
    await userEvent.tab();
    expect(main().getByRole('group', { name: 'Date of birth' })).toHaveAccessibleDescription(
      'The date of birth cannot be in the future.',
    );
  });

  it('shows no error while a field has not been left yet', async () => {
    await start('/a', 'Someone else');
    await userEvent.selectOptions(main().getByLabelText('Month'), 'February');
    expect(main().queryByText(/Enter a real date/)).not.toBeInTheDocument();
    expect(main().queryByText('Enter the first name.')).not.toBeInTheDocument();
  });

  it('on blur: shows the message for that field only', async () => {
    await start('/a', 'Someone else');
    await userEvent.click(main().getByLabelText('First name'));
    await userEvent.tab();
    expect(main().getByLabelText('First name')).toHaveAccessibleDescription('Enter the first name.');
    expect(main().queryByText('Enter the last name.')).not.toBeInTheDocument();
  });

  it('on Continue: shows every message, stays put, and focuses the first error', async () => {
    await start('/a', 'Someone else');
    await userEvent.type(main().getByLabelText('First name'), 'Maria');
    await press('Continue');
    expect(main().getByLabelText('Last name')).toHaveAccessibleDescription('Enter the last name.');
    expect(main().getByRole('group', { name: 'Date of birth' })).toHaveAccessibleDescription(
      'Enter the date of birth: month, day and year.',
    );
    expect(main().getByLabelText('Last name')).toHaveFocus();
    expect(path()).toBe('/a/signup/patient');
    expect(head('Patient').closest('.oc-panel')).not.toHaveClass('is-done');
  });

  it('looks the record up again when the name changes', async () => {
    await start('/a', 'Someone else');
    await typePatient(SEED_MARIA);
    await main().findByText(/^We found/);
    await press(/^Name/);
    await userEvent.clear(main().getByLabelText('Last name'));
    await userEvent.type(main().getByLabelText('Last name'), 'Lopes');
    expect(
      await main().findByText("We don't have Maria on file yet. That's fine, we'll add them."),
    ).toBeInTheDocument();
  });
});

describe('Your details', () => {
  it('has the four fields with the right keyboard and autofill hints', async () => {
    await start('/a', 'Someone else');
    await passPatientNotFound();
    await atPath('/a/signup/helper');

    expect(main().getByText('Because you are signing up for Daniel.')).toBeInTheDocument();
    expect(main().getByLabelText('Your first name')).toHaveAttribute('autocomplete', 'given-name');
    expect(main().getByLabelText('Your last name')).toHaveAttribute('autocomplete', 'family-name');
    expect(main().getByLabelText('Your relationship to Daniel')).toHaveValue('');
    const phone = main().getByLabelText('Your mobile number');
    expect(phone).toHaveAttribute('type', 'tel');
    expect(phone).toHaveAttribute('autocomplete', 'tel');
    expect(phone).toHaveAttribute('inputmode', 'tel');
    // The email was asked for with the patient's details, so it is not asked again here.
    expect(main().queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it('validates on Continue and focuses the first error', async () => {
    await start('/a', 'Someone else');
    await passPatientNotFound();
    await atPath('/a/signup/helper');
    await userEvent.type(main().getByLabelText('Your first name'), 'ana');
    expect(main().getByLabelText('Your first name')).toHaveValue('Ana');
    await press('Continue');

    expect(main().getByLabelText('Your last name')).toHaveAccessibleDescription('Enter your last name.');
    expect(main().getByLabelText('Your relationship to Daniel')).toHaveAccessibleDescription(
      'Choose your relationship.',
    );
    expect(main().getByLabelText('Your mobile number')).toHaveAccessibleDescription(
      'Enter a 10-digit phone number, like (313) 555-0142.',
    );
    expect(main().getByLabelText('Your last name')).toHaveFocus();
    expect(path()).toBe('/a/signup/helper');
  });

  it('"Other" opens a field to describe the relationship in your own words', async () => {
    await start('/a', 'Someone else');
    await passPatientNotFound();
    await atPath('/a/signup/helper');
    await typeHelper();
    expect(main().queryByLabelText('Describe your relationship')).not.toBeInTheDocument();

    await userEvent.selectOptions(main().getByLabelText('Your relationship to Daniel'), 'Other');
    await press('Continue');
    expect(main().getByLabelText('Describe your relationship')).toHaveAccessibleDescription(
      'Describe your relationship.',
    );
    await userEvent.type(main().getByLabelText('Describe your relationship'), 'Neighbor');
    await press('Continue');
    await atPath('/a/signup/vaccines');
    expect(head('Your details')).toHaveTextContent('Ana Lopez · Neighbor · (313) 555-0142');
  });
});

describe('Start', () => {
  it('offers the three languages and sets the one chosen on <html lang>', async () => {
    renderAt('/a');
    await screen.findByText('Tue, Dec 1, 2026 at 10:00 AM');
    const group = within(screen.getByRole('group', { name: 'Language' }));
    expect(group.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(group.getByRole('button', { name: 'Español' }));
    expect(document.documentElement.lang).toBe('es');
    expect(screen.getByRole('group', { name: 'Idioma' })).toBeInTheDocument();
    // The header keeps only the text-size buttons on Start.
    expect(screen.queryByRole('button', { name: /Cambiar idioma/ })).not.toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('group', { name: 'Idioma' })).getByRole('button', { name: 'English' }));
  });

  it('shows no "Welcome back" on a first visit', async () => {
    renderAt('/a');
    expect(await screen.findByRole('heading', { name: 'Who is this sign-up for?' })).toBeInTheDocument();
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
  });

  it.each([
    { option: '/a' as const, other: 'Someone else' as const, helper: '/a/signup/helper', vaccines: '/a/signup/vaccines' },
    { option: '/b' as const, other: "Someone I'm helping" as const, helper: '/b/helper', vaccines: '/b/vaccines' },
  ])('$option: "Welcome back" continues the saved sign-up where it stopped', async ({ option, other, helper, vaccines }) => {
    const first = await start(option, other);
    await passPatientFound();
    await atPath(helper);
    await passHelper();
    await atPath(vaccines);
    first.unmount();

    renderAt(option, first.storage);
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Or start a new sign-up. Who is it for?' })).toBeInTheDocument();
    const resume = screen.getByRole('button', { name: /^Continue Maria's sign-up/ });
    expect(resume).toHaveTextContent('You stopped at Vaccines');
    expect(
      screen.getByText('Saved on this device from last time. Card numbers and signatures are never saved.'),
    ).toBeInTheDocument();

    await userEvent.click(resume);
    await atPath(vaccines);
  });

  it('a returning helper does not retype their details', async () => {
    const first = await start('/a', 'Someone else');
    await passPatientFound();
    await atPath('/a/signup/helper');
    await passHelper();
    await atPath('/a/signup/vaccines');
    first.unmount();

    await start('/a', 'Someone else', first.storage);
    await passPatientNotFound();
    await atPath('/a/signup/helper');
    expect(main().getByLabelText('Your first name')).toHaveValue('Ana');
    expect(main().getByLabelText('Your mobile number')).toHaveValue('(313) 555-0142');
  });

  it('"Forget what is saved on this device" deletes it', async () => {
    const first = await start('/a', 'Someone else');
    await typePatient(SEED_MARIA);
    first.unmount();
    expect(first.storage.getItem(STORAGE_KEY)).toContain('Maria');

    renderAt('/a', first.storage);
    await userEvent.click(await screen.findByRole('button', { name: 'Forget what is saved on this device' }));
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who is this sign-up for?' })).toBeInTheDocument();
    await waitFor(() => expect(first.storage.getItem(STORAGE_KEY) ?? '').not.toContain('Maria'));
  });
});
