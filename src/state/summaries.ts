import { RELATIONSHIPS } from '../data/relationships';
import { getVaccine } from '../data/vaccines';
import { formatDate, type Language, type Translate } from '../i18n';
import type { Helper, SectionId, SignupDraft } from '../types';
import { parseDob, toIsoDate } from './dates';
import type { SignupState } from './draft';
import { isFilled } from './validation';

// One line per section. In option A it is the folded panel's summary; in option B it is
// the value of the review row. Until a section has content, the line says what it is for.

/** What to call the patient in sentences: the preferred name if given, else the first name. */
export function patientCallName(draft: SignupDraft): string {
  return draft.patient.preferredName.trim() || draft.patient.firstName.trim();
}

export function patientFullName(draft: SignupDraft): string {
  return `${draft.patient.firstName.trim()} ${draft.patient.lastName.trim()}`.trim();
}

export function helperFullName(helper: Helper): string {
  return `${helper.firstName.trim()} ${helper.lastName.trim()}`.trim();
}

/** The relationship exactly as chosen, or as typed for "other" (SPEC 10.2). */
export function relationshipLabel(helper: Helper, t: Translate): string {
  if (helper.relationship === null) return '';
  if (helper.relationship === 'other') return helper.relationshipOther.trim();
  const option = RELATIONSHIPS.find((item) => item.id === helper.relationship);
  return option ? t(option.label) : '';
}

function patientSummary(draft: SignupDraft, t: Translate, language: Language): string {
  const name = patientFullName(draft);
  const birth = parseDob(draft.patient.dob);
  if (!name || !birth) return t('summary.patient.todo');
  return [name, formatDate(toIsoDate(birth), language)].join(t('common.separator'));
}

function helperSummary(draft: SignupDraft, t: Translate): string {
  const name = helperFullName(draft.helper);
  if (!name) {
    const patient = patientCallName(draft);
    return patient ? t('summary.helper.todo', { name: patient }) : t('summary.helper.todoNoName');
  }
  return [name, relationshipLabel(draft.helper, t), draft.helper.phone.trim()]
    .filter(Boolean)
    .join(t('common.separator'));
}

function vaccinesSummary(draft: SignupDraft, t: Translate): string {
  const { selections, notSure } = draft.vaccines;
  if (selections.length === 0) {
    return notSure ? t('summary.vaccines.notSure') : t('summary.vaccines.todo');
  }
  return selections
    .map((selection) => ({ selection, vaccine: getVaccine(selection.vaccineId) }))
    .sort((a, b) => a.vaccine.displayOrder - b.vaccine.displayOrder)
    .map(({ selection, vaccine }) => {
      const name = t(`vaccine.${vaccine.id}.short`);
      const choice = selection.product;
      const product =
        choice?.kind === 'product'
          ? vaccine.products.find((item) => item.id === choice.productId)
          : undefined;
      return product
        ? t('summary.vaccines.withProduct', { vaccine: name, product: product.shortName })
        : name;
    })
    .join(t('common.separator'));
}

function insuranceSummary(draft: SignupDraft, t: Translate): string {
  const { insurance } = draft;
  if (insurance.has === null) return t('summary.insurance.todo');
  if (insurance.has === 'no') return t('summary.insurance.none');
  if (insurance.has === 'notSure') return t('summary.insurance.notSure');

  if (insurance.entry === 'photo') {
    const photos = [insurance.frontImage, insurance.backImage].filter(Boolean).length;
    const detail =
      photos === 2
        ? t('summary.insurance.photosBoth')
        : photos === 1
          ? t('summary.insurance.photoOne')
          : '';
    const label = insurance.card.company.trim() || t('summary.insurance.other');
    return [label, detail].filter(Boolean).join(t('common.separator'));
  }
  if (insurance.kind === 'medicare') {
    return [
      t('summary.insurance.medicare'),
      isFilled(insurance.medicareNumber) && t('summary.insurance.numberAdded'),
    ]
      .filter(Boolean)
      .join(t('common.separator'));
  }
  return [
    insurance.card.company.trim() || t('summary.insurance.other'),
    (isFilled(insurance.card.company) || isFilled(insurance.card.memberId)) &&
      t('summary.insurance.typed'),
  ]
    .filter(Boolean)
    .join(t('common.separator'));
}

function extrasSummary(draft: SignupDraft, t: Translate): string {
  const { extras } = draft;
  const added = [
    extras.health.saved && t('summary.extras.health'),
    extras.address !== null && t('summary.extras.address'),
    isFilled(extras.phone) && t('summary.extras.phone'),
    (extras.remindByEmail || extras.remindByText) && t('summary.extras.reminders'),
    extras.race !== null && t('summary.extras.more'),
  ].filter(Boolean);
  if (added.length > 0) return added.join(t('common.separator'));
  return extras.skipped ? t('summary.extras.skipped') : t('summary.extras.todo');
}

function signSummary(draft: SignupDraft, t: Translate): string {
  return draft.signature
    ? t('summary.sign.done', { name: draft.signature.signerName })
    : t('summary.sign.todo');
}

export function sectionSummary(
  state: SignupState,
  section: SectionId,
  t: Translate,
  language: Language,
): string {
  const { draft } = state;
  switch (section) {
    case 'patient':
      return patientSummary(draft, t, language);
    case 'helper':
      return helperSummary(draft, t);
    case 'vaccines':
      return vaccinesSummary(draft, t);
    case 'insurance':
      return insuranceSummary(draft, t);
    case 'extras':
      return extrasSummary(draft, t);
    case 'sign':
      return signSummary(draft, t);
  }
}
