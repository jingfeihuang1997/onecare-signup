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

// Insurance and Medicare (SPEC 5.4 and 10.1, item 10).

/** Maria (72, Medicare offered) up to the Insurance section of option A. */
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

describe('Insurance: which insurance', () => {
  it('offers Medicare from age 65, with the record on file and the Medicare fields', async () => {
    await toInsurance();
    expect(main().getByRole('group', { name: 'What insurance does Maria have?' })).toBeInTheDocument();
    expect(main().getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)).toEqual([
      'Medicare',
      'Other health insurance',
      'No insurance',
    ]);
    // Nothing else shows until a choice is made.
    expect(main().queryByRole('button', { name: 'Take a photo of the front' })).not.toBeInTheDocument();

    await pick('Medicare');
    expect(main().getByRole('heading', { name: 'For Medicare' })).toBeInTheDocument();
    expect(main().getByText('On file at Cedar Lane Pharmacy: Medicare number ending K73.')).toBeInTheDocument();
    expect(main().getByLabelText('Medicare number')).toHaveAccessibleDescription('The photo can fill this in.');
    expect(main().getByLabelText('Last 4 digits of Social Security number')).toHaveAttribute('inputmode', 'numeric');
  });

  it('does not offer Medicare under 65', async () => {
    await start('/a', 'Myself');
    await passPatientNotFound();
    await atPath('/a/signup/vaccines');
    await passVaccines();
    await atPath('/a/signup/insurance');
    expect(main().getByRole('group', { name: 'What insurance do you have?' })).toBeInTheDocument();
    expect(main().getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)).toEqual([
      'Health insurance',
      'No insurance',
    ]);
  });

  it('"No insurance" completes the section', async () => {
    await toInsurance();
    await pick('No insurance');
    expect(main().getByText(/^You can still sign up without insurance\./)).toBeInTheDocument();
    await press('Continue');
    await atPath('/a/signup/extras');
    expect(head('Insurance and Medicare')).toHaveTextContent('No insurance');
    expect(head('Insurance and Medicare').closest('.oc-panel')).toHaveClass('is-done');
  });

  it('formats the Medicare number as it is typed and keeps SSN to four digits', async () => {
    await toInsurance();
    await pick('Medicare');
    await userEvent.type(main().getByLabelText('Medicare number'), '1eg4te5mk73999');
    expect(main().getByLabelText('Medicare number')).toHaveValue('1EG4-TE5-MK73');
    await userEvent.type(main().getByLabelText('Last 4 digits of Social Security number'), '67a8912');
    expect(main().getByLabelText('Last 4 digits of Social Security number')).toHaveValue('6789');

    await press('Continue');
    await atPath('/a/signup/extras');
    expect(head('Insurance and Medicare')).toHaveTextContent('Medicare · number added');
  });

  it('validates on Continue', async () => {
    await toInsurance();
    await press('Continue');
    expect(main().getByText('Choose one of the options.')).toBeInTheDocument();

    await pick('Medicare');
    await press('Continue');
    expect(main().getByLabelText('Medicare number')).toHaveAccessibleDescription(
      /Enter the 11-character Medicare number, like 1EG4-TE5-MK73\./,
    );
    expect(main().getByLabelText('Last 4 digits of Social Security number')).toHaveAccessibleDescription(
      'Enter the last 4 digits.',
    );
    expect(main().getByLabelText('Medicare number')).toHaveFocus();

    await pick('Other health insurance');
    await press('Continue');
    expect(
      main().getByText('Add photos of the front and back of the card, or type in all six details.'),
    ).toBeInTheDocument();
    expect(head('Insurance and Medicare')).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Insurance: the camera', () => {
  it('camera allowed: asks at once, opens the in-page camera, and reads the photo', async () => {
    const { stream, stop } = fakeStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    setMediaDevices({ getUserMedia });
    await toInsurance();
    await pick('Medicare');

    await press('Take a photo of the front');
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
    expect(await main().findByText('Front of card: photo added')).toBeInTheDocument();
    // The mock reader fills the Medicare number from the photo.
    await waitFor(() => expect(main().getByLabelText('Medicare number')).toHaveValue('1EG4-TE5-MK73'));
  });

  it('stops the camera when the view is cancelled or closed with Escape', async () => {
    const first = fakeStream();
    const second = fakeStream();
    setMediaDevices({
      getUserMedia: vi.fn().mockResolvedValueOnce(first.stream).mockResolvedValueOnce(second.stream),
    });
    await toInsurance();
    await pick('Medicare');

    await press('Take a photo of the front');
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(first.stop).toHaveBeenCalledOnce();
    expect(main().getByRole('button', { name: 'Take a photo of the front' })).toHaveFocus();

    await press('Take a photo of the back');
    await screen.findByRole('dialog', { name: 'Back of the card' });
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(second.stop).toHaveBeenCalledOnce();
    expect(main().queryByText(/photo added/)).not.toBeInTheDocument();
  });

  it('camera denied: no error screen, falls back to the phone camera through a file input', async () => {
    setMediaDevices({ getUserMedia: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) });
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    await toInsurance();
    await pick('Medicare');
    await press('Take a photo of the front');

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
    expect(await main().findByText('Front of card: photo added')).toBeInTheDocument();
  });

  it('no camera: goes straight to the file input, without asking', async () => {
    setMediaDevices(undefined);
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    await toInsurance();
    await pick('Other health insurance');
    await press('Take a photo of the back');

    expect(clicked).toHaveBeenCalledOnce();
    expect(clicked.mock.instances[0]).toBe(fileInputs('back', true)[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('"Upload instead" in the camera opens a file input without capture and stops the camera', async () => {
    const { stream, stop } = fakeStream();
    setMediaDevices({ getUserMedia: vi.fn().mockResolvedValue(stream) });
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    await toInsurance();
    await pick('Medicare');
    await press('Take a photo of the front');
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Upload instead' }));

    expect(stop).toHaveBeenCalledOnce();
    expect(clicked.mock.instances[0]).toBe(fileInputs('front', false)[0]);
    expect(fileInputs('front', false)[0]).not.toHaveAttribute('capture');
  });
});

describe('Insurance: other insurance', () => {
  it('"Upload photos I already have" reads both sides, fills the fields and marks the unsure ones', async () => {
    await toInsurance();
    await pick('Other health insurance');
    const [both] = fileInputs('both', false);
    if (!both) throw new Error('upload input exists');
    expect(both).not.toHaveAttribute('capture');
    await userEvent.upload(both, [photo('front.jpg'), photo('back.jpg')]);

    expect(await main().findByText('Back of card: photo added')).toBeInTheDocument();
    expect(main().getByText('Front of card: photo added')).toBeInTheDocument();
    await waitFor(() => expect(main().getByLabelText('PCN')).toHaveValue('SAMPLE'));
    expect(main().getByLabelText('Insurance company')).toHaveValue('Sample Health Plan');
    expect(main().getByLabelText('Member ID')).toHaveValue('SMP000123456');
    expect(main().getByLabelText('BIN')).toHaveValue('000000');
    expect(main().getByText('The photo filled in the details below. Please check them.')).toBeInTheDocument();

    // The two low-confidence readings are pointed out; the others are not.
    const check = 'Please check this one. The photo was hard to read here.';
    expect(main().getByLabelText('Group ID')).toHaveAccessibleDescription(check);
    expect(main().getByLabelText('PCN')).toHaveAccessibleDescription(check);
    expect(main().getByLabelText('Member ID')).not.toHaveAccessibleDescription(check);

    // Correcting a field clears its mark.
    await userEvent.type(main().getByLabelText('Group ID'), '5');
    expect(main().getByLabelText('Group ID')).not.toHaveAccessibleDescription(check);

    await press('Continue');
    await atPath('/a/signup/extras');
    expect(head('Insurance and Medicare')).toHaveTextContent('Sample Health Plan · front and back photos added');
  });

  it('"Type it in instead" shows the six fields', async () => {
    await toInsurance();
    await pick('Other health insurance');
    expect(main().queryByLabelText('Insurance company')).not.toBeInTheDocument();
    await press('Type it in instead');
    for (const label of ['Insurance company', 'Plan name', 'BIN', 'PCN', 'Member ID', 'Group ID']) {
      expect(main().getByLabelText(label)).toHaveValue('');
    }
    await userEvent.type(main().getByLabelText('Insurance company'), 'Acme Health');
    await userEvent.type(main().getByLabelText('Plan name'), 'Gold');
    await userEvent.type(main().getByLabelText('BIN'), '111111');
    await userEvent.type(main().getByLabelText('PCN'), 'ACME');
    await userEvent.type(main().getByLabelText('Member ID'), 'A1');
    await press('Continue');
    expect(main().getByText(/or type in all six details/)).toBeInTheDocument();
    await userEvent.type(main().getByLabelText('Group ID'), 'G1');
    await press('Continue');
    await atPath('/a/signup/extras');
    expect(head('Insurance and Medicare')).toHaveTextContent('Acme Health · typed in');
  });

  it('"Add a second card" explains what to do for now', async () => {
    await toInsurance();
    await pick('Other health insurance');
    await press('Add a second card');
    expect(main().getByText(/^If there is a second insurance card, bring it to the clinic/)).toBeInTheDocument();
  });
});

describe('Insurance: on a wide screen', () => {
  it('shows two drop zones and the computer-camera tile, and takes a dropped photo', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(min-width: 900px)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    try {
      await toInsurance();
      await pick('Other health insurance');
      expect(main().getAllByRole('button', { name: 'Choose a file' })).toHaveLength(2);
      // No QR code: the third tile uses this computer's own camera.
      expect(main().queryByText(/QR/)).not.toBeInTheDocument();
      expect(main().getByText("Use this computer's camera")).toBeInTheDocument();
      const { stream, stop } = fakeStream();
      const getUserMedia = vi.fn().mockResolvedValue(stream);
      setMediaDevices({ getUserMedia });
      await press('Take a photo of the back');
      const camera = within(await screen.findByRole('dialog', { name: 'Back of the card' }));
      await userEvent.click(camera.getByRole('button', { name: 'Cancel' }));
      expect(stop).toHaveBeenCalledOnce();

      const zone = main().getByText('Front of card').closest('.oc-drop');
      if (!zone) throw new Error('drop zone exists');
      fireEvent.dragOver(zone);
      expect(zone).toHaveClass('is-over');
      fireEvent.drop(zone, { dataTransfer: { files: [photo('front.jpg')] } });
      expect(zone).not.toHaveClass('is-over');
      expect(await within(zone as HTMLElement).findByText('Photo added')).toBeInTheDocument();
      expect(within(zone as HTMLElement).getByRole('button', { name: 'Choose another file' })).toBeInTheDocument();
      await waitFor(() => expect(main().getByLabelText('Insurance company')).toHaveValue('Sample Health Plan'));
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('Insurance: privacy', () => {
  it('never writes the Medicare number, the SSN digits, card details or photos to the device', async () => {
    const view = await toInsurance();
    await pick('Medicare');
    await userEvent.type(main().getByLabelText('Medicare number'), '9ZZ9ZZ9ZZ99');
    await userEvent.type(main().getByLabelText('Last 4 digits of Social Security number'), '9876');
    await pick('Other health insurance');
    const [both] = fileInputs('both', false);
    if (!both) throw new Error('upload input exists');
    await userEvent.upload(both, [photo('front.jpg'), photo('back.jpg')]);
    await waitFor(() => expect(main().getByLabelText('PCN')).toHaveValue('SAMPLE'));
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
