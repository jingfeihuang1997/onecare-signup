import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSignup } from '../state';

interface StartedProps {
  /** Where the Start screen of this option is. */
  start: string;
  children: ReactNode;
}

/** Sends a deep link back to Start when there is no sign-up in progress to show. */
export function Started({ start, children }: StartedProps) {
  const { state } = useSignup();
  if (state.draft.forWhom === null) return <Navigate to={start} replace />;
  return children;
}
