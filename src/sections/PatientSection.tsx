import { useEffect, useRef, useState } from 'react';
import {
  Button,
  DateOfBirthField,
  Field,
  Note,
  ReasonList,
  ReviewList,
  type ReviewRow,
} from '../components';
import { formatDate, useI18n } from '../i18n';
import {
  calendarDay,
  compareDates,
  fieldRules,
  isFilled,
  parseDob,
  patientCallName,
  patientFullName,
  toIsoDate,
  useSignup,
} from '../state';
import type { DateOfBirth } from '../types';
import { focusSoon } from './focusSoon';
import { SectionActions } from './SectionActions';
import { usePatientLookup } from './usePatientLookup';
import { useValidation } from './useValidation';

const IDS = {
  firstName: 'patient-first-name',
  lastName: 'patient-last-name',
  dob: 'patient-dob',
} as const;

function isEmptyDob(dob: DateOfBirth): boolean {
  return !dob.month && !dob.day && !dob.year;
}

/** "Why we ask" for the Patient section. */
export function PatientWhy() {
  const { t } = useI18n();
  return (
    <ReasonList
      draft
      items={[
        { field: t('patient.name'), reason: t('reason.patient.name') },
        { field: t('patient.preferredName'), reason: t('reason.patient.preferredName') },
        { field: t('dob.legend'), reason: t('reason.patient.dob') },
      ]}
    />
  );
}

/**
 * Patient (SPEC 5.2): name, preferred name and date of birth, then the record lookup.
 * Found: the record as review rows to confirm. Not found: a gentle note, and on we go.
 */
