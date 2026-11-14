import { useCallback, useRef, useState } from 'react';
import { useServices } from '../services';
import { parseDob, useSignup } from '../state';
import type { LookupResult, Patient } from '../types';

function identityOf(patient: Patient): string | null {
  const birth = parseDob(patient.dob);
  const first = patient.firstName.trim().toLowerCase();
  const last = patient.lastName.trim().toLowerCase();
  if (!first || !last || !birth) return null;
  return `${first}|${last}|${birth.year}-${birth.month}-${birth.day}`;
}

/**
 * Runs the record lookup for the patient in the draft (SPEC 5.2) and loads the vaccine
 * status that goes with the answer. If the name or date of birth changes while a lookup
 * is in flight, its answer is dropped.
 */
export function usePatientLookup() {
  const services = useServices();
  const { state, dispatch } = useSignup();
  const [looking, setLooking] = useState(false);
  const [failed, setFailed] = useState(false);
  const patient = state.draft.patient;
  const latest = useRef(patient);
  latest.current = patient;
  const inFlight = useRef<{ identity: string; promise: Promise<LookupResult | null> } | null>(null);

  /** The identity the lookup would use, or null while name and date of birth are incomplete. */
  const identity = identityOf(patient);

  const run = useCallback((): Promise<LookupResult | null> => {
    const asked = identityOf(latest.current);
    if (!asked) return Promise.resolve(null);
    if (inFlight.current?.identity === asked) return inFlight.current.promise;

    const { firstName, lastName, dob } = latest.current;
    setLooking(true);
    setFailed(false);
    const promise = (async () => {
      try {
        const result = await services.lookupPatient(firstName, lastName, dob);
        const statuses = await services.getVaccineStatus(result.maskedRecord?.patientId ?? null);
        if (identityOf(latest.current) !== asked) return null;
        dispatch({ type: 'lookup/result', result, statuses });
        return result;
      } catch {
        if (identityOf(latest.current) === asked) setFailed(true);
        return null;
      } finally {
        if (inFlight.current?.identity === asked) {
          inFlight.current = null;
          setLooking(false);
        }
      }
    })();
    inFlight.current = { identity: asked, promise };
    return promise;
  }, [services, dispatch]);

  return { identity, looking, failed, run };
}
