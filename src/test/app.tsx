import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import { SEED_HELPER, SEED_MARIA, SEED_NEW_PATIENT } from '../data/seed';
import { I18nProvider } from '../i18n';
import { createMockServices, type SignupServices } from '../services';
import { createDeviceMemory } from '../state';
import type { DateOfBirth } from '../types';
import { MemoryStorage, testConfig } from './fixtures';

// Helpers for tests that drive the whole app through a route, the way a person would.

const services = createMockServices({ delayMs: 0 });

function Where() {
  return <p data-testid="path">{useLocation().pathname}</p>;
}

export function renderAt(
  path: string,
  storage: Storage = new MemoryStorage(),
  overrides: Partial<SignupServices> = {},
) {
  const view = render(
    <I18nProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes
          config={testConfig}
          services={{ ...services, ...overrides }}
          memory={createDeviceMemory({ enabled: true, storage })}
        />
        <Where />
      </MemoryRouter>
    </I18nProvider>,
  );
  return { storage, ...view };
}

export const path = () => screen.getByTestId('path').textContent;
export const main = () => within(screen.getByRole('main'));
export const atPath = (expected: string) => waitFor(() => expect(path()).toBe(expected));

/** The head button of a panel in option A, found by the section title it starts with. */
export const head = (title: string) => main().getByRole('button', { name: new RegExp(`^${title}`) });

export const press = (name: string | RegExp) => userEvent.click(main().getByRole('button', { name }));

type Choice = 'Myself' | 'Someone else' | 'Me' | "Someone I'm helping";

/** Opens a Start screen and picks who the sign-up is for. */
export async function start(
  option: '/a' | '/b',
  choice: Choice,
  storage?: Storage,
  overrides?: Partial<SignupServices>,
) {
  const view = renderAt(option, storage, overrides);
  await screen.findByText('Tue, Dec 1, 2026 at 10:00 AM');
  await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${choice}`) }));
  return view;
}

interface Person {
  firstName: string;
  lastName: string;
  dob: DateOfBirth;
}

export async function typePatient(person: Person) {
  const form = main();
  await userEvent.type(form.getByLabelText('First name'), person.firstName);
  await userEvent.type(form.getByLabelText('Last name'), person.lastName);
  // Month and day move focus on by themselves, so the whole date is typed into Month.
  await userEvent.type(form.getByLabelText('Month'), `${person.dob.month}${person.dob.day}${person.dob.year}`);
}

/** Fills Patient with the seed patient who has no record, and continues. */
export async function passPatientNotFound(person: Person = SEED_NEW_PATIENT) {
  await typePatient(person);
  await main().findByText(/on file yet/);
  await press('Continue');
}

/** Fills Patient with Maria, who has a record, and confirms it. */
export async function passPatientFound() {
  await typePatient(SEED_MARIA);
  // The record appears by itself once name and date of birth are complete.
  await main().findByText(/^We found/);
  await press('Yes, this is right');
}

export async function typeHelper() {
  const form = main();
  await userEvent.type(form.getByLabelText('Your first name'), SEED_HELPER.firstName);
  await userEvent.type(form.getByLabelText('Your last name'), SEED_HELPER.lastName);
  await userEvent.selectOptions(form.getByLabelText(/^Your relationship/), 'Daughter or son');
  await userEvent.type(form.getByLabelText('Your mobile number'), SEED_HELPER.phone);
  await userEvent.type(form.getByLabelText('Your email'), SEED_HELPER.email);
}

export async function passHelper() {
  await typeHelper();
  await press('Continue');
}

/** Ticks the typed-signature box and both consents, then presses the submit button. */
export async function passSign(label: string | RegExp) {
  for (const box of main().getAllByRole('checkbox')) {
    await userEvent.click(box);
  }
  await press(label);
}

/** Gets past Insurance with "No insurance". */
export async function passInsurance() {
  await userEvent.click(main().getByRole('radio', { name: 'No insurance' }));
  await press('Continue');
}

/** Gets past Vaccines without picking one: "I'm not sure", then Continue. */
export async function passVaccines() {
  await userEvent.click(main().getByRole('checkbox', { name: /^I'm not sure what/ }));
  await press('Continue');
}
