import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Button, CameraView, Choice, Field, Note, ReasonList, useSubHeading } from '../components';
import { useI18n, type StringKey } from '../i18n';
import { useServices } from '../services';
import {
  fieldRules,
  formatMedicareNumber,
  insuranceKinds,
  isFilled,
  isMedicareNumber,
  isSectionValid,
  isSsnLast4,
  patientCallName,
  useSignup,
} from '../state';
import type { CardFieldName, CardFields, CardSide, InsuranceKind } from '../types';
import { focusSoon } from './focusSoon';
import { SectionActions } from './SectionActions';
import { useIsWide } from './useIsWide';
import { useValidation } from './useValidation';

/** A reading below this confidence is marked for the person to check. */
const CHECK_BELOW = 0.7;

const CARD_FIELDS: readonly { name: keyof CardFields; label: StringKey }[] = [
  { name: 'company', label: 'insurance.company' },
  { name: 'planName', label: 'insurance.planName' },
  { name: 'bin', label: 'insurance.bin' },
  { name: 'pcn', label: 'insurance.pcn' },
  { name: 'memberId', label: 'insurance.memberId' },
  { name: 'groupId', label: 'insurance.groupId' },
];

const IDS = { medicareNumber: 'insurance-medicare-number', ssnLast4: 'insurance-ssn4' } as const;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

/** "Why we ask" for Insurance and Medicare. */
export function InsuranceWhy() {
  const { t } = useI18n();
  return (
    <ReasonList
      draft
      items={[
        { field: t('insurance.medicareNumber'), reason: t('reason.insurance.medicareNumber') },
        { field: t('insurance.ssn4'), reason: t('reason.insurance.ssn4') },
        { field: t('insurance.drop.front'), reason: t('reason.insurance.cardPhoto') },
        { field: t('insurance.company'), reason: t('reason.insurance.company') },
        { field: t('insurance.planName'), reason: t('reason.insurance.planName') },
        { field: t('insurance.bin'), reason: t('reason.insurance.bin') },
        { field: t('insurance.pcn'), reason: t('reason.insurance.pcn') },
        { field: t('insurance.memberId'), reason: t('reason.insurance.memberId') },
        { field: t('insurance.groupId'), reason: t('reason.insurance.groupId') },
      ]}
    />
  );
}

/**
 * Insurance and Medicare (SPEC 5.4 and 10.1, item 10). Medicare is offered from age 65.
 * Any card can be photographed or uploaded and is read into the fields; other insurance
 * can also be typed in; "No insurance" completes the section.
 */
