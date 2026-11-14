import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/App';
import { createMockServices } from '../services';
import { MemoryStorage, ThrowingStorage, testConfig } from '../test/fixtures';
import { useI18n } from '../i18n';
import { useSignup } from './context';
import { STORAGE_KEY, createDeviceMemory } from './deviceMemory';
import { sectionList } from './selectors';
import { sectionSummary } from './summaries';
import { SignupProvider } from './SignupProvider';

const services = createMockServices({ delayMs: 0 });

/** A minimal consumer: shows the clinic and lets the test fill in a patient. */
function Probe() {
  const { state, dispatch, clinicError } = useSignup();
  const { t, language } = useI18n();
  return (
    <div>
      <p data-testid="clinic">{clinicError ? 'error' : (state.clinic?.pharmacy.name ?? 'loading')}</p>
      <p data-testid="sections">{sectionList(state).join(',')}</p>
      <p data-testid="summary">{sectionSummary(state, 'patient', t, language)}</p>
      <button
        type="button"
        onClick={() => {
          dispatch({ type: 'start/choose', forWhom: 'other' });
          dispatch({
            type: 'patient/update',
            patch: { firstName: 'Maria', lastName: 'Lopez', dob: { month: '04', day: '12', year: '1954' } },
          });
        }}
      >
        Fill
      </button>
    </div>
  );
}

describe('SignupProvider', () => {
  it('loads the clinic and shares one draft', async () => {
    const storage = new MemoryStorage();
    render(
      <SignupProvider
        config={testConfig}
        services={services}
        memory={createDeviceMemory({ enabled: true, storage })}
      >
        <Probe />
      </SignupProvider>,
    );
    expect(await screen.findByText('Cedar Lane Pharmacy')).toBeInTheDocument();
    expect(screen.getByTestId('sections')).toHaveTextContent('patient,vaccines,insurance,extras,sign');

    await userEvent.click(screen.getByRole('button', { name: 'Fill' }));
    expect(screen.getByTestId('sections')).toHaveTextContent('patient,helper,vaccines,insurance,extras,sign');
    expect(screen.getByTestId('summary')).toHaveTextContent('Maria Lopez · Apr 12, 1954');
    // The draft reached device memory.
    expect(storage.getItem(STORAGE_KEY)).toContain('"firstName":"Maria"');
  });

  it('works when localStorage throws', async () => {
    render(
      <SignupProvider
        config={testConfig}
        services={services}
        memory={createDeviceMemory({ enabled: true, storage: new ThrowingStorage() })}
      >
        <Probe />
      </SignupProvider>,
    );
    expect(await screen.findByText('Cedar Lane Pharmacy')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Fill' }));
    expect(screen.getByTestId('summary')).toHaveTextContent('Maria Lopez · Apr 12, 1954');
  });

  it('reports a clinic that cannot be loaded', async () => {
    render(
      <SignupProvider
        config={{ ...testConfig, clinicToken: 'no-such-clinic' }}
        services={services}
        memory={createDeviceMemory({ enabled: false, storage: null })}
      >
        <Probe />
      </SignupProvider>,
    );
    expect(await screen.findByText('error')).toBeInTheDocument();
  });

  it('refuses to be used without a provider', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow(/SignupProvider/);
    quiet.mockRestore();
  });
});

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('remembers the text size on this device', async () => {
    render(<App />);
    const [larger] = await screen.findAllByRole('button', { name: 'A+ Larger text' });
    if (!larger) throw new Error('the kit shows a header');
    await userEvent.click(larger);
    expect(document.documentElement.style.fontSize).toBe('112%');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').prefs).toEqual({ textSizeStep: 1 });
  });

  it('works when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    render(<App />);
    const [larger] = await screen.findAllByRole('button', { name: 'A+ Larger text' });
    if (!larger) throw new Error('the kit shows a header');
    const before = document.documentElement.style.fontSize;
    await userEvent.click(larger);
    expect(document.documentElement.style.fontSize).not.toBe(before);
  });
});