export function PatientSection() {
  const { t, language } = useI18n();
  const { state, dispatch, config } = useSignup();
  const { draft } = state;
  const { patient, lookup } = draft;
  const lookupRun = usePatientLookup();
  // True while the person is changing a field of a record that was found.
  const [editing, setEditing] = useState(false);

  const self = draft.forWhom === 'self';
  const name = patientCallName(draft);
  const rules = fieldRules(state);

  const birth = parseDob(patient.dob);
  const dobError = isEmptyDob(patient.dob)
    ? t('error.dobMissing')
    : !birth
      ? t('error.dobInvalid')
      : compareDates(birth, calendarDay(new Date())) > 0
        ? t('error.dobFuture')
        : null;
  const errors = {
    firstName: isFilled(patient.firstName) ? null : t('error.firstName'),
    lastName: isFilled(patient.lastName) ? null : t('error.lastName'),
    dob: dobError,
  };
  const validation = useValidation(errors);
  const fieldsValid = !errors.firstName && !errors.lastName && !errors.dob;

  // Look the record up shortly after name and date of birth are complete.
  const { identity, run } = lookupRun;
  const needsLookup = fieldsValid && identity !== null && lookup.status === 'idle';
  useEffect(() => {
    if (!needsLookup) return;
    const timer = setTimeout(() => void run(), config.lookupDelayMs);
    return () => clearTimeout(timer);
  }, [needsLookup, identity, run, config.lookupDelayMs]);

  // When the record replaces the fields, the input that had focus is gone. Move focus to
  // the top of the record so keyboard and screen-reader users are not left nowhere.
  const showRecord = lookup.status === 'found' && lookup.record !== null && !editing;
  const recordLead = useRef<HTMLParagraphElement>(null);
  const hadFields = useRef(!showRecord);
  useEffect(() => {
    if (showRecord && hadFields.current) recordLead.current?.focus();
    hadFields.current = !showRecord;
  }, [showRecord]);

  const minorNote = rules.requiresHelper ? (
    <Note>{self ? t('patient.minorNote.self') : t('patient.minorNote', { name })}</Note>
  ) : null;

  // --- Record found: review rows to confirm -------------------------------
  if (showRecord && lookup.record) {
    const record = lookup.record;
    const edit = () => {
      setEditing(true);
      focusSoon(IDS.firstName);
    };
    const rows: ReviewRow[] = [
      { id: 'name', label: t('patient.name'), value: patientFullName(draft), onClick: edit },
      {
        id: 'preferred',
        label: t('patient.review.preferred'),
        value: patient.preferredName.trim() || t('patient.review.addName'),
        onClick: edit,
      },
      {
        id: 'dob',
        label: t('dob.legend'),
        value: birth ? formatDate(toIsoDate(birth), language) : '',
        onClick: edit,
      },
    ];
    // What the pharmacy has on file arrives masked. It is shown, not edited, here.
    if (record.address) rows.push({ id: 'address', label: t('patient.review.address'), value: record.address });
    if (record.phone) rows.push({ id: 'phone', label: t('patient.review.phone'), value: record.phone });
    if (record.insurance) {
      rows.push({
        id: 'insurance',
        label: t('patient.review.insurance'),
        value:
          record.insurance.kind === 'medicare'
            ? t('record.medicareEnding', { ending: record.insurance.ending })
            : record.insurance.company,
      });
    }
    const pharmacy = state.clinic?.pharmacy.name ?? '';
    return (
      <>
        <p className="oc-lead" tabIndex={-1} ref={recordLead}>
          {t('patient.foundLead')}
        </p>
        <Note>
          {self ? t('patient.foundNote.self', { pharmacy }) : t('patient.foundNote', { name, pharmacy })}
        </Note>
        <ReviewList rows={rows} />
        {minorNote}
        <SectionActions
          label={t('patient.confirm')}
          beforeContinue={() => {
            dispatch({ type: 'lookup/confirm' });
            return true;
          }}
        />
        <Button
          variant="link"
          onClick={() => {
            dispatch({ type: 'lookup/reject' });
            validation.reset();
            focusSoon(IDS.firstName);
          }}
        >
          {self ? t('patient.reject.self') : t('patient.reject', { name })}
        </Button>
      </>
    );
  }

  // --- The fields ---------------------------------------------------------
  const onContinue = async (): Promise<boolean> => {
    if (!validation.validate({ firstName: IDS.firstName, lastName: IDS.lastName, dob: `${IDS.dob}-month` })) {
      return false;
    }
    // Nothing moves on before the lookup has answered.
    const result = lookup.status === 'idle' ? await lookupRun.run() : { found: lookup.status === 'found' };
    if (!result) return false;
    if (result.found) {
      // Show the record for the person to confirm instead of moving on.
      setEditing(false);
      return false;
    }
    return true;
  };

  return (
    <>
      <p className="oc-lead">{t('patient.lead')}</p>
      <Field
        id={IDS.firstName}
        label={t('patient.firstName')}
        autoComplete="given-name"
        value={patient.firstName}
        error={validation.shown('firstName')}
        onChange={(event) => dispatch({ type: 'patient/update', patch: { firstName: event.target.value } })}
        onBlur={() => validation.touch('firstName')}
      />
      <Field
        id={IDS.lastName}
        label={t('patient.lastName')}
        autoComplete="family-name"
        value={patient.lastName}
        error={validation.shown('lastName')}
        onChange={(event) => dispatch({ type: 'patient/update', patch: { lastName: event.target.value } })}
        onBlur={() => validation.touch('lastName')}
      />
      <Field
        label={t('patient.preferredName')}
        optional
        autoComplete="off"
        placeholder={self ? t('patient.preferredPlaceholder.self') : t('patient.preferredPlaceholder')}
        value={patient.preferredName}
        onChange={(event) => dispatch({ type: 'patient/update', patch: { preferredName: event.target.value } })}
      />
      <DateOfBirthField
        id={IDS.dob}
        value={patient.dob}
        error={validation.shown('dob')}
        onChange={(dob) => dispatch({ type: 'patient/update', patch: { dob } })}
        onBlur={() => validation.touch('dob')}
      />
      <div aria-live="polite">
        {lookupRun.looking ? <p className="oc-small">{t('patient.looking')}</p> : null}
        {lookupRun.failed ? <Note warn>{t('error.lookupFailed')}</Note> : null}
        {lookup.status === 'notFound' && fieldsValid ? (
          <Note>{self ? t('patient.notFound.self') : t('patient.notFound', { name })}</Note>
        ) : null}
      </div>
      {minorNote}
      <SectionActions beforeContinue={onContinue} busy={lookupRun.looking} />
    </>
  );
}
