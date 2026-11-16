import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SEED_CLINIC } from '../data/seed';
import type { SignupServices } from '../services';
import { STORAGE_KEY, buildCalendarFile } from '../state';
import {
  atPath,
  head,
  main,
  passHelper,
  passInsurance,
  passPatientFound,
  passPatientNotFound,
  passSign,
  passVaccines,
  path,
  press,
  start,
  typePatient,
} from '../test/app';
import type { SignupDraft } from '../types';

// Consent and signature, and Done (SPEC 5.7, 5.8 and 10.1 item 9).

interface Route {
  option: '/a' | '/b';
  /** Maria has a record and is signed up by Ana; Daniel has none and signs up himself. */
  patient: 'maria' | 'daniel';
  overrides?: Partial<SignupServices>;
  /** Tick these vaccines instead of "I'm not sure". */
  vaccines?: string[];
}

async function toSign({ option, patient, overrides, vaccines }: Route) {
  const helperPath = patient === 'maria';
  const choice = option === '/a' ? (helperPath ? 'Someone else' : 'Myself') : helperPath ? "Someone I'm helping" : 'Me';
  const at = (section: string) => (option === '/a' ? `/a/signup/${section}` : `/b/${section}`);
  const view = await start(option, choice, undefined, overrides);
  if (helperPath) {
    await passPatientFound();
    await atPath(at('helper'));
    await passHelper();
  } else {
    await passPatientNotFound();
  }
  await atPath(at('vaccines'));
  if (vaccines) {
    for (const name of vaccines) {
      await userEvent.click(within(main().getByText(name).closest('.oc-vax') as HTMLElement).getByRole('checkbox'));
    }
    await press('Continue');
  } else {
    await passVaccines();
  }
  await atPath(at('insurance'));
  await passInsurance();
  await atPath(at('extras'));
  await press('Skip for now');
  await atPath(at('sign'));
  return view;
}

const tick = (name: RegExp) => userEvent.click(main().getByRole('checkbox', { name }));
const TYPED = /^I agree that this typed name/;
const PHARMACY = /^Pharmacy consent/;
const ONECARE = /^OneCare consent/;

function spySubmit() {
  const sent: SignupDraft[] = [];
  const submitSignup = vi.fn((draft: SignupDraft) => {
    sent.push(structuredClone(draft));
    return Promise.resolve({ confirmationId: 'OC-TEST-0001' });
  });
  return { sent, overrides: { submitSignup } };
}

describe('Consent and signature: the review', () => {
  it('A: the folded panels above are the review; there is no separate list', async () => {
    await toSign({ option: '/a', patient: 'maria' });
    expect(main().getByText('Tap any line above to change it.')).toBeInTheDocument();
    expect(main().queryByText('Shots')).not.toBeInTheDocument();
    expect(head('Patient')).toHaveTextContent('Maria Lopez · Apr 12, 1954');
    expect(head('Your details')).toHaveTextContent('Ana Lopez · Daughter or son · (313) 555-0142');
    expect(head('Insurance and Medicare')).toHaveTextContent('No insurance');
  });

  it('B: a review list; a row opens that step and Continue comes back to Sign', async () => {
    await toSign({ option: '/b', patient: 'maria' });
    expect(main().getByText('Tap any line below to change it.')).toBeInTheDocument();
    const rows = main().getByText('Shots').closest('.oc-review') as HTMLElement;
    expect(within(rows).getAllByRole('button').map((row) => row.textContent)).toEqual([
      'WhoMaria Lopez · Apr 12, 1954',
      'YouAna Lopez · Daughter or son · (313) 555-0142',
      'ShotsNot sure yet. The pharmacist will go through it.',
      'CardNo insurance',
      // Nothing was added, but the record already holds an address.
      'ExtrasAddress added',
    ]);

    await userEvent.click(within(rows).getByRole('button', { name: /^Card/ }));
    await atPath('/b/insurance');
    await press('Continue');
    await atPath('/b/sign');
  });
});

