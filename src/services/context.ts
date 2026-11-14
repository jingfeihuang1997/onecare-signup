import { createContext, useContext } from 'react';
import { defaultConfig } from '../app/config';
import { createMockServices } from './mock';
import type { SignupServices } from './types';

/** The services the app uses unless a provider supplies others (tests do). */
export const defaultServices: SignupServices = createMockServices({
  delayMs: defaultConfig.mockDelayMs,
});

export const ServicesContext = createContext<SignupServices>(defaultServices);

export function useServices(): SignupServices {
  return useContext(ServicesContext);
}
