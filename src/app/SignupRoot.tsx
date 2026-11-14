import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LookupSync } from '../sections';
import type { SignupServices } from '../services';
import {
  SignupProvider,
  createDeviceMemory,
  draftFromStored,
  type DeviceMemory,
} from '../state';
import type { SignupDraft } from '../types';
import { defaultConfig, type AppConfig } from './config';

interface Props {
  config?: AppConfig;
  services?: SignupServices;
  memory?: DeviceMemory;
}

const START_PATHS = ['/', '/a', '/b'];

/** The unfinished sign-up saved most recently on this device for this clinic, if any. */
function latestDraft(memory: DeviceMemory, clinicToken: string): SignupDraft | undefined {
  const data = memory.read();
  const entry = data.patients
    .filter((item) => item.clinicToken === clinicToken && !item.submitted)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0];
  return entry ? draftFromStored(entry, data.helper) : undefined;
}

/**
 * Holds the one draft that /a and /b share. After a refresh or a deep link into the flow,
 * it continues the latest unfinished sign-up from device memory. On a Start screen it
 * begins fresh.
 */
export function SignupRoot({ config = defaultConfig, services, memory }: Props) {
  const location = useLocation();
  const store = useMemo(
    () => memory ?? createDeviceMemory({ enabled: config.deviceMemory }),
    [memory, config.deviceMemory],
  );
  const [initialDraft] = useState(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    return START_PATHS.includes(path) ? undefined : latestDraft(store, config.clinicToken);
  });
  return (
    <SignupProvider config={config} services={services} memory={store} initialDraft={initialDraft}>
      <LookupSync />
      <Outlet />
    </SignupProvider>
  );
}
