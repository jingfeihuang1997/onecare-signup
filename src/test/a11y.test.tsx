import { renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { useFocusOnChange } from '../shells/useFocusOnChange';
import {
  atPath,
  main,
  passHelper,
  passInsurance,
  passPatientFound,
  passPatientNotFound,
  passSign,
  passVaccines,
  path,
  press,
  renderAt,
  start,
  typePatient,
} from './app';
import { SEED_MARIA, SEED_NEW_PATIENT } from '../data/seed';

// Accessibility checks that can run without a real browser. Color contrast needs real
// rendering, so it is checked in the browser instead (see docs/ACCESSIBILITY.md).

const LONG = 90_000;

/** Runs axe on the page and returns the serious and critical problems, one line each. */
async function problems(): Promise<string[]> {
  const results = await axe.run(document.body, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`);
}

async function expectClean(where: string) {
  expect(await problems(), where).toEqual([]);
}

/** Presses Tab until the element has focus: proves it can be reached with the keyboard. */
async function tabTo(element: HTMLElement) {
  for (let presses = 0; presses < 150; presses += 1) {
    if (document.activeElement === element) return;
    await userEvent.tab();
  }
  throw new Error(`Could not reach ${element.outerHTML.slice(0, 80)} with Tab`);
}

describe.each([
  { option: '/a' as const, patient: 'maria' as const },
  { option: '/a' as const, patient: 'daniel' as const },
  { option: '/b' as const, patient: 'maria' as const },
  { option: '/b' as const, patient: 'daniel' as const },
])('axe: option $option with $patient', ({ option, patient }) => {
  it(
    'finds nothing serious or critical on any screen',
    async () => {
      const helperPath = patient === 'maria';
      const at = (section: string) => (option === '/a' ? `/a/signup/${section}` : `/b/${section}`);
      const choice = option === '/a' ? (helperPath ? 'Someone else' : 'Myself') : helperPath ? "Someone I'm helping" : 'Me';

      renderAt(option);
      await screen.findByText('Tue, Dec 1, 2026 at 10:00 AM');
      await expectClean('Start');
      await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${choice}`) }));

      await expectClean('Patient, empty');
      await press('Continue');
      await expectClean('Patient, with errors');
      if (helperPath) {
        await typePatient(SEED_MARIA);
        await main().findByText(/^We found/);
        await expectClean('Patient, record found');
        await press('Yes, this is right');
        await atPath(at('helper'));
        await expectClean('Your details, empty');
        await passHelper();
      } else {
        await typePatient(SEED_NEW_PATIENT);
        await main().findByText(/on file yet/);
        await expectClean('Patient, no record');
        await press('Continue');
      }

      await atPath(at('vaccines'));
      const row = (name: string) => within(main().getByText(name).closest('.oc-vax') as HTMLElement);
      await userEvent.click(row('Influenza (flu)').getByRole('checkbox'));
      if (helperPath) await userEvent.click(row('RSV').getByRole('checkbox'));
      await userEvent.click(row('HPV').getByRole('checkbox'));
      await expectClean('Vaccines, with a row open and reminders');
      await press('Continue');

      await atPath(at('insurance'));
      await expectClean('Insurance, nothing chosen');
      await userEvent.click(main().getByRole('radio', { name: 'Yes' }));
      await press('Add a second card');
      await press('Continue');
      await expectClean('Insurance, card photos with an error');
      await press('Enter details manually');
      // Maria is 72, so she is asked which type; Daniel is 38 and goes straight to the fields.
      if (helperPath) await userEvent.click(main().getByRole('radio', { name: 'Medicare' }));
      await press('Continue');
      await expectClean('Insurance, typed in with errors');
      await passInsurance();

      await atPath(at('extras'));
      await expectClean('Save time at the clinic');
      await userEvent.click(main().getByRole('checkbox', { name: 'Remind me by email' }));
      await userEvent.click(main().getByRole('checkbox', { name: 'Remind me by text message' }));
      await expectClean('Save time at the clinic, with reminders');
      await userEvent.click(main().getByRole('checkbox', { name: 'Remind me by text message' }));
      await press('Answer health questions');
      await expectClean('Health questions');
      await press('Save answers');
      await press('Skip for now');

      await atPath(at('sign'));
      await expectClean('Consent and signature');
      await press(/^Sign/);
      await expectClean('Consent and signature, after the first press');
      await passSign(/^Sign/);
      await atPath(`${option}/done`);
      await expectClean('Done');
    },
    LONG,
  );
});

