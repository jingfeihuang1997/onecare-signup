import type { Signature, SignupDraft } from '../types';

interface SigningContext {
  now: Date;
  userAgent: string;
  consentVersion: string;
}

/**
 * Builds the record stored with a submitted sign-up (SPEC 5.7): signer name, signer role,
 * method, ISO timestamp, consent text version and user agent. Returns null until a signer
 * is chosen. Whether the draft may be submitted at all is decided by the canSubmit selector.
 */
export function buildSignature(draft: SignupDraft, context: SigningContext): Signature | null {
  const { sign } = draft;
  if (sign.signerRole === null || sign.signerName.trim() === '') return null;
  return {
    signerName: sign.signerName.trim(),
    signerRole: sign.signerRole,
    method: sign.method,
    drawing: sign.method === 'drawn' ? sign.drawing : null,
    signedAt: context.now.toISOString(),
    consentVersion: context.consentVersion,
    userAgent: context.userAgent,
  };
}