export function InsuranceSection() {
  const { t } = useI18n();
  const { state, dispatch, config } = useSignup();
  const services = useServices();
  const wide = useIsWide();
  const Heading = useSubHeading();

  const { draft } = state;
  const { insurance } = draft;
  const self = draft.forWhom === 'self';
  const name = patientCallName(draft);
  const kinds = insuranceKinds(state);
  const { showMedicare } = fieldRules(state);

  const [camera, setCamera] = useState<{ side: CardSide; stream: MediaStream } | null>(null);
  // Once the camera turned out to be missing or refused, the buttons open the phone's own
  // camera through a file input straight away. There is no error screen.
  const [noCamera, setNoCamera] = useState(false);
  const [reading, setReading] = useState<CardSide | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [typing, setTyping] = useState(false);
  const [secondCard, setSecondCard] = useState(false);
  const [overZone, setOverZone] = useState<CardSide | null>(null);
  const [triedContinue, setTriedContinue] = useState(false);

  const captureInputs = useRef<Partial<Record<CardSide, HTMLInputElement | null>>>({});
  const uploadInputs = useRef<Partial<Record<CardSide, HTMLInputElement | null>>>({});
  const uploadBoth = useRef<HTMLInputElement>(null);
  const takeButtons = useRef<Partial<Record<CardSide, HTMLButtonElement | null>>>({});

  // Medicare is only for 65 and over: if the date of birth changed, drop that choice.
  const kind = insurance.kind;
  useEffect(() => {
    if (kind === 'medicare' && !showMedicare) dispatch({ type: 'insurance/update', patch: { kind: null } });
  }, [kind, showMedicare, dispatch]);

  const errors = {
    medicareNumber:
      kind === 'medicare' && !isMedicareNumber(insurance.medicareNumber) ? t('error.medicareNumber') : null,
    ssnLast4: kind === 'medicare' && !isSsnLast4(insurance.ssnLast4) ? t('error.ssn4') : null,
  };
  const validation = useValidation(errors);

  const images: Record<CardSide, string | null> = { front: insurance.frontImage, back: insurance.backImage };
  const hasCardDetails = Object.values(insurance.card).some(isFilled);
  const showCardFields = kind === 'other' && (typing || hasCardDetails);

  /** Keeps the photo, reads it, fills the fields, and notes which ones to check. */
  const addPhoto = async (side: CardSide, dataUrl: string) => {
    dispatch({
      type: 'insurance/update',
      patch: side === 'front' ? { frontImage: dataUrl, entry: 'photo' } : { backImage: dataUrl, entry: 'photo' },
    });
    if (kind !== 'medicare' && kind !== 'other') return;
    setReading(side);
    setReadFailed(false);
    try {
      const result = await services.readCard(dataUrl, side, kind);
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
      setTyping(true);
    } finally {
      setReading(null);
    }
  };

  const addFile = async (side: CardSide, file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    await addPhoto(side, await readAsDataUrl(file));
  };

  /** "Take a photo": asks for the camera at once; without one, opens the phone's own camera. */
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
    // After the update: the button may have become "Retake" once a photo was added.
    setTimeout(() => takeButtons.current[side]?.focus(), 0);
  };

  const setCard = (field: keyof CardFields, value: string) => {
    dispatch({ type: 'insurance/card', patch: { [field]: value } });
    dispatch({ type: 'insurance/check', remove: [field] });
    if (insurance.entry === null) dispatch({ type: 'insurance/update', patch: { entry: 'manual' } });
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
      ref={(element) => {
        (capture ? captureInputs : uploadInputs).current[side] = element;
      }}
      onChange={(event) => {
        void addFile(side, event.target.files?.[0]);
        event.target.value = '';
      }}
    />
  );

  const sides: readonly { side: CardSide; take: StringKey; added: StringKey; alt: StringKey; drop: StringKey }[] = [
    { side: 'front', take: 'insurance.takeFront', added: 'insurance.frontAdded', alt: 'insurance.photoAlt.front', drop: 'insurance.drop.front' },
    { side: 'back', take: 'insurance.takeBack', added: 'insurance.backAdded', alt: 'insurance.photoAlt.back', drop: 'insurance.drop.back' },
  ];

  const kindLabel = (option: InsuranceKind) =>
    option === 'medicare'
      ? t('insurance.kind.medicare')
      : option === 'none'
        ? t('insurance.kind.none')
        : showMedicare
          ? t('insurance.kind.other')
          : t('insurance.kind.otherOnly');

  const sectionValid = isSectionValid(state, 'insurance', config);
  const onFile = draft.lookup.record?.insurance;
  const pharmacy = state.clinic?.pharmacy.name ?? '';

  return (
    <>
      <p className="oc-lead">{self ? t('insurance.lead.self') : t('insurance.lead', { name })}</p>
      <fieldset className="oc-fieldset">
        <legend className="oc-label">
          {self ? t('insurance.kind.legend.self') : t('insurance.kind.legend', { name })}
        </legend>
        {kinds.map((option) => (
          <Choice
            key={option}
            kind="radio"
            name="insurance-kind"
            title={kindLabel(option)}
            checked={kind === option}
            onChange={() => dispatch({ type: 'insurance/update', patch: { kind: option } })}
          />
        ))}
      </fieldset>

      {kind === 'none' ? <Note>{t('insurance.noneNote')}</Note> : null}

      {kind === 'medicare' || kind === 'other' ? (
        <>
          {sides.map(({ side }) => fileInput(side, true))}
          {sides.map(({ side }) => fileInput(side, false))}
          <input
            className="oc-sr"
            type="file"
            accept="image/*"
            multiple
            tabIndex={-1}
            aria-hidden="true"
            data-side="both"
            ref={uploadBoth}
            onChange={(event) => {
              const [first, second] = [...(event.target.files ?? [])];
              event.target.value = '';
              // One file goes to the side that is still missing; two go to front, then back.
              const firstSide: CardSide = second || !images.front ? 'front' : 'back';
              void addFile(firstSide, first).then(() => (second ? addFile('back', second) : undefined));
            }}
          />

          {wide ? (
            <div className="oc-grid">
              {sides.map(({ side, drop, alt }) => (
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
                  <span className="oc-drop__title">{t(drop)}</span>
                  {images[side] ? (
                    <div className="oc-rowflex">
                      <img className="oc-thumb" src={images[side] ?? undefined} alt={t(alt)} />
                      <span className="oc-hint">{t('insurance.drop.added')}</span>
                    </div>
                  ) : (
                    <span className="oc-hint">{t('insurance.drop.hint')}</span>
                  )}
                  <Button small icon="upload" onClick={() => uploadInputs.current[side]?.click()}>
                    {images[side] ? t('insurance.drop.chooseAnother') : t('insurance.drop.choose')}
                  </Button>
                </div>
              ))}
              <div className="oc-drop">
                <span className="oc-drop__title">{t('insurance.webcam.title')}</span>
                <span className="oc-hint">{t('insurance.webcam.hint')}</span>
                <div className="oc-rowflex oc-rowflex--wrap">
                  {sides.map(({ side, take }) => (
                    <Button
                      key={side}
                      small
                      icon="camera"
                      ref={(element) => {
                        takeButtons.current[side] = element;
                      }}
                      onClick={() => void takePhoto(side)}
                    >
                      {t(take)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {sides.map(({ side, take, added, alt }, index) =>
                images[side] ? (
                  <div className="oc-rowflex" key={side}>
                    <img className="oc-thumb" src={images[side] ?? undefined} alt={t(alt)} />
                    <span className="oc-rowflex__text">{t(added)}</span>
                    <Button
                      small
                      ref={(element) => {
                        takeButtons.current[side] = element;
                      }}
                      onClick={() => void takePhoto(side)}
                    >
                      {t('insurance.retake')}
                    </Button>
                  </div>
                ) : (
                  <Button
                    key={side}
                    variant={index === 0 || images.front ? 'primary' : 'default'}
                    icon="camera"
                    ref={(element) => {
                      takeButtons.current[side] = element;
                    }}
                    onClick={() => void takePhoto(side)}
                  >
                    {t(take)}
                  </Button>
                ),
              )}
              <Button variant="link" onClick={() => uploadBoth.current?.click()}>
                {t('insurance.upload')}
              </Button>
            </>
          )}

          <div aria-live="polite">
            {reading ? <p className="oc-small">{t('insurance.reading')}</p> : null}
            {readFailed ? <Note warn>{t('insurance.readFailed')}</Note> : null}
          </div>

          {kind === 'other' && !showCardFields ? (
            <Button
              variant="link"
              onClick={() => {
                setTyping(true);
                focusSoon('insurance-company');
              }}
            >
              {t('insurance.typeIn')}
            </Button>
          ) : null}

          {showCardFields ? (
            <>
              {insurance.entry === 'photo' && hasCardDetails ? <Note>{t('insurance.check')}</Note> : null}
              <div className="oc-grid">
                {CARD_FIELDS.map((field) => (
                  <Field
                    key={field.name}
                    id={`insurance-${field.name}`}
                    label={t(field.label)}
                    autoComplete="off"
                    value={insurance.card[field.name]}
                    hint={insurance.checkFields.includes(field.name) ? t('insurance.fieldCheck') : undefined}
                    onChange={(event) => setCard(field.name, event.target.value)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {kind === 'medicare' ? (
            <>
              <Heading className="oc-h2">{t('insurance.forMedicare')}</Heading>
              {onFile?.kind === 'medicare' ? (
                <Note>{t('insurance.onFile', { pharmacy, ending: onFile.ending })}</Note>
              ) : null}
              <div className="oc-grid">
                <Field
                  id={IDS.medicareNumber}
                  label={t('insurance.medicareNumber')}
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="1EG4-TE5-MK73"
                  value={insurance.medicareNumber}
                  hint={
                    insurance.checkFields.includes('medicareNumber')
                      ? t('insurance.fieldCheck')
                      : t('insurance.medicareHint')
                  }
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
              </div>
            </>
          ) : null}

          <Button variant="link" aria-expanded={secondCard} onClick={() => setSecondCard((open) => !open)}>
            {t('insurance.secondCard')}
          </Button>
          {secondCard ? <Note>{t('insurance.secondCardNote')}</Note> : null}
        </>
      ) : null}

      <div aria-live="polite">
        {triedContinue && !sectionValid && kind === null ? <Note warn>{t('error.insuranceKind')}</Note> : null}
        {triedContinue && !sectionValid && kind === 'other' ? <Note warn>{t('error.insuranceCard')}</Note> : null}
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
