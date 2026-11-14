import { createContext, useContext, type Dispatch } from 'react';
import type { AppConfig } from '../app/config';
import type { DeviceMemory } from './deviceMemory';
import type { SignupState } from './draft';
import type { SignupAction } from './reducer';

export interface SignupStore {
  state: SignupState;
  dispatch: Dispatch<SignupAction>;
  config: AppConfig;
  memory: DeviceMemory;
  /** Set when the clinic could not be loaded. */
  clinicError: boolean;
}

export const SignupContext = createContext<SignupStore | null>(null);

/** The sign-up store. Must be used under a SignupProvider. */
export function useSignup(): SignupStore {
  const store = useContext(SignupContext);
  if (!store) throw new Error('useSignup must be used inside a SignupProvider');
  return store;
}
