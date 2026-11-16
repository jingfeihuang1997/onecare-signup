import { useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Actions,
  AddressSuggest,
  Button,
  Choice,
  Field,
  Note,
  Question,
  ReasonList,
  ReviewList,
  SelectField,
  useSubHeading,
} from '../components';
import { RACE_OPTIONS } from '../data/demographics';
import { HEALTH_QUESTION_KEYS } from '../data/healthQuestions';
import { useI18n } from '../i18n';
import { useServices } from '../services';
import {
  isEmail,
  isFilled,
  isUsPhone,
  knownPhone,
  patientCallName,
  reminderTargets,
  useSignup,
} from '../state';
import type { AddressSuggestion, EnteredAddress, Extras, HealthAnswer } from '../types';
import { focusSoon } from './focusSoon';
import { SectionActions } from './SectionActions';
import { ShellActionsContext } from './shellActions';
import { useValidation } from './useValidation';

const TOTAL = HEALTH_QUESTION_KEYS.length;
const MIN_QUERY = 3;
const IDS = {
  phone: 'extras-phone',
  reminderEmail: 'extras-reminder-email',
  reminderPhone: 'extras-reminder-phone',
} as const;
const HEALTH_HEAD = 'extras-health';
const ADDRESS_SEARCH = 'extras-address-search';
const ADDRESS_STREET = 'extras-address-street';
const ADDRESS_CHANGE = 'extras-address-change';

const EMPTY_ADDRESS: EnteredAddress = { kind: 'entered', street: '', unit: '', city: '', state: '', zip: '' };

function oneLine(address: EnteredAddress): string {
  const street = [address.street, address.unit].map((part) => part.trim()).filter(Boolean).join(' ');
  const region = [address.state, address.zip].map((part) => part.trim()).filter(Boolean).join(' ');
  return [street, address.city.trim(), region].filter(Boolean).join(', ');
}

// --- Health questions: their own view ---------------------------------------

function HealthQuestions({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { state, dispatch } = useSignup();
  const shell = useContext(ShellActionsContext);
  const heading = useRef<HTMLHeadingElement>(null);
  const Heading = useSubHeading();
  // Edited here and written to the draft only on "Save answers", so leaving discards changes.
  const [answers, setAnswers] = useState<HealthAnswer[]>(() => [...state.draft.extras.health.answers]);
  const self = state.draft.forWhom === 'self';
  const name = patientCallName(state.draft);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <>
      {shell?.titlesSubViews ? null : (
        <Heading className="oc-h2" tabIndex={-1} ref={heading}>
          {t('extras.health.title')}
        </Heading>
      )}
      <p className="oc-lead">
        {self ? t('extras.health.lead.self', { total: TOTAL }) : t('extras.health.lead', { total: TOTAL, name })}
      </p>
      {HEALTH_QUESTION_KEYS.map((key, index) => (
        <Question
          key={key}
          number={index + 1}
          text={t(key)}
          value={answers[index] ?? 'no'}
          onChange={(answer) =>
            setAnswers((current) => current.map((item, at) => (at === index ? answer : item)))
          }
        />
      ))}
      <Actions>
        {shell?.onBack ? <Button onClick={onClose}>{t('common.back')}</Button> : null}
        <Button
          variant="primary"
          grow
          onClick={() => {
            dispatch({ type: 'extras/saveHealth', answers });
            onClose();
          }}
        >
          {t('extras.health.save')}
        </Button>
      </Actions>
    </>
  );
}

// --- Home address ------------------------------------------------------------

