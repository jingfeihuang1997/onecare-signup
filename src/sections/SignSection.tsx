import { useContext, useEffect, useState } from 'react';
import {
  Button,
  Choice,
  Field,
  Note,
  Segmented,
  SignatureBox,
  SignaturePad,
} from '../components';
import { useI18n } from '../i18n';
import { useServices } from '../services';
import {
  buildSignature,
  fieldRules,
  hasHelper,
  helperFullName,
  isFilled,
  missingSections,
  patientCallName,
  patientFullName,
  useSignup,
} from '../state';
import type { SignatureMethod, SignerRole, SignState } from '../types';
import { SectionActions } from './SectionActions';
import { ShellActionsContext } from './shellActions';

const NAME_ID = 'sign-signer-name';

/**
 * Review and sign (SPEC 5.7 and 10.1, item 9). Who is signing, the signature (typed by
 * default, or drawn), and the two consents. Consents start unticked; pressing the button
 * with one unticked explains that pressing again agrees to all of them and finishes.
 */
export function SignSection() {
  const { t } = useI18n();
  const { state, dispatch, config } = useSignup();
  const services = useServices();
  const shell = useContext(ShellActionsContext);

  const { draft } = state;
  const { sign } = draft;
  const helperPath = hasHelper(state);
  const { requiresHelper } = fieldRules(state);
  const name = patientCallName(draft);
  const patientName = patientFullName(draft);
  const helperName = helperFullName(draft.helper);
  const pharmacy = state.clinic?.pharmacy.name ?? '';

  const [tried, setTried] = useState(false);
  const [armed, setArmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const update = (patch: Partial<SignState>) => {
    setArmed(false);
    dispatch({ type: 'sign/update', patch });
  };

  // The helper signs by default when there is one; a patient under 18 cannot sign.
  const canPatientSign = !requiresHelper;
  const allowed = sign.signerRole === 'helper' ? helperPath : sign.signerRole === 'patient' && canPatientSign;
  const defaultRole: SignerRole = helperPath ? 'helper' : 'patient';
  const defaultName = defaultRole === 'helper' ? helperName : patientName;
  useEffect(() => {
    if (!allowed) {
      dispatch({ type: 'sign/update', patch: { signerRole: defaultRole, signerName: defaultName } });
    }
  }, [allowed, defaultRole, defaultName, dispatch]);

  const chooseRole = (signerRole: SignerRole) =>
    update({ signerRole, signerName: signerRole === 'helper' ? helperName : patientName });

  const missing = missingSections(state, config);
  const nameMissing = !isFilled(sign.signerName);
  const drawingMissing = sign.method === 'drawn' && sign.drawing === null;
  const boxesTicked =
    (sign.method === 'drawn' || sign.agreeTyped) && sign.pharmacyConsent && sign.onecareConsent;
  const signingForOther = sign.signerRole === 'helper';

  const submit = async (): Promise<boolean> => {
    setTried(true);
    setFailed(false);
    if (missing.length > 0 || drawingMissing) return false;
    if (nameMissing) {
      document.getElementById(NAME_ID)?.focus();
      return false;
    }
    let final = sign;
    if (!boxesTicked) {
      // First press: say what a second press will do. Second press: tick them and go on.
      if (!armed) {
        setArmed(true);
        return false;
      }
      final = { ...sign, agreeTyped: sign.method === 'typed' ? true : sign.agreeTyped, pharmacyConsent: true, onecareConsent: true };
      dispatch({ type: 'sign/update', patch: final });
    }
    const signed = { ...draft, sign: final };
    const signature = buildSignature(signed, {
      now: new Date(),
      userAgent: navigator.userAgent,
      consentVersion: config.consentVersion,
    });
    if (!signature) return false;
    setSending(true);
    try {
      const { confirmationId } = await services.submitSignup({ ...signed, signature });
      dispatch({ type: 'submitted', signature, confirmationId });
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      setSending(false);
    }
  };

  const submitLabel = shell?.continueLabel ?? t('sign.submit');

  return (
    <>
      <p className="oc-lead">{t('sign.lead')}</p>
      {shell?.reviewList}

      <fieldset className="oc-fieldset">
        <legend className="oc-label">{t('sign.who')}</legend>
        {canPatientSign ? (
          <Choice
            kind="radio"
            name="signer"
            title={patientName}
            sub={t('sign.thePatient')}
            checked={sign.signerRole === 'patient'}
            onChange={() => chooseRole('patient')}
          />
        ) : null}
        {helperPath ? (
          <Choice
            kind="radio"
            name="signer"
            title={helperName}
            sub={t('sign.signingFor', { name })}
            checked={sign.signerRole === 'helper'}
            onChange={() => chooseRole('helper')}
          />
        ) : null}
      </fieldset>

      <Field
        id={NAME_ID}
        label={t('sign.signerName')}
        autoComplete="name"
        value={sign.signerName}
        hint={t('sign.signerNameHint')}
        error={tried && nameMissing ? t('error.signerName') : undefined}
        onChange={(event) => update({ signerName: event.target.value })}
      />

      <div className="oc-field">
        <span className="oc-label">{t('sign.signature')}</span>
        <Segmented<SignatureMethod>
          label={t('sign.how')}
          value={sign.method}
          onChange={(method) => update({ method })}
          options={[
            { value: 'typed', label: t('sign.type') },
            { value: 'drawn', label: t('sign.draw') },
          ]}
        />
        {sign.method === 'typed' ? (
          <>
            <SignatureBox name={sign.signerName} />
            <span className="oc-hint">{t('sign.typedHint')}</span>
          </>
        ) : (
          <SignaturePad
            label={t('sign.drawArea')}
            clearLabel={t('sign.clear')}
            drawnLabel={t('sign.drawn')}
            value={sign.drawing}
            onChange={(drawing) => update({ drawing })}
          />
        )}
      </div>

      {sign.method === 'typed' ? (
        <Choice kind="checkbox" top checked={sign.agreeTyped} onChange={(agreeTyped) => update({ agreeTyped })}>
          {t('sign.agreeTyped')}
        </Choice>
      ) : null}

      <Choice
        kind="checkbox"
        top
        title={t('sign.pharmacyConsent')}
        checked={sign.pharmacyConsent}
        onChange={(pharmacyConsent) => update({ pharmacyConsent })}
      >
        {signingForOther
          ? t('sign.pharmacyConsentText', { patient: patientName, name, pharmacy })
          : t('sign.pharmacyConsentText.self', { pharmacy })}
      </Choice>
      <Button variant="link" aria-expanded={showInfo} onClick={() => setShowInfo((open) => !open)}>
        {t('sign.readInfo')}
      </Button>
      {showInfo ? <Note>{t('sign.infoPlaceholder')}</Note> : null}

      <Choice
        kind="checkbox"
        top
        title={t('sign.onecareConsent')}
        checked={sign.onecareConsent}
        onChange={(onecareConsent) => update({ onecareConsent })}
      >
        {t('sign.onecareConsentText')}
      </Choice>
      <Button variant="link" aria-expanded={showTerms} onClick={() => setShowTerms((open) => !open)}>
        {t('sign.readTerms')}
      </Button>
      {showTerms ? <Note>{t('sign.termsPlaceholder')}</Note> : null}

      <div aria-live="polite" className="oc-stack oc-stack--tight">
        {tried && missing.length > 0 ? (
          <Note warn>
            {t('error.signMissing', {
              sections: missing.map((section) => t(`section.${section}`)).join(t('common.separator')),
            })}
          </Note>
        ) : null}
        {tried && drawingMissing ? <Note warn>{t('error.signature')}</Note> : null}
        {armed && !boxesTicked ? <Note warn>{t('sign.pressAgain', { button: submitLabel })}</Note> : null}
        {failed ? <Note warn>{t('error.submit')}</Note> : null}
      </div>
      <SectionActions beforeContinue={submit} busy={sending} />
    </>
  );
}
