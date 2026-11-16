import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Button, CameraView, Choice, Field, Note, ReasonList, useSubHeading } from '../components';
import { useI18n, type StringKey } from '../i18n';
import { useServices } from '../services';
import {
  fieldRules,
  formatMedicareNumber,
  isFilled,
  isMedicareNumber,
  isSectionValid,
  isSsnLast4,
  patientCallName,
  useSignup,
} from '../state';
import type { CardFieldName, CardFields, CardSide, InsuranceAnswer, InsuranceKind } from '../types';
import { focusSoon } from './focusSoon';
import { SectionActions } from './SectionActions';
import { useValidation } from './useValidation';

/** A reading below this confidence is marked for the person to check. */
const CHECK_BELOW = 0.7;

const IDS = {
  medicareNumber: 'insurance-medicare-number',
  company: 'insurance-company',
  planName: 'insurance-plan-name',
  bin: 'insurance-bin',
  pcn: 'insurance-pcn',
  memberId: 'insurance-member-id',
  ssnLast4: 'insurance-ssn4',
} as const;

/** The typed-in details of "Other insurance" that are required, in the order shown. */
const REQUIRED_CARD_FIELDS = ['planName', 'bin', 'pcn'] as const;
const TYPE_IN = 'insurance-type-in';
const UPLOAD_INSTEAD = 'insurance-upload-instead';

const ANSWERS: readonly { value: InsuranceAnswer; label: StringKey }[] = [
  { value: 'yes', label: 'insurance.has.yes' },
  { value: 'no', label: 'insurance.has.no' },
  { value: 'notSure', label: 'insurance.has.notSure' },
];

const KINDS: readonly { value: InsuranceKind; label: StringKey }[] = [
  { value: 'medicare', label: 'insurance.kind.medicare' },
  { value: 'other', label: 'insurance.kind.other' },
];

const SIDES: readonly { side: CardSide; title: StringKey; alt: StringKey }[] = [
  { side: 'front', title: 'insurance.drop.front', alt: 'insurance.photoAlt.front' },
  { side: 'back', title: 'insurance.drop.back', alt: 'insurance.photoAlt.back' },
];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

/** "Why we ask" for Insurance. */
export function InsuranceWhy() {
  const { t } = useI18n();
  return (
    <ReasonList
      draft
      items={[
        { field: t('insurance.card.photos'), reason: t('reason.insurance.cardPhoto') },
        { field: t('insurance.medicareNumber'), reason: t('reason.insurance.medicareNumber') },
        { field: t('insurance.company'), reason: t('reason.insurance.company') },
        { field: t('insurance.planName'), reason: t('reason.insurance.planName') },
        { field: t('insurance.bin'), reason: t('reason.insurance.bin') },
        { field: t('insurance.pcn'), reason: t('reason.insurance.pcn') },
        { field: t('insurance.memberId'), reason: t('reason.insurance.memberId') },
        { field: t('insurance.groupId'), reason: t('reason.insurance.groupId') },
        { field: t('insurance.ssn4'), reason: t('reason.insurance.ssn4') },
      ]}
    />
  );
}

/**
 * Insurance (SPEC 10.1, items 15 and 21). First "Do you have health insurance?": Yes, No,
 * or I'm not sure. Yes asks for photos of the card, or the details typed in: from age 65
 * the Medicare number, or else company, plan name, BIN, PCN, member ID and group ID, each
 * with the last 4 of the SSN. No and "I'm not sure" complete the section.
 */