function HomeAddress() {
  const { t } = useI18n();
  const { state, dispatch, config } = useSignup();
  const services = useServices();
  const { address } = state.draft.extras;
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<AddressSuggestion[]>([]);
  // The text the last finished search was for, to say so when it found nothing.
  const [searched, setSearched] = useState('');
  const [byHand, setByHand] = useState(false);
  const [replacing, setReplacing] = useState(false);

  const setAddress = (next: EnteredAddress | null) =>
    dispatch({ type: 'extras/update', patch: { address: next } });

  // Suggestions from three characters on, shortly after the person stops typing.
  const text = query.trim();
  useEffect(() => {
    if (text.length < MIN_QUERY) {
      setMatches([]);
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      void services.searchAddress(text).then((found) => {
        if (current) {
          setMatches(found);
          setSearched(text);
        }
      });
    }, config.lookupDelayMs);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [text, services, config.lookupDelayMs]);

  const pharmacy = state.clinic?.pharmacy.name ?? '';

  if (address && !replacing && !byHand) {
    return (
      <>
        {address.kind === 'onFile' ? (
          <Note>{t('extras.address.onFile', { pharmacy, address: address.masked })}</Note>
        ) : (
          <ReviewList rows={[{ id: 'address', label: t('extras.address.chosen'), value: oneLine(address) }]} />
        )}
        <Button
          variant="link"
          id={ADDRESS_CHANGE}
          onClick={() => {
            setQuery('');
            setReplacing(true);
            focusSoon(ADDRESS_SEARCH);
          }}
        >
          {t('extras.address.change')}
        </Button>
      </>
    );
  }

  if (byHand) {
    const typed = address?.kind === 'entered' ? address : EMPTY_ADDRESS;
    const update = (patch: Partial<EnteredAddress>) => {
      const next = { ...typed, ...patch };
      const empty = !Object.entries(next).some(([key, value]) => key !== 'kind' && isFilled(value));
      setAddress(empty ? null : next);
    };
    return (
      <>
        <Field
          id={ADDRESS_STREET}
          label={t('extras.address.street')}
          autoComplete="address-line1"
          value={typed.street}
          onChange={(event) => update({ street: event.target.value })}
        />
        <Field
          label={t('extras.address.unit')}
          optional
          autoComplete="address-line2"
          value={typed.unit}
          onChange={(event) => update({ unit: event.target.value })}
        />
        <div className="oc-grid">
          <Field
            label={t('extras.address.city')}
            autoComplete="address-level2"
            value={typed.city}
            onChange={(event) => update({ city: event.target.value })}
          />
          <Field
            label={t('extras.address.state')}
            autoComplete="address-level1"
            maxLength={2}
            value={typed.state}
            onChange={(event) => update({ state: event.target.value.toUpperCase() })}
          />
          <Field
            label={t('extras.address.zip')}
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={5}
            value={typed.zip}
            onChange={(event) => update({ zip: event.target.value.replace(/\D/g, '') })}
          />
        </div>
        <Button
          variant="link"
          onClick={() => {
            setByHand(false);
            focusSoon(address ? ADDRESS_CHANGE : ADDRESS_SEARCH);
          }}
        >
          {t('extras.address.useSearch')}
        </Button>
      </>
    );
  }

  return (
    <>
      <AddressSuggest
        id={ADDRESS_SEARCH}
        label={t('extras.address.search')}
        value={query}
        onChange={setQuery}
        suggestions={matches.map((match) => ({
          id: match.id,
          main: match.street,
          sub: `${match.city}, ${match.state} ${match.zip}`,
        }))}
        onSelect={(option) => {
          const match = matches.find((item) => item.id === option.id);
          if (!match) return;
          setAddress({ kind: 'entered', street: match.street, unit: '', city: match.city, state: match.state, zip: match.zip });
          setReplacing(false);
          setQuery('');
          setMatches([]);
          focusSoon(ADDRESS_CHANGE);
        }}
      />
      <div aria-live="polite">
        {text.length >= MIN_QUERY && searched === text && matches.length === 0 ? (
          <p className="oc-small">{t('extras.address.noMatch')}</p>
        ) : null}
      </div>
      <Button
        variant="link"
        onClick={() => {
          setByHand(true);
          setReplacing(false);
          focusSoon(ADDRESS_STREET);
        }}
      >
        {t('extras.address.byHand')}
      </Button>
    </>
  );
}

