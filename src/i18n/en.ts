// English strings. Every user-facing string lives here (CLAUDE.md).
// Text in [square brackets] is a placeholder waiting for a real value: keep it visible.
// "reason.*" entries are the official-style wording of docs/Field_Reason.xlsx,
// column "Reason (To be checked)". None is verified yet: see docs/TO-BE-VERIFIED.md.
export const en = {
  'brand.name': 'OneCare',

  'common.continue': 'Continue',
  'common.back': 'Back',
  'common.optional': 'Optional',

  'header.poweredBy': 'Powered by',
  'header.logoPlaceholder': 'LOGO',
  'header.logoAlt': 'OneCare logo placeholder',
  'header.smallerText': 'Smaller text',
  'header.largerText': 'Larger text',
  'header.smallerGlyph': 'A−',
  'header.largerGlyph': 'A+',
  'header.language': 'Language: {language}. Change language',
  'header.languageMenu': 'Language',

  'language.en': 'English',
  'language.es': 'Español',
  'language.zh-Hans': '中文',
  'language.short.en': 'EN',
  'language.short.es': 'ES',
  'language.short.zh-Hans': '中文',

  'progress.label': 'Progress',
  'progress.sectionNamed': 'Section {current} of {total} · {name}',
  'progress.sections': 'Sections',

  'stamps.progress': 'Pass progress. Step {current} of {total}',
  'stamps.allDone': 'Pass progress. All steps done',
  'stamps.done': 'done',
  'stamp.who': 'Who',
  'stamp.shots': 'Shots',
  'stamp.card': 'Card',
  'stamp.extras': 'Extras',
  'stamp.sign': 'Sign',

  'nav.sections': 'Sections',
  'nav.state.done': 'Done',
  'nav.state.current': 'You are here',
  'nav.state.todo': 'Not started',
  'nav.state.optional': 'Optional',

  'sheet.close': 'Close',
  'sheet.jumpTitle': 'Jump to a section',

  'field.optional': '(optional)',
  'dob.legend': 'Date of birth',
  'dob.month': 'Month',
  'dob.day': 'Day',
  'dob.year': 'Year',
  'dob.monthPlaceholder': 'MM',
  'dob.dayPlaceholder': 'DD',
  'dob.yearPlaceholder': 'YYYY',

  'why.ask': 'Why we ask',
  'why.matters': 'Why it matters',
  'why.draftNote': 'Draft wording, not yet approved.',

  'vax.status.due': 'Due now',
  'vax.status.had': 'Had it · {date}',
  'vax.status.none': 'No record',
  'vax.showDetails': 'Details for {name}',
  'vax.keep': 'Keep it',
  'vax.remove': 'Remove',
  'vax.about': 'About this vaccine',
  'vax.goodToKnow': 'Good to know before the shot',

  'answer.yes': 'Yes',
  'answer.no': 'No',
  'answer.notSure': 'Not sure',
  'question.numbered': '{number}. {text}',
  'question.answerLabel': 'Answer to question {number}',

  'address.suggestions': 'Address suggestions',

  'sign.typedPreview': 'Typed signature preview: {name}',
  'sign.empty': 'No signature yet',

  'pass.aria': 'Clinic pass',
  'pass.label': 'CLINIC PASS',

  // Why we ask: patient
  'reason.patient.name':
    "The patient's legal name is used to identify them, to locate their record at the pharmacy and in the state immunization registry, and to match the name on the insurance claim. Enter it as it appears on the insurance or Medicare card.",
  'reason.patient.preferredName':
    'Optional. If provided, this is the name used to address the patient in text messages and emails. It is not used on insurance claims.',
  'reason.patient.dob':
    "Date of birth is used to verify insurance, to locate an existing record, and to determine which vaccines and questions apply at the patient's age.",
  'reason.patient.sex': 'Optional. [Purpose to be confirmed by OneCare.]',
  'reason.patient.race': 'Optional. [Purpose to be confirmed by OneCare.]',

  // Why we ask: insurance and Medicare
  'reason.insurance.medicareNumber':
    'The Medicare number is required to bill Medicare, so that the patient is not charged out of pocket.',
  'reason.insurance.ssn4':
    'The last four digits of the Social Security number are used by the pharmacy to bill Medicare correctly, so that the patient is not charged out of pocket.',
  'reason.insurance.cardPhoto':
    'Optional. A photo of the card allows the insurance details to be read and filled in automatically. The images are kept for the pharmacy.',
  'reason.insurance.company':
    'The pharmacy requires the name of the insurance company to bill for the vaccine. It is shown on the insurance card.',
  'reason.insurance.planName': 'The plan name is shown on the insurance card and is used for billing.',
  'reason.insurance.bin': 'The BIN routes the pharmacy claim to the correct claims processor.',
  'reason.insurance.pcn': 'The PCN is a second routing number, used together with the BIN.',
  'reason.insurance.memberId': 'The member ID identifies the patient on the insurance plan.',
  'reason.insurance.groupId': 'The group ID identifies the employer or group plan.',

  // Why we ask: helper ("Your details")
  'reason.helper.name':
    "Your name records who completed this form and who is signing on the patient's behalf.",
  'reason.helper.relationship':
    'Your relationship shows the basis on which you are signing for the patient, for example as a parent, an adult child or a legal representative.',
  'reason.helper.phone':
    'Reminders and contact on the day of the clinic go to the person managing the appointment.',
  'reason.helper.email':
    'The confirmation and the reminder are sent to the person managing the appointment.',

  // Why we ask: optional details
  'reason.extras.address':
    "Optional. The pharmacy keeps the patient's home address on file for future medication delivery. It is not required for billing.",
  'reason.extras.phone': 'Optional. The phone number is used to send a reminder before the clinic.',
  'reason.extras.email':
    'Optional. The email address is used to send the confirmation and a reminder, and to help verify insurance.',
  'reason.extras.health': 'The pharmacist needs these answers before giving a vaccine.',

  // Why we ask: review and sign
  'reason.sign.signer':
    "This records whether the patient or the person helping them signed, together with the signer's name.",
  'reason.sign.signature': 'The signature is the record of consent.',
  'reason.sign.pharmacyConsent':
    'This records consent to be vaccinated by the pharmacy and to have the insurer billed.',
  'reason.sign.onecareConsent':
    'This records agreement to the OneCare terms of service and privacy notice.',

  // Why it matters: one draft per vaccine
  'vaccine.flu.why':
    'Flu can lead to a hospital stay, especially for older adults and people with long-term conditions. The vaccine is updated every year.',
  'vaccine.covid.why': 'Lowers the risk of severe COVID-19. The vaccine is updated each season.',
  'vaccine.tdap.why':
    'Protects against tetanus, diphtheria and whooping cough. A booster keeps the protection up.',
  'vaccine.shingles.why':
    'Shingles is a painful rash that can leave nerve pain lasting months. The risk rises with age.',
  'vaccine.pneumococcal.why':
    'Protects against a bacterium that causes pneumonia, bloodstream infection and meningitis.',
  'vaccine.rsv.why': 'RSV can cause a serious lung infection in older adults.',
  'vaccine.hepb.why': 'Hepatitis B is a liver infection that can become lifelong and damage the liver.',
  'vaccine.mmr.why': 'Protects against measles, mumps and rubella. Measles spreads very easily.',
  'vaccine.varicella.why': 'Protects against chickenpox and its complications.',
  'vaccine.hpv.why': 'Prevents infections that can cause several cancers later in life.',
  'vaccine.menacwy.why':
    'Protects against a rare but fast-moving infection that can cause meningitis.',
  'vaccine.dtap.why': "The young child's vaccine against diphtheria, tetanus and whooping cough.",
  'vaccine.hib.why': 'Protects young children against a bacterium that can cause meningitis.',
  'vaccine.rotavirus.why': 'Protects babies against severe diarrhea and dehydration.',
  'vaccine.polio.why': 'Protects against polio, which can cause paralysis.',
  'vaccine.hepa.why':
    'Hepatitis A is a liver infection spread through contaminated food, water or close contact.',
} as const;

export type StringKey = keyof typeof en;