export function InsuranceSection() {
  const { t } = useI18n();
  const { state, dispatch, config } = useSignup();
  const services = useServices();
  const Heading = useSubHeading();

  const { draft } = state;
  const { insurance } = draft;
  const { has, kind, entry } = insurance;
  const self = draft.forWhom === 'self';
  const name = patientCallName(draft);
  const manual = has === 'yes' && entry === 'manual';
  const { showMedicare } = fieldRules(state);

  // Medicare is offered from age 65. Under 65 there is one type, so it is not asked.
  useEffect(() => {
    if (manual && !showMedicare && kind !== 'other') {
      dispatch({ type: 'insurance/update', patch: { kind: 'other' } });
    }
  }, [manual, showMedicare, kind, dispatch]);

  const [camera, setCamera] = useState<{ side: CardSide; stream: MediaStream } | null>(null);
  // Once the camera turned out to be missing or refused, the buttons open the phone's own
  // camera through a file input straight away. There is no error screen.
  const [noCamera, setNoCamera] = useState(false);
  const [reading, setReading] = useState<CardSide | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [secondCard, setSecondCard] = useState(false);
  const [overZone, setOverZone] = useState<CardSide | null>(null);
  const [triedContinue, setTriedContinue] = useState(false);

  const captureInputs = useRef<Partial<Record<CardSide, HTMLInputElement | null>>>({});
  const uploadInputs = useRef<Partial<Record<CardSide, HTMLInputElement | null>>>({});
  const takeButtons = useRef<Partial<Record<CardSide, HTMLButtonElement | null>>>({});

  const errors = {
    medicareNumber:
      manual && kind === 'medicare' && !isMedicareNumber(insurance.medicareNumber)
        ? t('error.medicareNumber')
        : null,
    company: manual && kind === 'other' && !isFilled(insurance.card.company) ? t('error.cardDetail') : null,
    planName: manual && kind === 'other' && !isFilled(insurance.card.planName) ? t('error.cardDetail') : null,
    bin: manual && kind === 'other' && !isFilled(insurance.card.bin) ? t('error.cardDetail') : null,
    pcn: manual && kind === 'other' && !isFilled(insurance.card.pcn) ? t('error.cardDetail') : null,
    memberId: manual && kind === 'other' && !isFilled(insurance.card.memberId) ? t('error.memberId') : null,
    ssnLast4: manual && kind !== null && !isSsnLast4(insurance.ssnLast4) ? t('error.ssn4') : null,
  };
  const validation = useValidation(errors);

  const images: Record<CardSide, string | null> = { front: insurance.frontImage, back: insurance.backImage };

  /** Keeps the photo, reads it, and fills in the details, noting which ones to check. */
  const addPhoto = async (side: CardSide, dataUrl: string) => {
    dispatch({
      type: 'insurance/update',
      patch: side === 'front' ? { frontImage: dataUrl } : { backImage: dataUrl },
    });
    setReading(side);
    setReadFailed(false);
    try {
      const result = await services.readCard(dataUrl, side);
      const unsure: CardFieldName[] = [];
      const card: Partial<CardFields> = {};
      for (const [field, value] of Object.entries(result.fields) as [CardFieldName, { value: string; confidence: number }][]) {
        if (value.confidence < CHECK_BELOW) unsure.push(field);
        if (field === 'medicareNumber') {
          dispatch({ type: 'insurance/update', patch: { medicareNumber: formatMedicareNumber(value.value) } });
        } else {
          card[field] = value.value;
        }
      }
      if (Object.keys(card).length > 0) dispatch({ type: 'insurance/card', patch: card });
      dispatch({ type: 'insurance/check', add: unsure });
    } catch {
      setReadFailed(true);
    } finally {
      setReading(null);
    }
  };

  const addFile = async (side: CardSide, file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    await addPhoto(side, await readAsDataUrl(file));
  };

  /** "Take photo": asks for the camera at once; without one, opens the phone's own camera. */
  const takePhoto = async (side: CardSide) => {
    const media = navigator.mediaDevices;
    if (noCamera || !media?.getUserMedia) {
      setNoCamera(true);
      captureInputs.current[side]?.click();
      return;
    }
    try {
      const stream = await media.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      setCamera({ side, stream });
    } catch {
      setNoCamera(true);
      captureInputs.current[side]?.click();
    }
  };

  const closeCamera = (side: CardSide) => {
    setCamera(null);
    setTimeout(() => takeButtons.current[side]?.focus(), 0);
  };

  const setCard = (field: keyof CardFields, value: string) => {
    dispatch({ type: 'insurance/card', patch: { [field]: value } });
    dispatch({ type: 'insurance/check', remove: [field] });
  };

  const onDrop = (side: CardSide) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOverZone(null);
    void addFile(side, event.dataTransfer.files[0]);
  };

  const fileInput = (side: CardSide, capture: boolean) => (
    <input
      key={`${side}-${capture ? 'capture' : 'upload'}`}
      className="oc-sr"
      type="file"
      accept="image/*"
      capture={capture ? 'environment' : undefined}
      tabIndex={-1}
      aria-hidden="true"
      data-side={side}
      data-capture={capture ? 'true' : undefined}
      ref={(element) => {
        (capture ? captureInputs : uploadInputs).current[side] = element;
      }}
      onChange={(event) => {
        void addFile(side, event.target.files?.[0]);
        event.target.value = '';
      }}
    />
  );

  const sectionValid = isSectionValid(state, 'insurance', config);
  const onFile = draft.lookup.record?.insurance;
  const pharmacy = state.clinic?.pharmacy.name ?? '';
  const checkHint = (field: CardFieldName) =>
    insurance.checkFields.includes(field) ? t('insurance.fieldCheck') : undefined;
  const readDetails = [insurance.card.company.trim(), insurance.card.memberId.trim()]
    .filter(Boolean)
    .join(t('common.separator'));

  const named = (action: string, side: StringKey) => `${action}${t('insurance.ofSide', { side: t(side) })}`;

  const ssnField = (
    <Field
      id={IDS.ssnLast4}
      label={t('insurance.ssn4')}
      short
      autoComplete="off"
      inputMode="numeric"
      maxLength={4}
      value={insurance.ssnLast4}
      error={validation.shown('ssnLast4')}
      onChange={(event) =>
        dispatch({
          type: 'insurance/update',
          patch: { ssnLast4: event.target.value.replace(/\D/g, '').slice(0, 4) },
        })
      }
      onBlur={() => validation.touch('ssnLast4')}
    />
  );

  return (
    <>
      <fieldset className="oc-fieldset">
        <legend className="oc-label">
          {self ? t('insurance.has.legend.self') : t('insurance.has.legend', { name })}
        </legend>
        <span className="oc-hint">{t('insurance.has.hint')}</span>
        <div className="oc-choices">
          {ANSWERS.map((answer) => (
            <Choice
              key={answer.value}
              kind="radio"
              name="insurance-has"
              title={t(answer.label)}
              checked={has === answer.value}
              onChange={() => dispatch({ type: 'insurance/update', patch: { has: answer.value } })}
            />
          ))}
        </div>
      </fieldset>

      {has === 'no' ? <Note>{t('insurance.noneNote')}</Note> : null}
      {has === 'notSure' ? <Note>{t('insurance.notSureNote')}</Note> : null}

      {has === 'yes' && !manual ? (
        <>
          <hr className="oc-divider" />
          <Heading className="oc-h2">
            {self ? t('insurance.card.title.self') : t('insurance.card.title', { name })}
          </Heading>
          <p className="oc-small">{t('insurance.card.hint')}</p>
          {SIDES.map(({ side }) => fileInput(side, true))}
          {SIDES.map(({ side }) => fileInput(side, false))}
          <div className="oc-grid">
            {SIDES.map(({ side, title, alt }) => (
              <div
                key={side}
                className={overZone === side ? 'oc-drop is-over' : 'oc-drop'}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverZone(side);
                }}
                onDragLeave={() => setOverZone(null)}
                onDrop={onDrop(side)}
              >
                <span className="oc-drop__title">{t(title)}</span>
                {images[side] ? (
                  <div className="oc-rowflex">
                    <img className="oc-thumb" src={images[side] ?? undefined} alt={t(alt)} />
                    <span className="oc-hint">{t('insurance.drop.added')}</span>
                  </div>
                ) : null}
                {/* The name says which side: both tiles have the same two buttons. */}
                <Button
                  small
                  icon="upload"
                  aria-label={named(images[side] ? t('insurance.replacePhoto') : t('insurance.uploadPhoto'), title)}
                  onClick={() => uploadInputs.current[side]?.click()}
                >
                  {images[side] ? t('insurance.replacePhoto') : t('insurance.uploadPhoto')}
                </Button>
                <Button
                  variant="link"
                  icon="camera"
                  aria-label={named(images[side] ? t('insurance.retake') : t('insurance.takePhoto'), title)}
                  ref={(element) => {
                    takeButtons.current[side] = element;
                  }}
                  onClick={() => void takePhoto(side)}
                >
                  {images[side] ? t('insurance.retake') : t('insurance.takePhoto')}
                </Button>
              </div>
            ))}
          </div>

          <div aria-live="polite" className="oc-stack oc-stack--tight">
            {reading ? <p className="oc-small">{t('insurance.reading')}</p> : null}
            {readFailed ? <Note warn>{t('insurance.readFailed')}</Note> : null}
            {!reading && readDetails ? (
              <Note>{t('insurance.readResult', { details: readDetails })}</Note>
            ) : null}
          </div>

          <Button
            variant="link"
            id={TYPE_IN}
            onClick={() => {
              // What the photo already filled in shows up as "Other insurance" to check.
              dispatch({
                type: 'insurance/update',
                patch: { entry: 'manual', kind: kind ?? (readDetails ? 'other' : null) },
              });
              focusSoon(UPLOAD_INSTEAD);
            }}
          >
            {t('insurance.typeIn')}
          </Button>
          <Button variant="link" aria-expanded={secondCard} onClick={() => setSecondCard((open) => !open)}>
            {t('insurance.secondCard')}
          </Button>
          {secondCard ? <Note>{t('insurance.secondCardNote')}</Note> : null}
        </>
      ) : null}

      {manual ? (
        <>
          <hr className="oc-divider" />
          <Heading className="oc-h2">
            {self ? t('insurance.details.title.self') : t('insurance.details.title', { name })}
          </Heading>
          {showMedicare ? (
            <fieldset className="oc-fieldset">
              <legend className="oc-label">{t('insurance.kind.legend')}</legend>
              <div className="oc-choices">
                {KINDS.map((option) => (
                  <Choice
                    key={option.value}
                    kind="radio"
                    name="insurance-kind"
                    title={t(option.label)}
                    checked={kind === option.value}
                    onChange={() => dispatch({ type: 'insurance/update', patch: { kind: option.value } })}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}

          {kind === 'medicare' ? (
            <>
              {onFile?.kind === 'medicare' ? (
                <Note>{t('insurance.onFile', { pharmacy, ending: onFile.ending })}</Note>
              ) : null}
              <Field
                id={IDS.medicareNumber}
                label={t('insurance.medicareNumber')}
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="1EG4-TE5-MK73"
                value={insurance.medicareNumber}
                hint={checkHint('medicareNumber') ?? t('insurance.medicareHint')}
                error={validation.shown('medicareNumber')}
                onChange={(event) => {
                  dispatch({
                    type: 'insurance/update',
                    patch: { medicareNumber: formatMedicareNumber(event.target.value) },
                  });
                  dispatch({ type: 'insurance/check', remove: ['medicareNumber'] });
                }}
                onBlur={() => validation.touch('medicareNumber')}
              />
              {ssnField}
            </>
          ) : null}

          {kind === 'other' ? (
            <>
              <Field
                id={IDS.company}
                label={t('insurance.company')}
                autoComplete="off"
                value={insurance.card.company}
                hint={checkHint('company') ?? t('insurance.companyHint')}
                error={validation.shown('company')}
                onChange={(event) => setCard('company', event.target.value)}
                onBlur={() => validation.touch('company')}
              />
              <div className="oc-grid">
                {REQUIRED_CARD_FIELDS.map((field) => (
                  <Field
                    key={field}
                    id={IDS[field]}
                    label={t(`insurance.${field}`)}
                    autoComplete="off"
                    value={insurance.card[field]}
                    hint={checkHint(field)}
                    error={validation.shown(field)}
                    onChange={(event) => setCard(field, event.target.value)}
                    onBlur={() => validation.touch(field)}
                  />
                ))}
                <Field
                  id={IDS.memberId}
                  label={t('insurance.memberId')}
                  autoComplete="off"
                  value={insurance.card.memberId}
                  hint={checkHint('memberId')}
                  error={validation.shown('memberId')}
                  onChange={(event) => setCard('memberId', event.target.value)}
                  onBlur={() => validation.touch('memberId')}
                />
                <Field
                  label={t('insurance.groupId')}
                  optional
                  autoComplete="off"
                  value={insurance.card.groupId}
                  hint={checkHint('groupId') ?? t('insurance.groupHint')}
                  onChange={(event) => setCard('groupId', event.target.value)}
                />
              </div>
              {ssnField}
            </>
          ) : null}

          <Button
            variant="link"
            id={UPLOAD_INSTEAD}
            onClick={() => {
              dispatch({ type: 'insurance/update', patch: { entry: 'photo' } });
              focusSoon(TYPE_IN);
            }}
          >
            {t('insurance.uploadInstead')}
          </Button>
        </>
      ) : null}

      <div aria-live="polite">
        {triedContinue && !sectionValid && has === null ? <Note warn>{t('error.insuranceHas')}</Note> : null}
        {triedContinue && !sectionValid && has === 'yes' && !manual ? (
          <Note warn>{t('error.insuranceCard')}</Note>
        ) : null}
        {triedContinue && !sectionValid && manual && showMedicare && kind === null ? (
          <Note warn>{t('error.insuranceKind')}</Note>
        ) : null}
      </div>
      <SectionActions
        busy={reading !== null}
        beforeContinue={() => {
          setTriedContinue(true);
          if (!config.insuranceRequired) return true;
          if (!validation.validate(IDS)) return false;
          return sectionValid;
        }}
      />

      {camera ? (
        <CameraView
          stream={camera.stream}
          title={camera.side === 'front' ? t('camera.front') : t('camera.back')}
          onPhoto={(dataUrl) => {
            const { side } = camera;
            closeCamera(side);
            void addPhoto(side, dataUrl);
          }}
          onCancel={() => closeCamera(camera.side)}
          onUpload={() => {
            const { side } = camera;
            closeCamera(side);
            uploadInputs.current[side]?.click();
          }}
        />
      ) : null}
    </>
  );
}
