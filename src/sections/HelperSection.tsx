import { Field, ReasonList, SelectField } from '../components';
import { RELATIONSHIPS } from '../data/relationships';
import { useI18n } from '../i18n';
import { capitalizeFirst, isFilled, isUsPhone, patientCallName, useSignup } from '../state';
import type { Helper } from '../types';
import { SectionActions } from './SectionActions';
import { useValidation } from './useValidation';

const IDS = {
  firstName: 'helper-first-name',
  lastName: 'helper-last-name',
  relationship: 'helper-relationship',
  relationshipOther: 'helper-relationship-other',
  phone: 'helper-phone',
} as const;

/** "Why we ask" for the Your details section. */
export function HelperWhy() {
  const { t } = useI18n();
  return (
    <ReasonList
      draft
      items={[
        { field: t('helper.name'), reason: t('reason.helper.name') },
        { field: t('helper.relationshipNoName'), reason: t('reason.helper.relationship') },
        { field: t('helper.phone'), reason: t('reason.helper.phone') },
      ]}
    />
  );
}

/**
 * Your details (SPEC 5.5): who is signing up the patient. The wording stays neutral,
 * because the helper is not always a parent, and "Other" opens a free-text field.
 */
export function HelperSection() {
  const { t } = useI18n();
  const { state, dispatch } = useSignup();
  const { helper } = state.draft;
  const name = patientCallName(state.draft);
  const update = (patch: Partial<Helper>) => dispatch({ type: 'helper/update', patch });

  const errors = {
    firstName: isFilled(helper.firstName) ? null : t('error.helperFirstName'),
    lastName: isFilled(helper.lastName) ? null : t('error.helperLastName'),
    relationship: helper.relationship ? null : t('error.relationship'),
    relationshipOther:
      helper.relationship !== 'other' || isFilled(helper.relationshipOther)
        ? null
        : t('error.relationshipOther'),
    phone: isUsPhone(helper.phone) ? null : t('error.phone'),
  };
  const validation = useValidation(errors);

  return (
    <>
      <p className="oc-lead">{name ? t('helper.lead', { name }) : t('helper.leadNoName')}</p>
      <div className="oc-grid">
        <Field
          id={IDS.firstName}
          label={t('helper.firstName')}
          autoComplete="given-name"
          autoCapitalize="words"
          value={helper.firstName}
          error={validation.shown('firstName')}
          onChange={(event) => update({ firstName: capitalizeFirst(event.target.value) })}
          onBlur={() => validation.touch('firstName')}
        />
        <Field
          id={IDS.lastName}
          label={t('helper.lastName')}
          autoComplete="family-name"
          autoCapitalize="words"
          value={helper.lastName}
          error={validation.shown('lastName')}
          onChange={(event) => update({ lastName: capitalizeFirst(event.target.value) })}
          onBlur={() => validation.touch('lastName')}
        />
      </div>
      <SelectField
        id={IDS.relationship}
        label={name ? t('helper.relationship', { name }) : t('helper.relationshipNoName')}
        value={helper.relationship ?? ''}
        error={validation.shown('relationship')}
        onChange={(event) =>
          update({ relationship: RELATIONSHIPS.find((item) => item.id === event.target.value)?.id ?? null })
        }
        onBlur={() => validation.touch('relationship')}
      >
        <option value="" disabled>
          {t('helper.relationshipChoose')}
        </option>
        {RELATIONSHIPS.map((item) => (
          <option key={item.id} value={item.id}>
            {t(item.label)}
          </option>
        ))}
      </SelectField>
      {helper.relationship === 'other' ? (
        <Field
          id={IDS.relationshipOther}
          label={t('helper.relationshipOther')}
          autoComplete="off"
          value={helper.relationshipOther}
          error={validation.shown('relationshipOther')}
          onChange={(event) => update({ relationshipOther: event.target.value })}
          onBlur={() => validation.touch('relationshipOther')}
        />
      ) : null}
      <Field
        id={IDS.phone}
        label={t('helper.phone')}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        value={helper.phone}
        error={validation.shown('phone')}
        onChange={(event) => update({ phone: event.target.value })}
        onBlur={() => validation.touch('phone')}
      />
      <SectionActions beforeContinue={() => validation.validate(IDS)} />
    </>
  );
}
