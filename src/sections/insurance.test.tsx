import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { STORAGE_KEY } from '../state';
import {
  atPath,
  head,
  main,
  passHelper,
  passPatientFound,
  passPatientNotFound,
  passVaccines,
  press,
  start,
} from '../test/app';

// Insurance (SPEC 5.4 and 10.1, item 15).

/** Maria, signed up by Ana, up to the Insurance section of option A. */
async function toInsurance() {
  const view = await start('/a', 'Someone else');
  await passPatientFound();
  await atPath('/a/signup/helper');
  await passHelper();
  await atPath('/a/signup/vaccines');
  await passVaccines();
  await atPath('/a/signup/insurance');
  return view;
}

const pick = (name: string) => userEvent.click(main().getByRole('radio', { name }));
const fileInputs = (side: string, capture: boolean) =>
  [...document.querySelectorAll<HTMLInputElement>(`input[type=file][data-side=${side}]`)].filter(
    (input) => input.hasAttribute('capture') === capture,
  );
const photo = (name: string) => new File(['image-bytes'], name, { type: 'image/jpeg' });

function fakeStream() {
  const stop = vi.fn();
  return { stream: { getTracks: () => [{ stop }] } as unknown as MediaStream, stop };
}

function setMediaDevices(value: unknown) {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value });
}

beforeEach(() => {
  // jsdom has no canvas: stand in for drawing a video frame and exporting it.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,CAMERA');
});

afterEach(() => {
  vi.restoreAllMocks();
  setMediaDevices(undefined);
});

const FRONT = ': Front of card';
const BACK = ': Back of card';
const SSN = 'Last 4 digits of Social Security number';

