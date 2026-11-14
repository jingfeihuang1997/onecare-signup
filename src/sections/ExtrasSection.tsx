import { useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Actions,
  AddressSuggest,
  Button,
  Field,
  Note,
  Question,
  ReasonList,
  ReviewList,
  SelectField,
  SubPanel,
  useSubHeading,
} from '../components';
import { RACE_OPTIONS, SEX_OPTIONS } from '../data/demographics';
import { HEALTH_QUESTION_KEYS } from '../data/healthQuestions';
import { useI18n } from '../i18n';
import { useServices } from '../services';
import { isEmail, isFilled, isUsPhone, patientCallName, useSignup } from '../state';
import type { AddressSuggestion, EnteredAddress, HealthAnswer } from '../types';
import { focusSoon } from './focusSoon';
import { SectionActions } from './SectionActions';
import { ShellActionsContext } from './shellActions';
import { useValidation } from './useValidation';

type SubPanelId = 'more' | 'address' | 'reminders';

const TOTAL = HEALTH_QUESTION_KEYS.length;
const MIN_QUERY = 3;
const IDS = { phone: 'extras-reminder-phone', email: 'extras-reminder-email' } as const;
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

/**
 * Save time at the clinic (SPEC 5.6 and 10.1): optional, before signing. Three sub-panels
 * that start open, plus the health questions, which open as their own view. "Continue to sign" and "Skip
 * for now" have the same size.
 */
export function ExtrasSection() {
  const { t } = useI18n();
  const { state, dispatch } = useSignup();
  const shell = useContext(ShellActionsContext);
  const [search, setSearch] = useSearchParams();
  // All three start open, so nothing optional is hidden behind a tap. Each folds on its own.
  const [openSubs, setOpenSubs] = useState<ReadonlySet<SubPanelId>>(
    () => new Set<SubPanelId>(['more', 'address', 'reminders']),
  );

  const { draft } = state;
  const { extras } = draft;
  const self = draft.forWhom === 'self';
  const name = patientCallName(draft);

  const errors = {
    phone: !isFilled(extras.reminderPhone) || isUsPhone(extras.reminderPhone) ? null : t('error.phone'),
    email: !isFilled(extras.reminderEmail) || isEmail(extras.reminderEmail) ? null : t('error.email'),
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

  const toggle = (id: SubPanelId) =>
    setOpenSubs((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const changed = extras.health.answers.filter((answer) => answer !== 'no').length;
  const healthSummary = !extras.health.saved
    ? t('extras.health.default', { total: TOTAL })
    : changed === 0
      ? t('extras.health.savedNone', { total: TOTAL })
      : t('extras.health.savedSome', { count: changed, total: TOTAL });

  const label = (options: readonly { id: string; label: Parameters<typeof t>[0] }[], id: string | null) => {
    const option = options.find((item) => item.id === id);
    return option ? t(option.label) : null;
  };
  const moreSummary =
    [label(SEX_OPTIONS, extras.sex), label(RACE_OPTIONS, extras.race)].filter(Boolean).join(t('common.separator')) ||
    t('extras.more.todo');
  const addressSummary = !extras.address
    ? t('extras.address.todo')
    : extras.address.kind === 'onFile'
      ? extras.address.masked
      : oneLine(extras.address);
  const remindersSummary =
    [extras.reminderPhone.trim(), extras.reminderEmail.trim()].filter(Boolean).join(t('common.separator')) ||
    t('extras.reminders.todo');

  return (
    <>
      <p className="oc-lead">{t('extras.lead')}</p>
      <SubPanel
        drill
        headId={HEALTH_HEAD}
        title={t('extras.health.title')}
        summary={healthSummary}
        onToggle={() => setSearch({ view: 'health' })}
      />
      <SubPanel
        title={self ? t('extras.more.title.self') : t('extras.more.title', { name })}
        summary={moreSummary}
        open={openSubs.has('more')}
        onToggle={() => toggle('more')}
        why={
          <ReasonList
            draft
            items={[
              { field: t('extras.more.sex'), reason: t('reason.patient.sex') },
              { field: t('extras.more.race'), reason: t('reason.patient.race') },
            ]}
          />
        }
      >
        <SelectField
          label={t('extras.more.sex')}
          value={extras.sex ?? ''}
          onChange={(event) => dispatch({ type: 'extras/update', patch: { sex: event.target.value || null } })}
        >
          <option value="">{t('extras.more.choose')}</option>
          {SEX_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {t(option.label)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('extras.more.race')}
          value={extras.race ?? ''}
          onChange={(event) => dispatch({ type: 'extras/update', patch: { race: event.target.value || null } })}
        >
          <option value="">{t('extras.more.choose')}</option>
          {RACE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {t(option.label)}
            </option>
          ))}
        </SelectField>
      </SubPanel>
      <SubPanel
        title={self ? t('extras.address.title.self') : t('extras.address.title', { name })}
        summary={addressSummary}
        open={openSubs.has('address')}
        onToggle={() => toggle('address')}
        why={<p>{t('reason.extras.address')}</p>}
      >
        <HomeAddress />
      </SubPanel>
      <SubPanel
        title={t('extras.reminders.title')}
        summary={remindersSummary}
        open={openSubs.has('reminders')}
        onToggle={() => toggle('reminders')}
        why={
          <ReasonList
            draft
            items={[
              { field: t('extras.reminders.phone'), reason: t('reason.extras.phone') },
              { field: t('extras.reminders.email'), reason: t('reason.extras.email') },
            ]}
          />
        }
      >
        <Field
          id={IDS.phone}
          label={t('extras.reminders.phone')}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={extras.reminderPhone}
          error={validation.shown('phone')}
          onChange={(event) => dispatch({ type: 'extras/update', patch: { reminderPhone: event.target.value } })}
          onBlur={() => validation.touch('phone')}
        />
        <Field
          id={IDS.email}
          label={t('extras.reminders.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={extras.reminderEmail}
          error={validation.shown('email')}
          onChange={(event) => dispatch({ type: 'extras/update', patch: { reminderEmail: event.target.value } })}
          onBlur={() => validation.touch('email')}
        />
      </SubPanel>
      <SectionActions
        label={t('extras.continue')}
        beforeContinue={() => {
          if (errors.phone || errors.email) setOpenSubs((current) => new Set(current).add('reminders'));
          // The fields exist only once the sub-panel is open, so focus is set a tick later.
          const ok = !errors.phone && !errors.email;
          if (!ok) setTimeout(() => validation.validate(IDS), 0);
          return ok;
        }}
      />
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