// --- The section ---------------------------------------------------------------

/** "Why we ask" for Save time at the clinic. */
export function ExtrasWhy() {
  const { t } = useI18n();
  return (
    <ReasonList
      draft
      items={[
        { field: t('extras.health.title'), reason: t('reason.extras.health') },
        { field: t('patient.review.address'), reason: t('reason.extras.address') },
        { field: t('extras.phone'), reason: t('reason.extras.phone') },
        { field: t('extras.reminders.title'), reason: t('reason.extras.reminders') },
        { field: t('extras.race'), reason: t('reason.patient.race') },
      ]}
    />
  );
}

/**
 * Save time at the clinic (SPEC 5.6 and 10.1, item 16): optional, before signing. Everything
 * is on view, nothing folded: the health questions in a highlighted block that opens their
 * own view, then home address, phone number, reminders and race. "Continue to sign" and
 * "Skip for now" have the same size.
 */
export function ExtrasSection() {
  const { t } = useI18n();
  const { state, dispatch } = useSignup();
  const shell = useContext(ShellActionsContext);
  const Heading = useSubHeading();
  const [search, setSearch] = useSearchParams();

  const { draft } = state;
  const { extras } = draft;
  const self = draft.forWhom === 'self';
  const name = patientCallName(draft);

  // What was given earlier is offered first; a different address or number can be typed.
  const sameEmail = isEmail(draft.patient.email) ? draft.patient.email.trim() : '';
  const samePhone = knownPhone(state);
  const [pickedOtherEmail, setOtherEmail] = useState(false);
  const [pickedOtherPhone, setOtherPhone] = useState(false);
  // Something typed for the reminder always counts as "a different one".
  const otherEmail = pickedOtherEmail || isFilled(extras.reminderEmail);
  const otherPhone = pickedOtherPhone || isFilled(extras.reminderPhone);
  const typeEmail = extras.remindByEmail && (otherEmail || !sameEmail);
  const typePhone = extras.remindByText && (otherPhone || !samePhone);

  const targets = reminderTargets(state);
  const errors = {
    phone: !isFilled(extras.phone) || isUsPhone(extras.phone) ? null : t('error.phone'),
    reminderEmail: targets.email === null || isEmail(targets.email) ? null : t('error.email'),
    reminderPhone: targets.phone === null || isUsPhone(targets.phone) ? null : t('error.phone'),
  };
  const validation = useValidation(errors);

  if (search.get('view') === 'health') {
    return (
      <HealthQuestions
        onClose={() => {
          setSearch({});
          focusSoon(HEALTH_HEAD);
        }}
      />
    );
  }

  const update = (patch: Partial<Omit<Extras, 'health' | 'skipped'>>) =>
    dispatch({ type: 'extras/update', patch });

  const notNo = extras.health.answers.filter((answer) => answer !== 'no').length;
  const healthStatus = !extras.health.saved
    ? t('extras.health.notStarted')
    : notNo === 0
      ? t('extras.health.savedNone', { total: TOTAL })
      : t('extras.health.savedSome', { count: notNo, total: TOTAL });

  return (
    <>
      <p className="oc-lead">{t('extras.lead')}</p>

      <div className="oc-card oc-card--tint">
        <Heading className="oc-h2">{t('extras.health.title')}</Heading>
        <p className="oc-small">{t('extras.health.text')}</p>
        <p className="oc-small">
          <strong>{healthStatus}</strong>
        </p>
        <Button variant="link" id={HEALTH_HEAD} onClick={() => setSearch({ view: 'health' })}>
          {extras.health.saved ? t('extras.health.change') : t('extras.health.open')}
        </Button>
      </div>

      <hr className="oc-divider" />
      <Heading className="oc-h2">
        {self ? t('extras.address.title.self') : t('extras.address.title', { name })}
      </Heading>
      <HomeAddress />

      <hr className="oc-divider" />
      <Field
        id={IDS.phone}
        label={t('extras.phone')}
        optional
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        value={extras.phone}
        hint={self ? t('extras.phoneHint.self') : t('extras.phoneHint', { name })}
        error={validation.shown('phone')}
        onChange={(event) => update({ phone: event.target.value })}
        onBlur={() => validation.touch('phone')}
      />

      <hr className="oc-divider" />
      <Heading className="oc-h2">{t('extras.reminders.title')}</Heading>
      <p className="oc-small">{t('extras.reminders.text')}</p>

      <Choice
        kind="checkbox"
        title={t('extras.reminders.byEmail')}
        checked={extras.remindByEmail}
        onChange={(remindByEmail) => update({ remindByEmail })}
      />
      {extras.remindByEmail && sameEmail ? (
        <fieldset className="oc-fieldset">
          <legend className="oc-sr">{t('extras.reminders.emailTo')}</legend>
          <Choice
            kind="radio"
            name="reminder-email"
            title={sameEmail}
            sub={t('extras.reminders.sameEmail')}
            checked={!otherEmail}
            onChange={() => {
              setOtherEmail(false);
              update({ reminderEmail: '' });
            }}
          />
          <Choice
            kind="radio"
            name="reminder-email"
            title={t('extras.reminders.otherEmail')}
            checked={otherEmail}
            onChange={() => {
              setOtherEmail(true);
              focusSoon(IDS.reminderEmail);
            }}
          />
        </fieldset>
      ) : null}
      {typeEmail ? (
        <Field
          id={IDS.reminderEmail}
          label={t('extras.reminders.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={extras.reminderEmail}
          error={validation.shown('reminderEmail')}
          onChange={(event) => update({ reminderEmail: event.target.value })}
          onBlur={() => validation.touch('reminderEmail')}
        />
      ) : null}

      <Choice
        kind="checkbox"
        title={t('extras.reminders.byText')}
        checked={extras.remindByText}
        onChange={(remindByText) => update({ remindByText })}
      />
      {extras.remindByText && samePhone ? (
        <fieldset className="oc-fieldset">
          <legend className="oc-sr">{t('extras.reminders.textTo')}</legend>
          <Choice
            kind="radio"
            name="reminder-phone"
            title={samePhone}
            sub={t('extras.reminders.samePhone')}
            checked={!otherPhone}
            onChange={() => {
              setOtherPhone(false);
              update({ reminderPhone: '' });
            }}
          />
          <Choice
            kind="radio"
            name="reminder-phone"
            title={t('extras.reminders.otherPhone')}
            checked={otherPhone}
            onChange={() => {
              setOtherPhone(true);
              focusSoon(IDS.reminderPhone);
            }}
          />
        </fieldset>
      ) : null}
      {typePhone ? (
        <Field
          id={IDS.reminderPhone}
          label={t('extras.reminders.phone')}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={extras.reminderPhone}
          error={validation.shown('reminderPhone')}
          onChange={(event) => update({ reminderPhone: event.target.value })}
          onBlur={() => validation.touch('reminderPhone')}
        />
      ) : null}
      <Note>{t('extras.reminders.note')}</Note>

      <hr className="oc-divider" />
      <SelectField
        label={t('extras.race')}
        optional
        value={extras.race ?? ''}
        onChange={(event) => update({ race: event.target.value || null })}
      >
        <option value="">{t('extras.more.choose')}</option>
        {RACE_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {t(option.label)}
          </option>
        ))}
      </SelectField>

      <SectionActions label={t('extras.continue')} beforeContinue={() => validation.validate(IDS)} />
      {shell ? (
        <Button
          onClick={() => {
            // Moves on like Continue, then records that the optional details were skipped.
            shell.onContinue();
            dispatch({ type: 'extras/skip' });
          }}
        >
          {t('extras.skip')}
        </Button>
      ) : null}
    </>
  );
}