describe('axe: the sheet and the menu', () => {
  it('finds nothing serious or critical in the jump sheet or the language menu', async () => {
    await start('/a', 'Someone else');
    await userEvent.click(screen.getByRole('button', { name: 'Sections' }));
    await screen.findByRole('dialog');
    await expectClean('Jump sheet');
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: /Change language/ }));
    await expectClean('Language menu');
  });
});

describe.each([
  { option: '/a' as const, choice: /^Myself/, submit: 'Sign up', done: 'You are signed up' },
  { option: '/b' as const, choice: /^Me/, submit: 'Sign and get my pass', done: 'Your pass is ready.' },
])('keyboard only: option $option', ({ option, choice, submit, done }) => {
  it(
    'completes a sign-up without a pointer',
    async () => {
      const at = (section: string) => (option === '/a' ? `/a/signup/${section}` : `/b/${section}`);
      renderAt(option);
      await screen.findByText('Tue, Dec 1, 2026 at 10:00 AM');

      await tabTo(screen.getByRole('button', { name: choice }));
      await userEvent.keyboard('{Enter}');
      await atPath(at('patient'));

      // Focus arrived on the section's heading; the fields follow in order.
      await tabTo(main().getByLabelText('First name'));
      await userEvent.keyboard('Daniel');
      await userEvent.tab();
      expect(main().getByLabelText('Last name')).toHaveFocus();
      await userEvent.keyboard('Brooks');
      await userEvent.tab();
      await userEvent.tab();
      expect(main().getByLabelText('Month')).toHaveFocus();
      // A list of month names: the test picks from it, as arrow keys would.
      await userEvent.selectOptions(main().getByLabelText('Month'), '09');
      await userEvent.tab();
      expect(main().getByLabelText('Day')).toHaveFocus();
      await userEvent.keyboard('231988');
      await main().findByText(/on file yet/);
      await tabTo(main().getByLabelText('Sex'));
      await userEvent.selectOptions(main().getByLabelText('Sex'), 'Male');
      await tabTo(main().getByLabelText('Email for the confirmation'));
      await userEvent.keyboard('daniel@example.com');
      await tabTo(main().getByRole('button', { name: 'Continue' }));
      await userEvent.keyboard('{Enter}');
      await atPath(at('vaccines'));

      const flu = within(main().getByText('Influenza (flu)').closest('.oc-vax') as HTMLElement);
      await tabTo(flu.getByRole('checkbox'));
      await userEvent.keyboard(' ');
      expect(flu.getByRole('checkbox')).toBeChecked();
      await tabTo(main().getByRole('button', { name: 'Continue' }));
      await userEvent.keyboard('{Enter}');
      await atPath(at('insurance'));

      const kinds = main().getAllByRole('radio');
      await tabTo(kinds[0] as HTMLElement);
      await userEvent.keyboard('{ArrowDown}');
      expect(main().getByRole('radio', { name: 'No' })).toBeChecked();
      await tabTo(main().getByRole('button', { name: 'Continue' }));
      await userEvent.keyboard('{Enter}');
      await atPath(at('extras'));

      await tabTo(main().getByRole('button', { name: 'Skip for now' }));
      await userEvent.keyboard('{Enter}');
      await atPath(at('sign'));

      for (const box of main().getAllByRole('checkbox')) {
        await tabTo(box);
        await userEvent.keyboard(' ');
        expect(box).toBeChecked();
      }
      await tabTo(main().getByRole('button', { name: submit }));
      await userEvent.keyboard('{Enter}');
      await atPath(`${option}/done`);
      expect(screen.getByRole('heading', { level: 1, name: done })).toHaveFocus();
    },
    LONG,
  );
});

