import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  atPath,
  head,
  main,
  passHelper,
  passInsurance,
  passPatientNotFound,
  passSign,
  passVaccines,
  path,
  press,
  renderAt,
  start,
} from '../test/app';

describe('option A at /a', () => {
  it('shows six panels for "Someone else", with Patient open and focused', async () => {
    await start('/a', 'Someone else');
    expect(path()).toBe('/a/signup/patient');
    expect(main().getAllByRole('heading', { level: 2 }).map((item) => item.textContent)).toEqual([
      expect.stringMatching(/^1Patient/),
      expect.stringMatching(/^2Your details/),
      expect.stringMatching(/^3Vaccines/),
      expect.stringMatching(/^4Insurance and Medicare/),
      expect.stringMatching(/^5Save time at the clinic/),
      expect.stringMatching(/^6Consent and signature/),
    ]);
    expect(head('Patient')).toHaveAttribute('aria-expanded', 'true');
    expect(head('Patient')).toHaveFocus();
    expect(head('Your details')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Section 1 of 6 · Patient')).toBeInTheDocument();
  });

  it('puts "Why we ask" right under the title of an open panel, folded', async () => {
    await start('/a', 'Someone else');
    const panel = head('Patient').closest('.oc-panel');
    expect(panel?.querySelector('.oc-panel__body')?.firstElementChild).toHaveClass('oc-why');
    const why = main().getByRole('button', { name: 'Why we ask' });
    expect(why).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(why);
    expect(main().getByText(/locate their record at the pharmacy/)).toBeInTheDocument();
  });

  it('folds a finished panel into its summary, and reopens it from its head', async () => {
    await start('/a', 'Someone else');
    await passPatientNotFound();
    await atPath('/a/signup/helper');

    const patient = head('Patient');
    expect(patient).toHaveAttribute('aria-expanded', 'false');
    expect(patient).toHaveTextContent('Daniel Brooks · Sep 23, 1988');
    expect(patient.closest('.oc-panel')).toHaveClass('is-done');
    expect(head('Your details')).toHaveAttribute('aria-expanded', 'true');
    expect(head('Your details')).toHaveFocus();
    expect(screen.getByText('Section 2 of 6 · Your details')).toBeInTheDocument();

    // The whole head is the button that reopens it: there is no separate Edit button.
    expect(main().queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    await userEvent.click(patient);
    expect(path()).toBe('/a/signup/patient');
    expect(head('Patient')).toHaveAttribute('aria-expanded', 'true');
    expect(main().getByLabelText('First name')).toHaveValue('Daniel');
    // One main panel is open at a time.
    expect(head('Your details')).toHaveAttribute('aria-expanded', 'false');

    // Pressing the open head folds it again.
    await userEvent.click(head('Patient'));
    expect(path()).toBe('/a/signup');
    expect(head('Patient')).toHaveAttribute('aria-expanded', 'false');
  });

  it('the jump sheet opens a section and closes', async () => {
    await start('/a', 'Someone else');
    await passPatientNotFound();
    await atPath('/a/signup/helper');
    await userEvent.click(screen.getByRole('button', { name: 'Sections' }));

    const sheet = within(screen.getByRole('dialog', { name: 'Jump to a section' }));
    expect(sheet.getByRole('button', { name: 'Patient Done' })).toBeInTheDocument();
    expect(sheet.getByRole('button', { name: 'Your details You are here' })).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(sheet.getByRole('button', { name: 'Save time at the clinic Optional' })).toBeInTheDocument();
    expect(sheet.getByRole('button', { name: 'Vaccines Not started' })).toBeInTheDocument();

    await userEvent.click(sheet.getByRole('button', { name: /^Consent and signature/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(path()).toBe('/a/signup/sign');
    expect(head('Consent and signature')).toHaveAttribute('aria-expanded', 'true');
    expect(head('Consent and signature')).toHaveFocus();
    expect(screen.getByText('Section 6 of 6 · Consent and signature')).toBeInTheDocument();
  });

  it('"Myself" has five panels and no "Your details"', async () => {
    await start('/a', 'Myself');
    expect(main().getAllByRole('heading', { level: 2 })).toHaveLength(5);
    expect(main().queryByRole('button', { name: /^Your details/ })).not.toBeInTheDocument();
    expect(screen.getByText('Section 1 of 5 · Patient')).toBeInTheDocument();

    await passPatientNotFound();
    await atPath('/a/signup/vaccines');
    expect(head('Vaccines')).toHaveAttribute('aria-expanded', 'true');
  });

  it('clicks through to Done', async () => {
    await start('/a', 'Someone else');
    await passPatientNotFound();
    await atPath('/a/signup/helper');
    await passHelper();
    await atPath('/a/signup/vaccines');
    await passVaccines();
    await atPath('/a/signup/insurance');
    await passInsurance();
    await atPath('/a/signup/extras');
    await press('Skip for now');
    await atPath('/a/signup/sign');
    await passSign('Sign up Daniel');
    await atPath('/a/done');
    expect(screen.getByRole('heading', { level: 1, name: 'Daniel is signed up' })).toHaveFocus();
  });

  it('a refresh keeps the draft and lands on the same section', async () => {
    const first = await start('/a', 'Someone else');
    await passPatientNotFound();
    await atPath('/a/signup/helper');
    await passHelper();
    await atPath('/a/signup/vaccines');
    first.unmount();

    // A new page load at the same address, with the same device storage.
    renderAt('/a/signup/vaccines', first.storage);
    expect(path()).toBe('/a/signup/vaccines');
    expect(main().getAllByRole('heading', { level: 2 })).toHaveLength(6);
    expect(head('Vaccines')).toHaveAttribute('aria-expanded', 'true');
    expect(head('Your details')).toHaveTextContent('Ana Lopez · Daughter or son · (313) 555-0142');
    expect(head('Your details').closest('.oc-panel')).toHaveClass('is-done');
    // Sex is required but never stored on the device, so Patient has to be visited again.
    expect(head('Patient')).toHaveTextContent('Daniel Brooks');
    expect(head('Patient').closest('.oc-panel')).not.toHaveClass('is-done');
    await userEvent.click(head('Patient'));
    await userEvent.selectOptions(main().getByLabelText('Sex'), 'Male');
    await press('Continue');
    await waitFor(() => expect(head('Patient').closest('.oc-panel')).toHaveClass('is-done'));
  });

  it('a deep link with no sign-up in progress goes to Start', async () => {
    renderAt('/a/signup/insurance');
    expect(path()).toBe('/a');
    expect(await screen.findByRole('heading', { name: 'Who is this sign-up for?' })).toBeInTheDocument();
  });

  it('a deep link to a section that is not on this path goes to the panels', async () => {
    const first = await start('/a', 'Myself');
    first.unmount();
    renderAt('/a/signup/helper', first.storage);
    expect(path()).toBe('/a/signup');
  });
});

describe('option B at /b', () => {
  it('uses its own wording on Start', async () => {
    renderAt('/b');
    expect(await screen.findByRole('heading', { name: 'First, who is the pass for?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Me/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Someone I'm helping/ })).toBeInTheDocument();
    expect(screen.getByText('Four stamps and the pass is yours.')).toBeInTheDocument();
  });

  it('shows one step per route and moves focus to its heading', async () => {
    await start('/b', "Someone I'm helping");
    expect(path()).toBe('/b/patient');
    expect(screen.getByRole('heading', { level: 1, name: 'Who is getting the vaccine?' })).toHaveFocus();
    expect(screen.getAllByRole('navigation', { name: 'Pass progress. Step 1 of 5' }).length).toBeGreaterThan(0);
    // Title, then "Why we ask", then the divider, then the fields.
    expect(main().getByRole('button', { name: 'Why we ask' })).toHaveAttribute('aria-expanded', 'false');

    await passPatientNotFound();
    await atPath('/b/helper');
    expect(screen.getByRole('heading', { level: 1, name: 'And who are you?' })).toHaveFocus();
    // Still the "Who" stamp: the helper step belongs to it.
    expect(screen.getAllByRole('navigation', { name: 'Pass progress. Step 1 of 5' }).length).toBeGreaterThan(0);

    await passHelper();
    await atPath('/b/vaccines');
    expect(screen.getAllByRole('navigation', { name: 'Pass progress. Step 2 of 5' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1, name: "Which shots go on Daniel's pass?" })).toBeInTheDocument();
  });

  it('Back goes to the previous step, and from the first step to Start', async () => {
    await start('/b', "Someone I'm helping");
    await passPatientNotFound();
    await atPath('/b/helper');
    await passHelper();
    await atPath('/b/vaccines');

    await press('Back');
    expect(path()).toBe('/b/helper');
    expect(screen.getByRole('heading', { level: 1, name: 'And who are you?' })).toHaveFocus();
    expect(main().getByLabelText('Your first name')).toHaveValue('Ana');

    await press('Back');
    expect(path()).toBe('/b/patient');
    expect(main().getByLabelText('First name')).toHaveValue('Daniel');

    await press('Back');
    expect(path()).toBe('/b');
    expect(screen.getByRole('heading', { name: /Who is it for\?$/ })).toBeInTheDocument();
  });

  it('a stamp opens its step, and a step that is not finished stays marked as not done', async () => {
    await start('/b', "Someone I'm helping");
    const stamps = () => within(screen.getAllByRole('navigation', { name: /^Pass progress/ })[0] as HTMLElement);
    // Nothing is filled in yet: jump ahead to Sign, then back to Card.
    await userEvent.click(stamps().getByRole('button', { name: /Sign/ }));
    await atPath('/b/sign');
    expect(stamps().getByRole('button', { name: /Sign/ })).toHaveAttribute('aria-current', 'step');
    expect(stamps().getByRole('button', { name: /Who/ })).not.toHaveClass('is-done');
    await userEvent.click(stamps().getByRole('button', { name: /Card/ }));
    await atPath('/b/insurance');
    // "Who" covers two steps: it opens the first one that is not finished.
    await userEvent.click(stamps().getByRole('button', { name: /Who/ }));
    await atPath('/b/patient');
  });

  it('"Me" skips "And who are you?"', async () => {
    const first = await start('/b', 'Me');
    await passPatientNotFound();
    await atPath('/b/vaccines');

    await press('Back');
    expect(path()).toBe('/b/patient');

    first.unmount();
    renderAt('/b/helper', first.storage);
    expect(path()).toBe('/b/patient');
  });

  it('clicks through to the pass', async () => {
    await start('/b', "Someone I'm helping");
    await passPatientNotFound();
    await atPath('/b/helper');
    await passHelper();
    await atPath('/b/vaccines');
    await passVaccines();
    await atPath('/b/insurance');
    await passInsurance();
    await atPath('/b/extras');
    await press('Skip for now');
    await atPath('/b/sign');
    expect(screen.getByRole('heading', { level: 1, name: 'Last stamp: check and sign.' })).toBeInTheDocument();
    await passSign("Sign and get Daniel's pass");
    await atPath('/b/done');
    expect(screen.getByRole('heading', { level: 1, name: "Daniel's pass is ready." })).toHaveFocus();
    expect(screen.getByRole('navigation', { name: 'Pass progress. All steps done' })).toBeInTheDocument();
  });

  it('a refresh keeps the draft, and a deep link without one goes to Start', async () => {
    const first = await start('/b', "Someone I'm helping");
    await passPatientNotFound();
    await atPath('/b/helper');
    first.unmount();

    const second = renderAt('/b/helper', first.storage);
    expect(path()).toBe('/b/helper');
    expect(screen.getByRole('heading', { level: 1, name: 'And who are you?' })).toBeInTheDocument();
    second.unmount();

    renderAt('/b/insurance');
    expect(path()).toBe('/b');
  });
});

describe('both options', () => {
  it('share one draft: a sign-up started in A continues in B', async () => {
    const first = await start('/a', 'Someone else');
    await passPatientNotFound();
    await atPath('/a/signup/helper');
    first.unmount();
    renderAt('/b/helper', first.storage);
    expect(screen.getByRole('heading', { level: 1, name: 'And who are you?' })).toBeInTheDocument();
  });

  it('send any other address to option A', () => {
    renderAt('/somewhere-else');
    expect(path()).toBe('/a');
  });
});