describe('Insurance: do you have health insurance?', () => {
  it('asks Yes, No or I\'m not sure, and shows nothing else until one is chosen', async () => {
    await toInsurance();
    const group = main().getByRole('group', { name: 'Does Maria have health insurance?' });
    expect(within(group).getByText('This includes Medicare and Medicaid.')).toBeInTheDocument();
    expect(main().getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)).toEqual([
      'Yes',
      'No',
      "I'm not sure",
    ]);
    expect(main().queryByRole('button', { name: /Upload photo/ })).not.toBeInTheDocument();
  });

  it('says "you" to someone signing up themselves; under 65 there is no Medicare choice', async () => {
    await start('/a', 'Myself');
    await passPatientNotFound();
    await atPath('/a/signup/vaccines');
    await passVaccines();
    await atPath('/a/signup/insurance');
    expect(main().getByRole('group', { name: 'Do you have health insurance?' })).toBeInTheDocument();
    await pick('Yes');
    expect(main().getByRole('heading', { name: 'Add your insurance card' })).toBeInTheDocument();
    await press('Enter details manually');
    // Daniel is 38: Medicare is offered from 65, so the type is not asked and the fields show.
    expect(main().queryByRole('group', { name: 'Insurance type' })).not.toBeInTheDocument();
    expect(main().queryByRole('radio', { name: 'Medicare' })).not.toBeInTheDocument();
    expect(await main().findByLabelText('Insurance company')).toBeInTheDocument();
    expect(main().getByLabelText(SSN)).toBeInTheDocument();
  });

  it('"No" completes the section', async () => {
    await toInsurance();
    await pick('No');
    expect(main().getByText(/^You can still sign up without insurance\./)).toBeInTheDocument();
    await press('Continue');
    await atPath('/a/signup/extras');
    expect(head('Insurance and Medicare')).toHaveTextContent('No insurance');
    expect(head('Insurance and Medicare').closest('.oc-panel')).toHaveClass('is-done');
  });

  it('"I\'m not sure" completes the section too', async () => {
    await toInsurance();
    await pick("I'm not sure");
    expect(main().getByText(/^That is fine\. Bring any insurance or Medicare card to the clinic/)).toBeInTheDocument();
    await press('Continue');
    await atPath('/a/signup/extras');
    expect(head('Insurance and Medicare')).toHaveTextContent('Not sure. The pharmacist will check at the clinic.');
  });

  it('validates on Continue', async () => {
    await toInsurance();
    await press('Continue');
    expect(main().getByText("Choose Yes, No or I'm not sure.")).toBeInTheDocument();

    await pick('Yes');
    await press('Continue');
    expect(
      main().getByText('Add photos of the front and back of the card, or enter the details manually.'),
    ).toBeInTheDocument();

    await press('Enter details manually');
    await press('Continue');
    expect(main().getByText('Choose the insurance type.')).toBeInTheDocument();
    expect(head('Insurance and Medicare')).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Insurance: the card photos', () => {
  it('Yes: front and back, each with "Upload photo" and "Take photo", and a way to type instead', async () => {
    await toInsurance();
    await pick('Yes');
    expect(main().getByRole('heading', { name: "Add Maria's insurance card" })).toBeInTheDocument();
    expect(main().getByText("Add photos of the front and back. We'll fill in the details.")).toBeInTheDocument();
    for (const side of [FRONT, BACK]) {
      expect(main().getByRole('button', { name: `Upload photo${side}` })).toBeInTheDocument();
      expect(main().getByRole('button', { name: `Take photo${side}` })).toBeInTheDocument();
    }
    expect(main().getByRole('button', { name: 'Enter details manually' })).toBeInTheDocument();
    // No QR code anywhere.
    expect(main().queryByText(/QR/)).not.toBeInTheDocument();
  });

  it('uploads both sides, says what was read, and completes the section', async () => {
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    await toInsurance();
    await pick('Yes');
    await press(`Upload photo${FRONT}`);
    const [front] = fileInputs('front', false);
    const [back] = fileInputs('back', false);
    expect(clicked.mock.instances[0]).toBe(front);
    if (!front || !back) throw new Error('upload inputs exist');
    expect(front).not.toHaveAttribute('capture');
    await userEvent.upload(front, photo('front.jpg'));
    await userEvent.upload(back, photo('back.jpg'));

    expect(await main().findByRole('img', { name: 'Photo of the back of the card' })).toBeInTheDocument();
    expect(main().getByRole('img', { name: 'Photo of the front of the card' })).toBeInTheDocument();
    expect(main().getByRole('button', { name: `Replace photo${FRONT}` })).toBeInTheDocument();
    expect(
      await main().findByText(
        'We read this from the card: Sample Health Plan · SMP000123456. If it is not right, choose "Enter details manually".',
      ),
    ).toBeInTheDocument();

    await press('Continue');
    await atPath('/a/signup/extras');
    expect(head('Insurance and Medicare')).toHaveTextContent('Sample Health Plan · front and back photos added');
  });

  it('what the photo filled in can be checked and corrected by hand', async () => {
    await toInsurance();
    await pick('Yes');
    const [front] = fileInputs('front', false);
    if (!front) throw new Error('upload input exists');
    await userEvent.upload(front, photo('front.jpg'));
    await main().findByText(/^We read this from the card/);
    await press('Enter details manually');

    // The details read from the card arrive under "Other insurance".
    expect(main().getByRole('radio', { name: 'Other insurance' })).toBeChecked();
    expect(main().getByLabelText('Insurance company')).toHaveValue('Sample Health Plan');
    expect(main().getByLabelText('Plan name')).toHaveValue('Sample PPO');
    expect(main().getByLabelText('Member ID')).toHaveValue('SMP000123456');
    // The low-confidence reading is pointed out; the others are not.
    const check = 'Please check this one. The photo was hard to read here.';
    expect(main().getByLabelText('Group ID (optional)')).toHaveAccessibleDescription(check);
    expect(main().getByLabelText('Member ID')).not.toHaveAccessibleDescription(check);
    // Correcting a field clears its mark.
    await userEvent.type(main().getByLabelText('Group ID (optional)'), '5');
    expect(main().getByLabelText('Group ID (optional)')).not.toHaveAccessibleDescription(check);
  });

  it('takes a dropped photo', async () => {
    await toInsurance();
    await pick('Yes');
    const zone = main().getByText('Front of card').closest('.oc-drop');
    if (!zone) throw new Error('drop zone exists');
    fireEvent.dragOver(zone);
    expect(zone).toHaveClass('is-over');
    fireEvent.drop(zone, { dataTransfer: { files: [photo('front.jpg')] } });
    expect(zone).not.toHaveClass('is-over');
    expect(await within(zone as HTMLElement).findByText('Photo added')).toBeInTheDocument();
  });

  it('"Add a second card" explains what to do for now', async () => {
    await toInsurance();
    await pick('Yes');
    await press('Add a second card');
    expect(main().getByText(/^If there is a second insurance card, bring it to the clinic/)).toBeInTheDocument();
  });
});

describe('Insurance: the camera', () => {
  it('camera allowed: asks at once, opens the in-page camera, and keeps the photo', async () => {
    const { stream, stop } = fakeStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    setMediaDevices({ getUserMedia });
    await toInsurance();
    await pick('Yes');

    await press(`Take photo${FRONT}`);
    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    const camera = within(await screen.findByRole('dialog', { name: 'Front of the card' }));
    expect(camera.getByRole('heading', { name: 'Front of the card' })).toHaveFocus();
    expect(camera.getByText('Hold the card inside the frame, then press the button.')).toBeInTheDocument();

    await userEvent.click(camera.getByRole('button', { name: 'Take the photo' }));
    expect(camera.getByRole('img', { name: 'The photo you just took' })).toHaveAttribute(
      'src',
      'data:image/jpeg;base64,CAMERA',
    );
    // "Retake" goes back to the live view; the stream is still on.
    await userEvent.click(camera.getByRole('button', { name: 'Retake' }));
    expect(stop).not.toHaveBeenCalled();
    await userEvent.click(camera.getByRole('button', { name: 'Take the photo' }));
    await userEvent.click(camera.getByRole('button', { name: 'Use this photo' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(stop).toHaveBeenCalledOnce();
    expect(await main().findByRole('img', { name: 'Photo of the front of the card' })).toHaveAttribute(
      'src',
      'data:image/jpeg;base64,CAMERA',
    );
    expect(main().getByRole('button', { name: `Retake${FRONT}` })).toBeInTheDocument();
  });

  it('stops the camera when the view is cancelled or closed with Escape', async () => {
    const first = fakeStream();
    const second = fakeStream();
    setMediaDevices({
      getUserMedia: vi.fn().mockResolvedValueOnce(first.stream).mockResolvedValueOnce(second.stream),
    });
    await toInsurance();
    await pick('Yes');

    await press(`Take photo${FRONT}`);
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(first.stop).toHaveBeenCalledOnce();
    await waitFor(() => expect(main().getByRole('button', { name: `Take photo${FRONT}` })).toHaveFocus());

    await press(`Take photo${BACK}`);
    await screen.findByRole('dialog', { name: 'Back of the card' });
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(second.stop).toHaveBeenCalledOnce();
    expect(main().queryByText('Photo added')).not.toBeInTheDocument();
  });

  it('camera denied: no error screen, falls back to the phone camera through a file input', async () => {
    setMediaDevices({ getUserMedia: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) });
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    await toInsurance();
    await pick('Yes');
    await press(`Take photo${FRONT}`);

    await waitFor(() => expect(clicked).toHaveBeenCalledOnce());
    const [capture] = fileInputs('front', true);
    expect(clicked.mock.instances[0]).toBe(capture);
    expect(capture).toHaveAttribute('capture', 'environment');
    expect(capture).toHaveAttribute('accept', 'image/*');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(main().queryByText(/denied|not allowed|permission/i)).not.toBeInTheDocument();

    if (!capture) throw new Error('capture input exists');
    await userEvent.upload(capture, photo('front.jpg'));
    expect(await main().findByText('Photo added')).toBeInTheDocument();
  });

  it('no camera: goes straight to the file input, without asking', async () => {
    setMediaDevices(undefined);
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    await toInsurance();
    await pick('Yes');
    await press(`Take photo${BACK}`);

    expect(clicked).toHaveBeenCalledOnce();
    expect(clicked.mock.instances[0]).toBe(fileInputs('back', true)[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('"Upload instead" in the camera opens a file input without capture and stops the camera', async () => {
    const { stream, stop } = fakeStream();
    setMediaDevices({ getUserMedia: vi.fn().mockResolvedValue(stream) });
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    await toInsurance();
    await pick('Yes');
    await press(`Take photo${FRONT}`);
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Upload instead' }));

    expect(stop).toHaveBeenCalledOnce();
    expect(clicked.mock.instances[0]).toBe(fileInputs('front', false)[0]);
    expect(fileInputs('front', false)[0]).not.toHaveAttribute('capture');
  });
});

describe('Insurance: details typed in', () => {
  it('"Enter details manually" asks for the insurance type, and "Upload a card instead" goes back', async () => {
    await toInsurance();
    await pick('Yes');
    await press('Enter details manually');
    expect(main().getByRole('heading', { name: "Enter Maria's insurance details" })).toBeInTheDocument();
    const type = within(main().getByRole('group', { name: 'Insurance type' }));
    expect(type.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)).toEqual([
      'Medicare',
      'Other insurance',
    ]);
    expect(main().queryByRole('button', { name: /Upload photo/ })).not.toBeInTheDocument();
    // No fields until a type is chosen.
    expect(main().queryByLabelText(SSN)).not.toBeInTheDocument();

    await press('Upload a card instead');
    expect(main().getByRole('button', { name: `Upload photo${FRONT}` })).toBeInTheDocument();
  });

  it('Medicare: the number (MBI) and the last 4 of the SSN, with what is on file', async () => {
    await toInsurance();
    await pick('Yes');
    await press('Enter details manually');
    await pick('Medicare');
    expect(main().getByText('On file at Cedar Lane Pharmacy: Medicare number ending K73.')).toBeInTheDocument();
    expect(main().getByLabelText('Medicare number (MBI)')).toHaveAccessibleDescription(
      'Use the number on the red, white and blue Medicare card.',
    );
    expect(main().getByLabelText(SSN)).toHaveAttribute('inputmode', 'numeric');

    await press('Continue');
    expect(main().getByLabelText('Medicare number (MBI)')).toHaveAccessibleDescription(
      /Enter the 11-character Medicare number, like 1EG4-TE5-MK73\./,
    );
    expect(main().getByLabelText(SSN)).toHaveAccessibleDescription('Enter the last 4 digits.');
    expect(main().getByLabelText('Medicare number (MBI)')).toHaveFocus();

    // Formatted as it is typed; the SSN keeps four digits.
    await userEvent.type(main().getByLabelText('Medicare number (MBI)'), '1eg4te5mk73999');
    expect(main().getByLabelText('Medicare number (MBI)')).toHaveValue('1EG4-TE5-MK73');
    await userEvent.type(main().getByLabelText(SSN), '67a8912');
    expect(main().getByLabelText(SSN)).toHaveValue('6789');

    await press('Continue');
    await atPath('/a/signup/extras');
    expect(head('Insurance and Medicare')).toHaveTextContent('Medicare · number added');
  });

  it('Other insurance: company, plan name, BIN, PCN, member ID, optional group ID, and the last 4 of the SSN', async () => {
    await toInsurance();
    await pick('Yes');
    await press('Enter details manually');
    await pick('Other insurance');
    expect(main().getByLabelText('Insurance company')).toHaveAccessibleDescription('As shown on the card.');
    expect(main().getByLabelText('Group ID (optional)')).toHaveAccessibleDescription(
      'Enter it if it is shown on the card.',
    );

    await press('Continue');
    for (const label of ['Insurance company', 'Plan name', 'BIN', 'PCN']) {
      expect(main().getByLabelText(label)).toHaveAccessibleDescription(
        /Enter this detail as it is shown on the card\./,
      );
    }
    expect(main().getByLabelText('Member ID')).toHaveAccessibleDescription('Enter the member ID.');
    expect(main().getByLabelText(SSN)).toHaveAccessibleDescription('Enter the last 4 digits.');
    expect(main().getByLabelText('Insurance company')).toHaveFocus();

    await userEvent.type(main().getByLabelText('Insurance company'), 'Acme Health');
    await userEvent.type(main().getByLabelText('Plan name'), 'Gold');
    await userEvent.type(main().getByLabelText('BIN'), '111111');
    await userEvent.type(main().getByLabelText('PCN'), 'ACME');
    await userEvent.type(main().getByLabelText('Member ID'), 'A1');
    await userEvent.type(main().getByLabelText(SSN), '1234');
    // The group ID stays empty: it is optional.
    await press('Continue');
    await atPath('/a/signup/extras');
    expect(head('Insurance and Medicare')).toHaveTextContent('Acme Health · typed in');
  });
});

describe('Insurance: privacy', () => {
  it('never writes the Medicare number, the SSN digits, card details or photos to the device', async () => {
    const view = await toInsurance();
    await pick('Yes');
    const [front] = fileInputs('front', false);
    const [back] = fileInputs('back', false);
    if (!front || !back) throw new Error('upload inputs exist');
    await userEvent.upload(front, photo('front.jpg'));
    await userEvent.upload(back, photo('back.jpg'));
    await main().findByText(/^We read this from the card/);
    await press('Enter details manually');
    await pick('Medicare');
    await userEvent.type(main().getByLabelText('Medicare number (MBI)'), '9ZZ9ZZ9ZZ99');
    await userEvent.type(main().getByLabelText(SSN), '9876');
    await press('Continue');
    await atPath('/a/signup/extras');

    const stored = view.storage.getItem(STORAGE_KEY) ?? '';
    expect(stored).toContain('Maria');
    for (const secret of ['9ZZ9', '9876', 'Sample Health Plan', 'SMP000123456', '0001234', 'data:image', 'medicare', 'insurance":']) {
      expect(stored, `"${secret}" reached device memory`).not.toContain(secret);
    }
    // The section still counts as finished in the progress list: that is all that is kept.
    expect(JSON.parse(stored).patients[0].confirmed).toContain('insurance');
  });
});