describe('Consent and signature: who signs, and the signature', () => {
  it('the helper signs by default; the name is prefilled and can be changed', async () => {
    await toSign({ option: '/a', patient: 'maria' });
    expect(main().getByRole('radio', { name: /^Ana Lopez/ })).toBeChecked();
    expect(main().getByRole('radio', { name: /^Ana Lopez/ }).closest('label')).toHaveTextContent('Signing for Maria');
    expect(main().getByLabelText("Signer's full name")).toHaveValue('Ana Lopez');
    expect(main().getByRole('img', { name: 'Typed signature preview: Ana Lopez' })).toBeInTheDocument();

    await userEvent.click(main().getByRole('radio', { name: /^Maria Lopez/ }));
    expect(main().getByLabelText("Signer's full name")).toHaveValue('Maria Lopez');
    await userEvent.type(main().getByLabelText("Signer's full name"), ' Sr');
    expect(main().getByRole('img', { name: 'Typed signature preview: Maria Lopez Sr' })).toBeInTheDocument();
  });

  it('signing up yourself: no "Who is signing?", and your name and signature are filled in', async () => {
    await toSign({ option: '/a', patient: 'daniel' });
    expect(main().queryByText('Who is signing?')).not.toBeInTheDocument();
    expect(main().queryByRole('radio')).not.toBeInTheDocument();
    expect(main().getByLabelText("Signer's full name")).toHaveValue('Daniel Brooks');
    expect(main().getByRole('img', { name: 'Typed signature preview: Daniel Brooks' })).toBeInTheDocument();
    // The name can still be changed, and then it stays as typed.
    await userEvent.type(main().getByLabelText("Signer's full name"), ' Jr');
    expect(main().getByRole('img', { name: 'Typed signature preview: Daniel Brooks Jr' })).toBeInTheDocument();
    expect(main().getByText(/^I consent to being vaccinated by Cedar Lane Pharmacy/)).toBeInTheDocument();
    expect(main().getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('a helper signing for a child is still asked "Who is signing?", with one choice', async () => {
    await start('/a', 'Someone else');
    await typePatient({ firstName: 'Leo', lastName: 'Brooks', dob: { month: '06', day: '01', year: '2015' } });
    await main().findByText(/on file yet/);
    await press('Continue');
    await atPath('/a/signup/helper');
    await passHelper();
    await atPath('/a/signup/vaccines');
    await passVaccines();
    await atPath('/a/signup/insurance');
    await passInsurance();
    await atPath('/a/signup/extras');
    await press('Skip for now');
    await atPath('/a/signup/sign');

    const who = within(main().getByRole('group', { name: 'Who is signing?' }));
    // A patient under 18 cannot sign, so the helper is the only choice.
    expect(who.getAllByRole('radio')).toHaveLength(1);
    expect(who.getByRole('radio', { name: /^Ana Lopez/ })).toBeChecked();
    expect(main().getByLabelText("Signer's full name")).toHaveValue('Ana Lopez');
  });

  it('nothing is ticked to begin with', async () => {
    await toSign({ option: '/a', patient: 'maria' });
    for (const box of main().getAllByRole('checkbox')) expect(box).not.toBeChecked();
    expect(main().getByText(/^I am signing for Maria Lopez\. I consent to Maria being vaccinated/)).toBeInTheDocument();
  });

  it('the vaccine information link opens an explanation', async () => {
    await toSign({ option: '/a', patient: 'maria' });
    await press('Read the vaccine information');
    expect(main().getByText(/^For each vaccine, the pharmacy gives a Vaccine Information Statement/)).toBeInTheDocument();
    // Opening it does not tick the consent.
    expect(main().getByRole('checkbox', { name: PHARMACY })).not.toBeChecked();
  });
});

describe('Consent and signature: submitting', () => {
  it('typed: sends the sign-up with the signature record once everything is ticked', async () => {
    const { sent, overrides } = spySubmit();
    await toSign({ option: '/a', patient: 'maria', overrides });
    await tick(TYPED);
    await tick(PHARMACY);
    await tick(ONECARE);
    await press('Sign up Maria');
    await atPath('/a/done');

    expect(sent).toHaveLength(1);
    expect(sent[0]?.signature).toEqual({
      signerName: 'Ana Lopez',
      signerRole: 'helper',
      method: 'typed',
      drawing: null,
      signedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      consentVersion: 'draft-2026-11',
      userAgent: navigator.userAgent,
    });
    expect(sent[0]?.patient.firstName).toBe('Maria');
    // Health answers the person never opened go as "not answered", not as 14 "No".
    expect(sent[0]?.extras.health.saved).toBe(false);
  });

  it('is blocked while a consent or the typed-signature box is unticked', async () => {
    const { sent, overrides } = spySubmit();
    await toSign({ option: '/a', patient: 'maria', overrides });
    await tick(PHARMACY);
    await tick(ONECARE);
    await press('Sign up Maria');

    expect(sent).toHaveLength(0);
    expect(path()).toBe('/a/signup/sign');
    expect(
      main().getByText('Some boxes above are not ticked. Press "Sign up Maria" again to agree to all of them and finish.'),
    ).toBeInTheDocument();

    // Changing anything takes the notice away, and the next press explains again.
    await userEvent.click(main().getByRole('checkbox', { name: ONECARE }));
    expect(main().queryByText(/Some boxes above are not ticked/)).not.toBeInTheDocument();
    await press('Sign up Maria');
    expect(sent).toHaveLength(0);
    expect(main().getByText(/Some boxes above are not ticked/)).toBeInTheDocument();
  });

  it('pressing the button a second time agrees to all the boxes and finishes', async () => {
    const { sent, overrides } = spySubmit();
    await toSign({ option: '/a', patient: 'maria', overrides });
    await press('Sign up Maria');
    expect(sent).toHaveLength(0);
    await press('Sign up Maria');
    await atPath('/a/done');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.sign).toMatchObject({ agreeTyped: true, pharmacyConsent: true, onecareConsent: true });
  });

  it('needs the signer name', async () => {
    const { sent, overrides } = spySubmit();
    await toSign({ option: '/a', patient: 'maria', overrides });
    await userEvent.clear(main().getByLabelText("Signer's full name"));
    await passSign('Sign up Maria');
    expect(sent).toHaveLength(0);
    expect(main().getByLabelText("Signer's full name")).toHaveAccessibleDescription(/Enter the signer's full name\./);
    expect(main().getByLabelText("Signer's full name")).toHaveFocus();
    expect(main().getByRole('img', { name: 'No signature yet' })).toBeInTheDocument();
  });

  it('drawn: needs a drawing, has Clear, and sends the drawing with the signature', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,DRAWN');
    const { sent, overrides } = spySubmit();
    try {
      await toSign({ option: '/a', patient: 'maria', overrides });
      await userEvent.click(within(main().getByRole('group', { name: 'How to sign' })).getByRole('button', { name: 'Draw' }));
      // The typed-signature agreement belongs to Type mode only.
      expect(main().queryByRole('checkbox', { name: TYPED })).not.toBeInTheDocument();
      expect(main().getByRole('button', { name: 'Clear' })).toBeDisabled();

      await tick(PHARMACY);
      await tick(ONECARE);
      await press('Sign up Maria');
      expect(main().getByText('Draw your signature in the box, or switch to Type.')).toBeInTheDocument();
      expect(sent).toHaveLength(0);

      const pad = main().getByRole('img', { name: 'Draw your signature here' });
      fireEvent.pointerDown(pad, { clientX: 10, clientY: 10, pointerId: 1 });
      fireEvent.pointerMove(pad, { clientX: 60, clientY: 30, pointerId: 1 });
      fireEvent.pointerUp(pad, { clientX: 60, clientY: 30, pointerId: 1 });
      expect(main().getByRole('button', { name: 'Clear' })).toBeEnabled();
      expect(main().queryByText(/Draw your signature in the box/)).not.toBeInTheDocument();

      await press('Clear');
      expect(main().getByRole('button', { name: 'Clear' })).toBeDisabled();
      fireEvent.pointerDown(pad, { clientX: 10, clientY: 10, pointerId: 1 });
      fireEvent.pointerUp(pad, { clientX: 40, clientY: 20, pointerId: 1 });

      await press('Sign up Maria');
      await atPath('/a/done');
      expect(sent[0]?.signature).toMatchObject({ method: 'drawn', drawing: 'data:image/png;base64,DRAWN' });
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('names the sections that still need finishing', async () => {
    const { sent, overrides } = spySubmit();
    await start('/a', 'Someone else', undefined, overrides);
    await passPatientFound();
    await atPath('/a/signup/helper');
    await userEvent.click(screen.getByRole('button', { name: 'Sections' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Consent and signature/ }));
    await atPath('/a/signup/sign');
    await passSign(/^Sign up/);
    expect(main().getByText('Before signing, finish: Your details · Vaccines · Insurance and Medicare.')).toBeInTheDocument();
    expect(sent).toHaveLength(0);
  });

  it('says so when the sign-up could not be sent, and lets the person try again', async () => {
    const submitSignup = vi
      .fn<SignupServices['submitSignup']>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ confirmationId: 'OC-TEST-0002' });
    await toSign({ option: '/a', patient: 'maria', overrides: { submitSignup } });
    await passSign('Sign up Maria');
    expect(await main().findByText('We could not send the sign-up. Please try again.')).toBeInTheDocument();
    expect(path()).toBe('/a/signup/sign');
    await press('Sign up Maria');
    await atPath('/a/done');
  });
});

describe('Done', () => {
  it.each([
    { option: '/a' as const, patient: 'maria' as const, button: 'Sign up Maria', title: 'Maria is signed up' },
    { option: '/a' as const, patient: 'daniel' as const, button: 'Sign up', title: 'You are signed up' },
    { option: '/b' as const, patient: 'maria' as const, button: "Sign and get Maria's pass", title: "Maria's pass is ready." },
    { option: '/b' as const, patient: 'daniel' as const, button: 'Sign and get my pass', title: 'Your pass is ready.' },
  ])('$option, $patient: a full sign-up ends on Done', async ({ option, patient, button, title }) => {
    await toSign({ option, patient });
    await passSign(button);
    await atPath(`${option}/done`);
    expect(screen.getByRole('heading', { level: 1, name: title })).toHaveFocus();
    expect(main().getByText('Tue, Dec 1, 2026 at 10:00 AM')).toBeInTheDocument();
    expect(main().getByText('Cedar Lane Pharmacy · [Clinic address]')).toBeInTheDocument();
    expect(main().getByText(/^Confirmation number: OC-MOCK-\d{4}$/)).toBeInTheDocument();
  });

  it('A: shows the vaccines requested and what is still open', async () => {
    await toSign({ option: '/a', patient: 'maria', vaccines: ['Influenza (flu)', 'RSV'] });
    await passSign('Sign up Maria');
    await atPath('/a/done');

    expect(main().getByText('Vaccines requested')).toBeInTheDocument();
    expect(main().getByText('Flu').closest('span')).toHaveTextContent('Flu · Fluzone High-Dose');
    expect(main().getByText('RSV').closest('span')).toHaveTextContent('RSV · pharmacist will confirm');

    // Everything optional was skipped; Maria's address is on file, so it is not open.
    const open = within(main().getByRole('heading', { name: 'Still open' }).closest('.oc-card') as HTMLElement);
    expect(open.getAllByRole('button').map((row) => row.textContent)).toEqual([
      'Health questionsAnswer the 14 questions',
      'RemindersChoose a reminder',
      'RaceAdd race',
    ]);
  });

  it('a "Still open" row leads to the optional details and back to Done', async () => {
    await toSign({ option: '/a', patient: 'maria' });
    await passSign('Sign up Maria');
    await atPath('/a/done');
    await press(/^Reminders/);
    await atPath('/a/signup/extras');
    await userEvent.click(main().getByRole('checkbox', { name: 'Remind me by email' }));
    await press('Continue to sign');
    await atPath('/a/done');
    expect(main().queryByRole('button', { name: /^Reminders/ })).not.toBeInTheDocument();
  });

  it('B: the finished pass has every stamp and its own wording', async () => {
    await toSign({ option: '/b', patient: 'maria', vaccines: ['COVID-19'] });
    await passSign("Sign and get Maria's pass");
    await atPath('/b/done');

    const pass = within(screen.getByRole('region', { name: 'Clinic pass' }));
    expect(pass.getByText('Maria Lopez')).toHaveClass('oc-pass__title');
    expect(pass.getByRole('navigation', { name: 'Pass progress. All steps done' })).toBeInTheDocument();
    expect(pass.getByText('Shots requested')).toBeInTheDocument();
    expect(pass.getByText('COVID-19').closest('span')).toHaveTextContent('COVID-19 · Spikevax (Moderna)');
    expect(main().getByRole('button', { name: 'Get a pass for someone else' })).toBeInTheDocument();
  });

  it('"Add to calendar" downloads an .ics file for the clinic', async () => {
    const blobs: Blob[] = [];
    const createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:calendar';
    });
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    let filename = '';
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      filename = this.download;
    });
    try {
      await toSign({ option: '/a', patient: 'maria', vaccines: ['Influenza (flu)'] });
      await passSign('Sign up Maria');
      await atPath('/a/done');
      await press('Add to calendar');

      expect(click).toHaveBeenCalledOnce();
      expect(filename).toBe('vaccination-clinic.ics');
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:calendar');
      expect(blobs[0]?.type).toBe('text/calendar;charset=utf-8');
      const blob = blobs[0];
      if (!blob) throw new Error('a file was offered');
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(blob);
      });
      expect(text).toContain('DTSTART;TZID=America/Detroit:20261201T100000');
      expect(text).toContain('SUMMARY:Vaccination clinic at Cedar Lane Pharmacy');
      expect(text).toContain('DESCRIPTION:Vaccines requested for Maria: Flu');
    } finally {
      click.mockRestore();
    }
  });

  it('"Sign up another person" goes back to Start and keeps the helper details', async () => {
    await toSign({ option: '/a', patient: 'maria' });
    await passSign('Sign up Maria');
    await atPath('/a/done');
    await press('Sign up another person');
    await atPath('/a');
    // The sign-up just sent is not offered again under "Welcome back".
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Someone else/ }));
    await atPath('/a/signup/patient');
    expect(main().getByLabelText('First name')).toHaveValue('');
    await passPatientNotFound();
    await atPath('/a/signup/helper');
    expect(main().getByLabelText('Your first name')).toHaveValue('Ana');
    expect(main().getByLabelText('Your last name')).toHaveValue('Lopez');
    expect(main().getByLabelText('Your mobile number')).toHaveValue('(313) 555-0142');
    expect(main().getByLabelText('Your relationship to Daniel')).toHaveValue('child');
  });

  it('shows the device-memory notice, and "Forget" deletes what is saved', async () => {
    const view = await toSign({ option: '/a', patient: 'maria' });
    await passSign('Sign up Maria');
    await atPath('/a/done');
    expect(
      main().getByText('Saved on this device so next time is faster. Card numbers and signatures are never saved.'),
    ).toBeInTheDocument();
    const stored = view.storage.getItem(STORAGE_KEY) ?? '';
    expect(stored).toContain('"submitted":true');
    expect(stored).not.toContain('signature');
    expect(stored).not.toContain('signerName');

    await press('Forget what is saved on this device');
    expect(view.storage.getItem(STORAGE_KEY)).toBeNull();
    expect(main().queryByText(/Saved on this device so next time is faster/)).not.toBeInTheDocument();
  });

  it('cannot be opened before the sign-up was sent', async () => {
    const first = await toSign({ option: '/a', patient: 'maria' });
    first.unmount();
    const { renderAt } = await import('../test/app');
    renderAt('/a/done', first.storage);
    await atPath('/a/signup/sign');
  });
});

describe('buildCalendarFile', () => {
  it('writes one event at the clinic time, in the clinic time zone', () => {
    const text = buildCalendarFile({
      clinic: SEED_CLINIC,
      title: 'Vaccination clinic at Cedar Lane Pharmacy',
      description: 'Vaccines requested for Maria: Flu, COVID-19',
      uid: 'OC-MOCK-0001',
      now: new Date('2026-11-14T15:30:00.000Z'),
    });
    expect(text.split('\r\n')).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OneCare//Vaccine sign-up//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:OC-MOCK-0001@onecare',
      'DTSTAMP:20261114T153000Z',
      'DTSTART;TZID=America/Detroit:20261201T100000',
      'DTEND;TZID=America/Detroit:20261201T110000',
      'SUMMARY:Vaccination clinic at Cedar Lane Pharmacy',
      'LOCATION:Cedar Lane Pharmacy\\, [Clinic address]',
      'DESCRIPTION:Vaccines requested for Maria: Flu\\, COVID-19',
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ]);
  });
});