describe('focus is never left on nothing', () => {
  const lost = () => document.activeElement === document.body;

  it('"This is not Maria" and editing a row move focus to the first field', async () => {
    await start('/a', 'Someone else');
    await typePatient(SEED_MARIA);
    await main().findByText(/^We found/);
    await press(/^Name/);
    await waitFor(() => expect(main().getByLabelText('First name')).toHaveFocus());
    await press('Continue');
    await main().findByText(/^We found/);
    await press('This is not Maria');
    await waitFor(() => expect(main().getByLabelText('First name')).toHaveFocus());
  });

  it('"Keep it" and "Remove" give focus back to the vaccine checkbox', async () => {
    await start('/a', 'Someone else');
    await passPatientFound();
    await atPath('/a/signup/helper');
    await passHelper();
    await atPath('/a/signup/vaccines');
    const rsv = within(main().getByText('RSV').closest('.oc-vax') as HTMLElement);
    await userEvent.click(rsv.getByRole('checkbox'));
    await userEvent.click(rsv.getByRole('button', { name: 'Keep it' }));
    await waitFor(() => expect(rsv.getByRole('checkbox')).toHaveFocus());
    await userEvent.click(rsv.getByRole('checkbox'));
    await userEvent.click(rsv.getByRole('checkbox'));
    await userEvent.click(rsv.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(rsv.getByRole('checkbox')).toHaveFocus());
  });

  it('the optional details keep focus through the health view and the address', async () => {
    await start('/a', 'Myself');
    await passPatientNotFound();
    await atPath('/a/signup/vaccines');
    await passVaccines();
    await atPath('/a/signup/insurance');
    await userEvent.click(main().getByRole('radio', { name: 'Yes' }));
    await press('Enter details manually');
    await waitFor(() => expect(main().getByRole('button', { name: 'Upload a card instead' })).toHaveFocus());
    await press('Upload a card instead');
    await waitFor(() => expect(main().getByRole('button', { name: 'Enter details manually' })).toHaveFocus());
    await passInsurance();
    await atPath('/a/signup/extras');

    await press('Answer health questions');
    await press('Save answers');
    await waitFor(() => expect(main().getByRole('button', { name: 'Change answers' })).toHaveFocus());

    await press('Type the address by hand');
    await waitFor(() => expect(main().getByLabelText('Street address')).toHaveFocus());
    await press('Search for the address instead');
    await waitFor(() =>
      expect(main().getByRole('combobox', { name: 'Start typing the address' })).toHaveFocus(),
    );
    await userEvent.keyboard('1420 Map');
    await main().findByRole('listbox');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(main().getByRole('button', { name: 'Use a different address' })).toHaveFocus());
    expect(lost()).toBe(false);
  });

  it('"Forget what is saved on this device" moves focus on, on Start and on Done', async () => {
    const first = await start('/a', 'Myself');
    await typePatient(SEED_NEW_PATIENT);
    first.unmount();
    renderAt('/a', first.storage);
    await userEvent.click(await screen.findByRole('button', { name: 'Forget what is saved on this device' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Who is this sign-up for?' })).toHaveFocus());

    await userEvent.click(screen.getByRole('button', { name: /^Myself/ }));
    await passPatientNotFound();
    await atPath('/a/signup/vaccines');
    await passVaccines();
    await atPath('/a/signup/insurance');
    await passInsurance();
    await atPath('/a/signup/extras');
    await press('Skip for now');
    await atPath('/a/signup/sign');
    await passSign('Sign up');
    await atPath('/a/done');
    await press('Forget what is saved on this device');
    await waitFor(() => expect(main().getByText('Nothing is saved on this device now.')).toHaveFocus());
    expect(path()).toBe('/a/done');
  }, LONG);
});

describe('page names', () => {
  it('names the browser tab after the screen, and every screen has one top heading', async () => {
    await start('/a', 'Someone else');
    await waitFor(() => expect(document.title).toBe('Patient · Cedar Lane Pharmacy vaccine sign-up'));
    expect(screen.getAllByRole('heading', { level: 1 }).map((item) => item.textContent)).toEqual(['Vaccine sign-up']);
    await passPatientNotFound();
    await atPath('/a/signup/helper');
    await waitFor(() => expect(document.title).toBe('Your details · Cedar Lane Pharmacy vaccine sign-up'));
  });
});

describe('reduced motion', () => {
  function stubMotion(reduce: boolean) {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: reduce && query.includes('prefers-reduced-motion'), media: query })),
    );
  }

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    { reduce: true, behavior: 'auto' },
    { reduce: false, behavior: 'smooth' },
  ])('scrolls with behavior "$behavior" when reduce is $reduce', ({ reduce, behavior }) => {
    stubMotion(reduce);
    const element = document.createElement('button');
    document.body.appendChild(element);
    const scrollIntoView = vi.fn();
    element.scrollIntoView = scrollIntoView;
    renderHook(() => useFocusOnChange('patient', () => element));
    expect(element).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior });
    element.remove();
  });
});
