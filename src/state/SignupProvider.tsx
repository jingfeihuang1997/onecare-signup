import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { defaultConfig, type AppConfig } from '../app/config';
import { ServicesContext, defaultServices, type SignupServices } from '../services';
import type { SignupDraft } from '../types';
import { SignupContext, type SignupStore } from './context';
import { createDeviceMemory, type DeviceMemory } from './deviceMemory';
import { createInitialState } from './draft';
import { signupReducer } from './reducer';

interface Props {
  config?: AppConfig;
  services?: SignupServices;
  /** Defaults to device memory in localStorage, switched by the config flag. */
  memory?: DeviceMemory;
  /** A draft to continue, for example one restored from device memory. */
  initialDraft?: SignupDraft;
  children: ReactNode;
}

/**
 * Holds the one sign-up draft that options A and B share. Loads the clinic, and writes
 * the allowed fields of the draft to device memory whenever the draft changes.
 */
export function SignupProvider({
  config = defaultConfig,
  services = defaultServices,
  memory,
  initialDraft,
  children,
}: Props) {
  const [state, dispatch] = useReducer(signupReducer, undefined, () =>
    createInitialState(config.clinicToken, initialDraft),
  );
  const [clinicError, setClinicError] = useState(false);
  const deviceMemory = useMemo(
    () => memory ?? createDeviceMemory({ enabled: config.deviceMemory }),
    [memory, config.deviceMemory],
  );

  useEffect(() => {
    let current = true;
    services
      .getClinic(config.clinicToken)
      .then((clinic) => {
        if (current) dispatch({ type: 'clinic/loaded', clinic });
      })
      .catch(() => {
        if (current) setClinicError(true);
      });
    return () => {
      current = false;
    };
  }, [services, config.clinicToken]);

  useEffect(() => {
    deviceMemory.saveDraft(state.draft);
  }, [deviceMemory, state.draft]);

  const store = useMemo<SignupStore>(
    () => ({ state, dispatch, config, memory: deviceMemory, clinicError }),
    [state, config, deviceMemory, clinicError],
  );

  return (
    <ServicesContext.Provider value={services}>
      <SignupContext.Provider value={store}>{children}</SignupContext.Provider>
    </ServicesContext.Provider>
  );
}
