import { useEffect } from 'react';
import { useSignup } from '../state';
import { usePatientLookup } from './usePatientLookup';

/**
 * After a refresh or "Continue", the record itself is gone: it is never written to the
 * device. A patient who had already been confirmed is looked up again here, quietly, and
 * a record that is found is confirmed again, so the sign-up carries on where it stopped.
 * Renders nothing.
 */
export function LookupSync() {
  const { state, dispatch } = useSignup();
  const { identity, run } = usePatientLookup();
  const { lookup, confirmed } = state.draft;
  const wasConfirmed = confirmed.includes('patient');

  useEffect(() => {
    if (wasConfirmed && lookup.status === 'idle' && identity) void run();
  }, [wasConfirmed, lookup.status, identity, run]);

  useEffect(() => {
    if (wasConfirmed && lookup.status === 'found' && !lookup.confirmed) {
      dispatch({ type: 'lookup/confirm' });
    }
  }, [wasConfirmed, lookup.status, lookup.confirmed, dispatch]);

  return null;
}
