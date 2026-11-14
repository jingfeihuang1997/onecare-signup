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
  'reason.patient.sex':
    'Optional. Sex helps the pharmacist check which vaccines and health questions apply. It is also used, without your name, in a study of how well vaccination clinics reach different groups of people. Your answer does not change your care.',
  'reason.patient.race':
    'Optional. Race is used, without your name, in a study of how well vaccination clinics reach different groups of people, so that gaps can be found and closed. Your answer does not change your care.',

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

  // Vaccine names: full name for the list, short name for one-line summaries
  'vaccine.flu.name': 'Influenza (flu)',
  'vaccine.flu.short': 'Flu',
  'vaccine.covid.name': 'COVID-19',
  'vaccine.covid.short': 'COVID-19',
  'vaccine.tdap.name': 'Tdap',
  'vaccine.tdap.short': 'Tdap',
  'vaccine.shingles.name': 'Shingles (Zoster)',
  'vaccine.shingles.short': 'Shingles',
  'vaccine.pneumococcal.name': 'Pneumococcal',
  'vaccine.pneumococcal.short': 'Pneumococcal',
  'vaccine.rsv.name': 'RSV',
  'vaccine.rsv.short': 'RSV',
  'vaccine.hepb.name': 'Hepatitis B',
  'vaccine.hepb.short': 'Hepatitis B',
  'vaccine.mmr.name': 'MMR',
  'vaccine.mmr.short': 'MMR',
  'vaccine.varicella.name': 'Varicella',
  'vaccine.varicella.short': 'Varicella',
  'vaccine.hpv.name': 'HPV',
  'vaccine.hpv.short': 'HPV',
  'vaccine.menacwy.name': 'Meningococcal ACWY',
  'vaccine.menacwy.short': 'Meningococcal ACWY',
  'vaccine.dtap.name': 'DTaP',
  'vaccine.dtap.short': 'DTaP',
  'vaccine.hib.name': 'Hib',
  'vaccine.hib.short': 'Hib',
  'vaccine.rotavirus.name': 'Rotavirus',
  'vaccine.rotavirus.short': 'Rotavirus',
  'vaccine.polio.name': 'Polio (IPV)',
  'vaccine.polio.short': 'Polio',
  'vaccine.hepa.name': 'Hepatitis A',
  'vaccine.hepa.short': 'Hepatitis A',

  // Health questions. Exact wording of docs/reference/A10-Health.html (SPEC 5.6): do not edit.
  'health.q1': 'Are you sick today?',
  'health.q2':
    'Do you have allergies to medications, food, eggs, yeast, a vaccine component, or latex?',
  'health.q3': 'Have you ever had a serious reaction after receiving a vaccination?',
  'health.q4':
    'Has any physician or other healthcare professional ever cautioned or warned you about receiving certain vaccines or receiving vaccines outside of a medical setting?',
  'health.q5':
    'Do you have a long-term health problem such as heart disease, lung disease, liver disease, asthma, kidney disease, metabolic disease (e.g., diabetes) anemia or other blood disorder?',
  'health.q6':
    "Do you have cancer, leukemia, HIV/AIDS, or any other immune system problem? Have you been diagnosed with rheumatoid arthritis, ankylosing spondylitis, Crohn's disease, herpes, or cold sores?",
  'health.q7':
    'In the past 3 months, have you taken medications that weaken your immune system such as cortisone, prednisone, other steroids, or anticancer drugs, or have you had radiation treatments?',
  'health.q8':
    'Have you had a seizure or a brain or other nervous system problem or Guillain Barre?',
  'health.q9':
    'During the past year, have you received a transfusion of blood or blood products, or been given immune (gamma) globulin or antiviral drug (including acyclovir famciclovir, valacyclovir)?',
  'health.q10':
    'For women: Are you pregnant or is there a chance you could become pregnant during the next month?',
  'health.q11': 'Have you received any vaccinations or TB skin test in the past 4 weeks?',
  'health.q12': 'Do you have a history of fainting, particularly with vaccines?',
  'health.q13':
    'For Tdap and adult Td: Do you have a cut, injury, puncture or open wound that prompted you to get a tetanus shot?',
  'health.q14':
    'Have you ever been diagnosed with a heart condition (myocarditis or pericarditis) or have you had Multisystem Inflammatory Syndrome (MIS-A or MIS-C) after an infection with the virus that causes COVID-19?',

  // Helper relationship
  'relationship.child': 'Daughter or son',
  'relationship.spouse': 'Spouse or partner',
  'relationship.parent': 'Parent',
  'relationship.guardian': 'Legal guardian or representative',
  'relationship.other': 'Other',

  // Sections and their one-line summaries
  'common.separator': ' · ',
  'section.patient': 'Patient',
  'section.helper': 'Your details',
  'section.vaccines': 'Vaccines',
  'section.insurance': 'Insurance and Medicare',
  'section.extras': 'Save time at the clinic',
  'section.sign': 'Review and sign',
  'summary.patient.todo': 'Name and date of birth',
  'summary.helper.todo': 'Because you are signing up for {name}',
  'summary.helper.todoNoName': 'Because you are signing up for someone else',
  'summary.vaccines.todo': 'Pick the vaccines',
  'summary.vaccines.notSure': 'Not sure yet. The pharmacist will go through it.',
  'summary.vaccines.withProduct': '{vaccine} ({product})',
  'summary.insurance.todo': 'Photo of the card, or type it in',
  'summary.insurance.medicare': 'Medicare',
  'summary.insurance.other': 'Insurance',
  'summary.insurance.none': 'No insurance',
  'summary.insurance.photosBoth': 'front and back photos added',
  'summary.insurance.photoOne': 'one photo added',
  'summary.insurance.numberAdded': 'number added',
  'summary.insurance.typed': 'typed in',
  'summary.extras.todo': 'Health questions, address, reminders',
  'summary.extras.skipped': 'Skipped for now',
  'summary.extras.health': 'Health questions answered',
  'summary.extras.more': 'More about {name} added',
  'summary.extras.address': 'Address added',
  'summary.extras.reminders': 'Reminder added',
  'summary.sign.todo': 'Check, then sign to finish',
  'summary.sign.done': 'Signed by {name}',

  // Record on file and clinic
  'record.medicareEnding': 'Medicare number ending {ending}',
  'clinic.dateAtTime': '{date} at {time}',
  'clinic.kicker': 'Vaccination clinic',
  'demo.notice': 'Demo only. Everything here is made up. Please do not enter real personal information.',
  'page.signup': 'Vaccine sign-up',
  'page.start': 'Start',
  'page.done': 'Signed up',
  'page.title': '{page} · {pharmacy} vaccine sign-up',
  'done.forgotten': 'Nothing is saved on this phone now.',
  'clinic.where': '{pharmacy} · {address}',
  'help.call': 'Need help? Call {pharmacy} at {phone}.',
  'aside.signingUp': 'Signing up {name}',

  // Start. "#pass" entries are the wording of option B (see translate.ts).
  'start.title': 'Who is this sign-up for?',
  'start.title#pass': 'First, who is the pass for?',
  'start.self': 'Myself',
  'start.self#pass': 'Me',
  'start.selfSub': 'I am the one getting the vaccine',
  'start.other': 'Someone else',
  'start.other#pass': "Someone I'm helping",
  'start.otherSub': 'A parent, a child, or someone I care for',
  'sign.submit': 'Sign up',
  'sign.submit#pass': 'Sign and get my pass',
  'sign.submitNamed': 'Sign up {name}',
  'sign.submitNamed#pass': "Sign and get {name}'s pass",

  // Review and sign. Consent wording is a draft [pending OneCare legal review].
  'sign.lead': 'Tap any line above to change it.',
  'sign.lead#pass': 'Tap any line below to change it.',
  'review.you': 'You',
  'sign.who': 'Who is signing?',
  'sign.thePatient': 'The patient',
  'sign.signingFor': 'Signing for {name}',
  'sign.signerName': "Signer's full name",
  'sign.signerNameHint': 'Change it if it is not right.',
  'sign.signature': 'Signature',
  'sign.how': 'How to sign',
  'sign.type': 'Type',
  'sign.draw': 'Draw',
  'sign.typedHint': 'The typed name above becomes the signature.',
  'sign.drawArea': 'Draw your signature here',
  'sign.drawn': 'Your drawn signature',
  'sign.clear': 'Clear',
  'sign.agreeTyped': 'I agree that this typed name is my electronic signature.',
  'sign.pharmacyConsent': 'Pharmacy consent',
  'sign.pharmacyConsentText':
    "I am signing for {patient}. I consent to {name} being vaccinated by {pharmacy}. I have reviewed the vaccine information, understand the risks and benefits, and authorize billing to {name}'s insurer. Consent can be withdrawn at any time.",
  'sign.pharmacyConsentText.self':
    'I consent to being vaccinated by {pharmacy}. I have reviewed the vaccine information, understand the risks and benefits, and authorize billing to my insurer. Consent can be withdrawn at any time.',
  'sign.readInfo': 'Read the vaccine information',
  'sign.infoPlaceholder':
    'For each vaccine, the pharmacy gives a Vaccine Information Statement: a short sheet on what the vaccine protects against, who should get it, and its possible side effects. You can ask the pharmacist for it and read it before the shot.',
  'sign.onecareConsent': 'OneCare consent',
  'sign.onecareConsentText': 'I have read and agree to the OneCare terms of service and privacy notice.',
  'sign.readTerms': 'Read the OneCare terms of service and privacy notice',
  'sign.termsPlaceholder': '[Terms of service and privacy notice: to be supplied by OneCare.]',
  'sign.pressAgain':
    'Some boxes above are not ticked. Press "{button}" again to agree to all of them and finish.',
  'error.signerName': "Enter the signer's full name.",
  'error.signature': 'Draw your signature in the box, or switch to Type.',
  'error.signMissing': 'Before signing, finish: {sections}.',
  'error.submit': 'We could not send the sign-up. Please try again.',

  // Done
  'done.title': '{name} is signed up',
  'done.title#pass': "{name}'s pass is ready.",
  'done.title.self': 'You are signed up',
  'done.title.self#pass': 'Your pass is ready.',
  'done.vaccinesRequested': 'Vaccines requested',
  'done.vaccinesRequested#pass': 'Shots requested',
  'done.pharmacistConfirms': 'pharmacist will confirm',
  'done.vaccinesNotSure': 'The pharmacist will go through the vaccines at the clinic.',
  'done.confirmation': 'Confirmation number: {id}',
  'done.calendar': 'Add to calendar',
  'done.calendarTitle': 'Vaccination clinic at {pharmacy}',
  'done.calendarVaccines': 'Vaccines requested for {name}: {vaccines}',
  'done.another': 'Sign up another person',
  'done.another#pass': 'Get a pass for someone else',
  'done.stillOpen': 'Still open',
  'done.stillOpenText': 'Optional. Add it now, or the pharmacist will ask at the clinic.',
  'done.open.health': 'Answer the {total} questions',
  'done.open.moreLabel': 'More about {name}',
  'done.open.more': 'Add sex and race',
  'done.open.reminders': 'Add a phone number or email',
  'done.saved':
    'Saved on this phone so next time is faster. Card numbers and signatures are never saved.',

  // Start: language and "Welcome back"
  'language.label': 'Language',
  'welcome.title': 'Welcome back',
  'welcome.continue': "Continue {name}'s sign-up",
  'welcome.continueSelf': 'Continue your sign-up',
  'welcome.stoppedAt': 'You stopped at {section}',
  'welcome.saved':
    'Saved on this phone from last time. Card numbers and signatures are never saved.',
  'welcome.forget': 'Forget what is saved on this phone',
  'start.titleAgain': 'Or start a new sign-up. Who is it for?',

  // Patient. ".self" entries are used when the person signs up for themselves.
  'patient.lead': 'Enter the details as they appear on the insurance or Medicare card.',
  'patient.firstName': 'First name',
  'patient.lastName': 'Last name',
  'patient.name': 'Name',
  'patient.preferredName': 'Preferred name',
  'patient.preferredPlaceholder': 'What should we call them?',
  'patient.preferredPlaceholder.self': 'What should we call you?',
  'patient.looking': 'Looking for a record...',
  'patient.notFound': "We don't have {name} on file yet. That's fine, we'll add them.",
  'patient.notFound.self': "We don't have you on file yet. That's fine, we'll add you.",
  'patient.foundLead': 'Check that it is still right. Tap a line with an arrow to change it.',
  'patient.foundNote': "We found {name}'s record at {pharmacy}. Parts are hidden for privacy.",
  'patient.foundNote.self': 'We found your record at {pharmacy}. Parts are hidden for privacy.',
  'patient.confirm': 'Yes, this is right',
  'patient.reject': 'This is not {name}',
  'patient.reject.self': 'This is not me',
  'patient.minorNote':
    '{name} is under 18, so an adult needs to sign up for them. The next step asks for your details.',
  'patient.minorNote.self':
    'You are under 18, so an adult needs to sign up for you. The next step asks for their details.',
  'patient.review.preferred': 'Preferred name (optional)',
  'patient.review.addName': 'Add a name',
  'patient.review.address': 'Home address',
  'patient.review.phone': 'Phone',
  'patient.review.insurance': 'Insurance',

  // Vaccines. ".self" entries are used when the person signs up for themselves.
  'vaccines.lead':
    'Tap a vaccine to add it. The pharmacist confirms what is right for {name} at the clinic.',
  'vaccines.lead.self':
    'Tap a vaccine to add it. The pharmacist confirms what is right for you at the clinic.',
  'vaccines.lastDose': 'Last dose on record: {date}',
  'vaccines.noDose': 'No dose on record.',
  'vaccines.whichProduct': 'Which {vaccine} vaccine?',
  'vaccines.sameAsLast': 'Same as last time',
  'vaccines.suggestedFromAge': 'Suggested for age {age}+',
  'vaccines.otherOptions': 'Other options ({count})',
  'vaccines.noPreference': 'No preference',
  'vaccines.askPharmacist': "I'd like to ask the pharmacist",
  'vaccines.pickSameAsLast': '{product} · same as last time',
  'vaccines.chosen': 'Chosen: {choice}',
  'vaccines.hadWarning':
    'Our records show {name} had this vaccine on {date}, so they may not need another one. You can keep it and the pharmacist will confirm.',
  'vaccines.hadWarning.self':
    'Our records show you had this vaccine on {date}, so you may not need another one. You can keep it and the pharmacist will confirm.',
  'vaccines.ageNote':
    "This vaccine is not usually given at {name}'s age. You can keep it and the pharmacist will confirm.",
  'vaccines.ageNote.self':
    'This vaccine is not usually given at your age. You can keep it and the pharmacist will confirm.',
  'vaccines.notSure': "I'm not sure what {name} needs",
  'vaccines.notSure.self': "I'm not sure what I need",
  'vaccines.notSureSub': 'The pharmacist will go through it at the clinic.',
  'vaccines.source':
    "Based on the state immunization registry ({registry}) and {pharmacy}'s records. Records can be incomplete.",
  'vaccines.aboutPlaceholder':
    'This vaccine is given as a shot at the clinic. Before giving it, the pharmacist checks the record and confirms the right product and timing.',
  'vaccines.goodToKnowPlaceholder':
    'Wear a top with sleeves that roll up easily. Tell the pharmacist if you feel unwell today or have ever had a reaction to a vaccine. You may be asked to wait about 15 minutes after the shot.',
  'error.vaccines': 'Pick at least one vaccine, or tick "I\'m not sure".',

  // Insurance and Medicare. ".self" entries are used when the person signs up for themselves.
  'insurance.lead': "A photo of {name}'s insurance or Medicare card fills in the details.",
  'insurance.lead.self': 'A photo of your insurance or Medicare card fills in the details.',
  'insurance.kind.legend': 'What insurance does {name} have?',
  'insurance.kind.legend.self': 'What insurance do you have?',
  'insurance.kind.medicare': 'Medicare',
  'insurance.kind.other': 'Other health insurance',
  'insurance.kind.otherOnly': 'Health insurance',
  'insurance.kind.none': 'No insurance',
  'insurance.noneNote':
    'You can still sign up without insurance. At the clinic, the pharmacist will tell you the cost before giving any vaccine, and can point you to programs that may help pay for it.',
  'insurance.onFile': 'On file at {pharmacy}: Medicare number ending {ending}.',
  'insurance.takeFront': 'Take a photo of the front',
  'insurance.takeBack': 'Take a photo of the back',
  'insurance.upload': 'Upload photos I already have',
  'insurance.typeIn': 'Type it in instead',
  'insurance.frontAdded': 'Front of card: photo added',
  'insurance.backAdded': 'Back of card: photo added',
  'insurance.retake': 'Retake',
  'insurance.photoAlt.front': 'Photo of the front of the card',
  'insurance.photoAlt.back': 'Photo of the back of the card',
  'insurance.reading': 'Reading the card...',
  'insurance.readFailed': 'We could not read the card. Please type the details in.',
  'insurance.check': 'The photo filled in the details below. Please check them.',
  'insurance.fieldCheck': 'Please check this one. The photo was hard to read here.',
  'insurance.company': 'Insurance company',
  'insurance.planName': 'Plan name',
  'insurance.bin': 'BIN',
  'insurance.pcn': 'PCN',
  'insurance.memberId': 'Member ID',
  'insurance.groupId': 'Group ID',
  'insurance.forMedicare': 'For Medicare',
  'insurance.medicareNumber': 'Medicare number',
  'insurance.medicareHint': 'The photo can fill this in.',
  'insurance.ssn4': 'Last 4 digits of Social Security number',
  'insurance.secondCard': 'Add a second card',
  'insurance.secondCardNote':
    'If there is a second insurance card, bring it to the clinic and the pharmacy will add it there. Adding it here is not available yet.',
  'insurance.drop.front': 'Front of card',
  'insurance.drop.back': 'Back of card',
  'insurance.drop.hint': 'Drag a photo here, or',
  'insurance.drop.choose': 'Choose a file',
  'insurance.drop.chooseAnother': 'Choose another file',
  'insurance.drop.added': 'Photo added',
  'insurance.webcam.title': "Use this computer's camera",
  'insurance.webcam.hint': 'Hold the card up to the camera, one side at a time.',
  'camera.front': 'Front of the card',
  'camera.back': 'Back of the card',
  'camera.text': 'Hold the card inside the frame, then press the button.',
  'camera.view': 'Live camera view with a frame for the card',
  'camera.cancel': 'Cancel',
  'camera.take': 'Take the photo',
  'camera.uploadInstead': 'Upload instead',
  'camera.reviewText': 'Check that every line can be read.',
  'camera.photoAlt': 'The photo you just took',
  'camera.use': 'Use this photo',
  'camera.retake': 'Retake',
  'error.insuranceKind': 'Choose one of the options.',
  'error.medicareNumber': 'Enter the 11-character Medicare number, like 1EG4-TE5-MK73.',
  'error.ssn4': 'Enter the last 4 digits.',
  'error.insuranceCard':
    'Add photos of the front and back of the card, or type in all six details.',

  // Save time at the clinic (optional). ".self" entries are for someone signing up themselves.
  'extras.lead': 'Optional. Anything you add now is one less form at the clinic.',
  'extras.continue': 'Continue to sign',
  'extras.skip': 'Skip for now',
  'extras.health.title': 'Health questions',
  'extras.health.default': '{total} answers, all set to No',
  'extras.health.savedNone': 'Saved: all {total} are No',
  'extras.health.savedSome': 'Saved: {count} of {total} changed from No',
  'extras.health.lead':
    'All {total} start as No. Change any that should be Yes or Not sure, answering for {name}.',
  'extras.health.lead.self': 'All {total} start as No. Change any that should be Yes or Not sure.',
  'extras.health.save': 'Save answers',
  'extras.more.title': 'More about {name}',
  'extras.more.title.self': 'More about you',
  'extras.more.todo': 'Sex · Race',
  'extras.more.sex': 'Sex',
  'extras.more.race': 'Race',
  'extras.more.choose': 'Choose one',
  'sex.female': 'Female',
  'sex.male': 'Male',
  'sex.another': 'Another',
  'sex.preferNot': 'Prefer not to say',
  'race.aian': 'American Indian or Alaska Native',
  'race.asian': 'Asian',
  'race.black': 'Black or African American',
  'race.nhpi': 'Native Hawaiian or Other Pacific Islander',
  'race.white': 'White',
  'race.other': 'Other',
  'race.preferNot': 'Prefer not to say',
  'extras.address.title': "{name}'s home address",
  'extras.address.title.self': 'Your home address',
  'extras.address.todo': 'Add an address',
  'extras.address.search': 'Start typing the address',
  'extras.address.byHand': 'Type the address by hand',
  'extras.address.noMatch': 'No address found for that. You can type the address by hand.',
  'extras.address.useSearch': 'Search for the address instead',
  'extras.address.street': 'Street address',
  'extras.address.unit': 'Apartment or unit',
  'extras.address.city': 'City',
  'extras.address.state': 'State',
  'extras.address.zip': 'ZIP code',
  'extras.address.onFile': 'On file at {pharmacy}: {address}',
  'extras.address.chosen': 'Address',
  'extras.address.change': 'Use a different address',
  'extras.reminders.title': 'Reminders',
  'extras.reminders.todo': 'Phone or email for a reminder',
  'extras.reminders.phone': 'Phone number for a text reminder',
  'extras.reminders.email': 'Email for a reminder',
  'b.heading.health': 'Health questions about {name}',
  'b.heading.health.self': 'Your health questions',

  // Your details (the helper)
  'helper.lead': 'Because you are signing up for {name}.',
  'helper.leadNoName': 'Because you are signing up for someone else.',
  'helper.firstName': 'Your first name',
  'helper.lastName': 'Your last name',
  'helper.name': 'Your name',
  'helper.relationship': 'Your relationship to {name}',
  'helper.relationshipNoName': 'Your relationship to the patient',
  'helper.relationshipChoose': 'Choose one',
  'helper.relationshipOther': 'Describe your relationship',
  'helper.phone': 'Your mobile number',
  'helper.email': 'Your email',

  // Field errors
  'error.firstName': 'Enter the first name.',
  'error.lastName': 'Enter the last name.',
  'error.dobMissing': 'Enter the date of birth: month, day and year.',
  'error.dobInvalid': 'Enter a real date, like 04 12 1954.',
  'error.dobFuture': 'The date of birth cannot be in the future.',
  'error.lookupFailed': 'We could not check for a record. Please try again.',
  'error.helperFirstName': 'Enter your first name.',
  'error.helperLastName': 'Enter your last name.',
  'error.relationship': 'Choose your relationship.',
  'error.relationshipOther': 'Describe your relationship.',
  'error.phone': 'Enter a 10-digit phone number, like (313) 555-0142.',
  'error.email': 'Enter the full email address, like name@example.com.',

  // Option B: the step headings and the pass
  'b.heading.patientFound': 'Is this {name}?',
  'b.heading.patientFound.self': 'Is this you?',
  'b.start.title': "Let's save a spot at the vaccination clinic.",
  'b.start.passNote': 'Four stamps and the pass is yours.',
  'b.heading.patient': 'Who is getting the vaccine?',
  'b.heading.helper': 'And who are you?',
  'b.heading.vaccines': "Which shots go on {name}'s pass?",
  'b.heading.vaccinesNoName': 'Which shots go on the pass?',
  'b.heading.insurance': "Snap the card. We'll do the typing.",
  'b.heading.extras': 'Want to skip the clipboard?',
  'b.heading.sign': 'Last stamp: check and sign.',
  'b.pass.shots': 'Shots on the pass',

} as const;

export type StringKey = keyof typeof en;
