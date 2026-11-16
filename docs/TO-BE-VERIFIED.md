# To be verified

Everything in the build that is mocked, drafted or assumed, and who needs to confirm it. Add a row whenever something uncertain goes in; remove it when it is confirmed.

Last updated: Nov 16, 2026 (after the second review: SPEC 10.1, items 13 to 19). A short version for OneCare is in `TO-BE-VERIFIED.xlsx`.

## 1. "Why we ask" wording

Source: `Field_Reason.xlsx`, column "Reason (To be checked)". The wording below is an official-style rewrite, stored in `src/i18n/en.ts` under the key shown. The spreadsheet marks every row "Verified? Nope", so the build shows "Draft wording, not yet approved." above the reasons. Spanish and Chinese versions do not exist yet (Prompt 9).

| Field | Key | Wording in the build | Open question from the spreadsheet |
|---|---|---|---|
| First and last name | `reason.patient.name` | The patient's legal name is used to identify them, to locate their record at the pharmacy and in the state immunization registry, and to match the name on the insurance claim. Enter it as it appears on the insurance or Medicare card. | Does the name have to match the insurance card exactly for billing? |
| Preferred name | `reason.patient.preferredName` | Optional. If provided, this is the name used to address the patient in text messages and emails. It is not used on insurance claims. | Confirm it is used only in messages, never on claims. |
| Date of birth | `reason.patient.dob` | Date of birth is used to verify insurance, to locate an existing record, and to determine which vaccines and questions apply at the patient's age. | The age rules for fields come from OneCare notes. |
| Sex | `reason.patient.sex` | Optional. [Purpose to be confirmed by OneCare.] | Reason is "SDOH study (research grant)?". If research is the only use, is separate consent wording needed? Is it needed for claims or the pregnancy question? |
| Race | `reason.patient.race` | Optional. [Purpose to be confirmed by OneCare.] | Same question as Sex. Include "Prefer not to say". |
| Medicare number | `reason.insurance.medicareNumber` | The Medicare number is required to bill Medicare, so that the patient is not charged out of pocket. | People 65 and over without Medicare, people under 65 with Medicare, Medicare Advantage cards. |
| Last 4 of SSN | `reason.insurance.ssn4` | The last four digits of the Social Security number are used by the pharmacy to bill Medicare correctly, so that the patient is not charged out of pocket. | What exactly is it used for, and is it required under 65? |
| Card photo | `reason.insurance.cardPhoto` | Optional. A photo of the card allows the insurance details to be read and filled in automatically. The images are kept for the pharmacy. | Which fields read reliably? Where are images stored and for how long? Are both sides always needed? |
| Insurance company | `reason.insurance.company` | The pharmacy requires the name of the insurance company to bill for the vaccine. It is shown on the insurance card. | Are the insurance fields required to submit? |
| Plan name | `reason.insurance.planName` | The plan name is shown on the insurance card and is used for billing. | Is it needed for the claim, or can it be dropped? |
| BIN | `reason.insurance.bin` | The BIN routes the pharmacy claim to the correct claims processor. | Confirm with the pharmacy's billing team. |
| PCN | `reason.insurance.pcn` | The PCN is a second routing number, used together with the BIN. | Confirm with the pharmacy's billing team. |
| Member ID | `reason.insurance.memberId` | The member ID identifies the patient on the insurance plan. | Confirm with the pharmacy's billing team. |
| Group ID | `reason.insurance.groupId` | The group ID identifies the employer or group plan. | Confirm with the pharmacy's billing team. |
| Helper name | `reason.helper.name` | Your name records who completed this form and who is signing on the patient's behalf. | OneCare notes give no reason for these fields. |
| Helper relationship | `reason.helper.relationship` | Your relationship shows the basis on which you are signing for the patient, for example as a parent, an adult child or a legal representative. | Which relationships are accepted, and is any proof needed? |
| Helper phone | `reason.helper.phone` | Reminders and contact on the day of the clinic go to the person managing the appointment. | Should reminders go to the helper, the patient, or both? |
| Helper email | `reason.helper.email` | The confirmation and the reminder are sent to the person managing the appointment. | |
| Home address | `reason.extras.address` | Optional. The pharmacy keeps the patient's home address on file for future medication delivery. It is not required for billing. | Another note says the address is needed "for insurance" when a helper fills in the form. Which is right? |
| Reminder phone | `reason.extras.phone` | Optional. The phone number is used to send a reminder before the clinic. | Does a text reminder need its own consent line? |
| Reminder email | `reason.extras.email` | Optional. The email address is used to send the confirmation and a reminder, and to help verify insurance. | How is email used for insurance verification? Remove that clause if it is not. |
| Health questions | `reason.extras.health` | The pharmacist needs these answers before giving a vaccine. | Answers stay preset to No at OneCare's direction. |
| Who is signing | `reason.sign.signer` | This records whether the patient or the person helping them signed, together with the signer's name. | New fields, not on the current site. |
| Signature | `reason.sign.signature` | The signature is the record of consent. | Is a typed name acceptable? Can signing wait until the clinic? |
| Pharmacy consent | `reason.sign.pharmacyConsent` | This records consent to be vaccinated by the pharmacy and to have the insurer billed. | The text says the vaccine information was reviewed, but the form never shows it. Needs legal review. |
| OneCare consent | `reason.sign.onecareConsent` | This records agreement to the OneCare terms of service and privacy notice. | |

Notes on this table:

- The spreadsheet says "Guardian". The build says "helper" or "the person helping them", because the spreadsheet also asks for neutral wording.
- The spreadsheet lists **Middle name**. SPEC 5.2 does not, so the build has no such field.
- "Why it matters" for the 16 vaccines uses the spreadsheet's patient-facing drafts unchanged (`vaccine.*.why`). The spreadsheet says Hailey writes the final copy, and that the flu and COVID-19 product guidance needs clinical sign-off.

## 2. Rules and logic

Changed on Nov 16, 2026. Where a row further down says something else, these rows win.

| Item | What the build does | Who confirms |
|---|---|---|
| Products for every vaccine | **Draft by Claude from general knowledge, not checked against any source.** Every vaccine lists US brand names: flu 4, COVID-19 3, RSV 3 (Arexvy, Abrysvo, mResvia), Tdap 2 (Boostrix, Adacel), shingles 1 (Shingrix), pneumococcal 4 (Prevnar 20, Capvaxive, Vaxneuvance, Pneumovax 23), hepatitis B 3 (Heplisav-B, Engerix-B, Recombivax HB), hepatitis A 2 (Havrix, Vaqta), MMR 2 (M-M-R II, Priorix), varicella 1 (Varivax), polio 1 (IPOL), meningococcal ACWY 2 (MenQuadfi, Menveo), DTaP 2 (Daptacel, Infanrix), Hib 3 (ActHIB, PedvaxHIB, Hiberix), rotavirus 2 (RotaTeq, Rotarix), HPV 1 (Gardasil 9). The list is in `src/data/vaccines.ts`. | OneCare, clinical: which products does each clinic stock? Are any missing, withdrawn or renamed? |
| Product details | **Draft by Claude, not checked.** One line under each product (maker, type, age range or number of doses), in `product.<id>.details` in the three dictionaries. Shown under "Product notes are a draft, not yet approved." Age ranges and dose counts in particular must be checked against the current package inserts and CDC schedules. | OneCare, clinical sign-off |
| Product choice for children's vaccines | A product can be chosen for every vaccine, including DTaP, Hib and rotavirus, where the product normally follows the child's earlier doses. | Clinical: should the product be chosen by the patient at all for these? |
| Sex is required | Required in the Patient section, with "Prefer not to say". Because it is never stored on the device, a refresh or "Continue your sign-up" shows Patient as not finished until it is chosen again. | OneCare: is it required? Privacy: may it be stored so it is not asked twice? |
| Whose email | "Mine", then for a helper the patient, then the list of "Your relationship to [name]" (daughter or son, spouse or partner, parent, legal guardian or representative, other). | OneCare: which choices does the pharmacy need? |
| Sex choices | Female, Male, Non-binary (X), Prefer not to say. "X" follows what US passports and many state IDs use; the list is still my choice. | OneCare: which values do the pharmacy system and the state registry accept? |
| Stamps as buttons (B) | Any stamp opens its step, also one further ahead. Nothing can be sent until the earlier steps are finished: Sign lists what is missing. | Product owner |
| Reminder colour | Yellow in A, light blue (`#DCE8FA`) in B. The blue is my choice. | Product owner |
| OneCare logo | An SVG drawn by Claude from a small picture: four rounded tiles on a transparent background, the top right one turned 45 degrees (the angle is my reading of the picture), also used as the browser tab icon. It is not the official artwork. | OneCare: supply the real logo file |
| Confirmation email | Required in the Patient section, with "Whose email is this?" (the patient's, a parent's or guardian's, the helper's, or someone else's). It is stored in device memory together with whose it is. The helper step no longer asks for an email. | OneCare: may a sign-up be sent without an email? Is "whose" needed by the pharmacy? |
| Sex | Asked in the Patient section, optional, never stored on the device. The choice list is still a mock. | OneCare |
| Names | The first letter of first name, last name, preferred name and the signer's name is made a capital. Only the first letter, so "de la Cruz" becomes "De la Cruz". | Product owner |
| Insurance: "I'm not sure" | Completes the section like "No", with a note to bring any card to the clinic. The wording of the note is a draft by Claude. | OneCare, pharmacy billing |
| Insurance: Medicare from 65 | Medicare can be chosen from age 65 on the clinic date. Under 65 the type is not asked and the "Other insurance" fields show. | OneCare: people under 65 with Medicare, people 65 and over without it |
| Insurance: fields | Typed in: insurance company, plan name, BIN, PCN, member ID (all required), group ID (optional) and last 4 of SSN; or Medicare number and last 4 of SSN. A photo sign-up is complete with both photos and asks for no SSN digits. | Pharmacy billing: which are really needed? Is the last 4 of the SSN needed for other insurance? |
| Insurance: what the photo read | Shown in one line ("We read this from the card: ...") with the way to correct it by hand. The mock reader always returns the same sample values, also for a Medicare card. | Whoever builds the real card reader |
| Phone number | Optional, in the optional section, "in case the pharmacy needs to reach" the patient. Stored in device memory. | OneCare |
| Reminders | Opt-in, by email, by text message, or both, to the email or phone given earlier or to a different one. The line "The sign-up confirmation is emailed whether or not you choose a reminder" is a draft. No real message is sent. | OneCare legal: does a text reminder need its own consent wording? |
| Health questions status | "Not started" until opened and saved. Opened, all 14 start at No. Never saved: sent as "not answered". | OneCare, clinical |
| Who signs | With one possible signer the question is left out and the name is filled in. A typed signature still needs its tick box. | OneCare legal |
| Room under the last panel (wide screens) | Option A leaves empty space under the last panel on wide screens, so a short section near the end can still scroll up level with the side column. | Product owner |
| Age rules per vaccine | **Mock**, in `src/data/ageRules.ts`: DTaP up to 6, Hib up to 4, Rotavirus under 1, HPV 9 to 45, Tdap from 7, Shingles from 50, RSV from 60, the rest at any age. Chosen only so the reference scenario works (DTaP, Hib, Rotavirus and HPV hidden at age 72) and every vaccine can be reached. Not clinical guidance. | OneCare (SPEC 5.3, 9) |
| Rows outside the usual age | All vaccines are shown (SPEC 10.1, item 12). When a vaccine outside the mock age rules is ticked, the row shows a note that it is not usually given at that age and that the pharmacist will confirm. It never blocks. The wording is mine. | OneCare, clinical sign-off |
| Adding a vaccine | Ticking the box adds the vaccine and opens its details; the chevron opens and folds them. One row is open at a time. | Product owner (SPEC 5.3 says select and expand; SPEC 10.1 item 6 says the chevron shows the details) |
| Which product comes first | The product chosen now, else the one from last time, else the first in the list. With no earlier product nothing is preselected. | OneCare |
| "Had it" warning wording | Says "this vaccine" and "they", with no bold date. Pressing "Keep it" hides it; ticking the vaccine again later shows it again. | OneCare |
| Registry line | "Based on the state immunization registry (MCIR) and ...": the state name is not spelled out as in A05. | OneCare |
| When the lookup runs | Half a second after name and date of birth are complete, or at once on Continue. A record that is found replaces the fields with the record to confirm. | OneCare |
| Masked rows of a found record | Home address, phone and insurance on file are shown but cannot be changed from the Patient section; only name, preferred name and date of birth open for editing. The reference says "Tap any line to change it". | OneCare |
| Record after a refresh | The record is never stored, so after a refresh or "Continue" it is looked up again without asking, and a patient who was confirmed before is confirmed again. | OneCare privacy |
| Under 18 and "Myself" | The sign-up carries on with a note and adds the "Your details" step. The wording of the note is mine. | OneCare |
| Products per vaccine | **Mock**, in `src/data/vaccines.ts`: four flu products and three COVID-19 products, so "Other options (5)" can be shown. The other 14 vaccines have no product list, so they show no product choice. | OneCare, clinical sign-off |
| Product with no history | Nothing is preselected when the record shows no earlier product. | OneCare |
| Age cut-offs | Under 18 needs a helper and cannot sign; 65 and over is offered Medicare. Age is counted on the clinic date. | OneCare (SPEC 9: 65 and over without Medicare, under 65 with Medicare) |
| "Your details" fields | All five are required: first name, last name, relationship, mobile number, email. | OneCare (the spreadsheet marks them "Conditional") |
| What completes Insurance | "No insurance", or Medicare number plus last 4 of SSN, or for other insurance both card photos or all six typed fields. | OneCare, pharmacy billing |
| Address on file | The lookup returns the address masked, so a found record prefills only "an address is on file". The full address never reaches the browser and is not written to device memory. | OneCare |
| Device memory default | The flag is **on** in the prototype so the "Welcome back" screens can be shown. It should be off in production until privacy sign-off. | OneCare privacy |
| Progress in device memory | Besides the current section, the list of finished sections is stored, so a refresh shows the same panels as done. It holds section names only, no content. SPEC 6 names "current section" but not this list. After a refresh, Insurance, the optional details and Sign are never shown as done, because their content is not stored. | OneCare privacy |
| When a draft is first stored | As soon as the person says who the sign-up is for, before any name is typed. | OneCare privacy |
| Refresh on Done | The Done screen is not restored after a refresh: a sent sign-up is not continued, so the person lands on Start. | OneCare (revisit in Prompt 8) |
| Sex and race choices | **Mock**, in `src/data/demographics.ts`. Sex: Female, Male, Another, Prefer not to say. Race: the US federal (OMB) categories plus Other and Prefer not to say. OneCare has not supplied either list. | OneCare (and the research-consent question in section 1) |
| Health answers | Edited on their own view and saved only with "Save answers"; leaving the view discards changes. The summary counts answers changed from No. Answers never saved are sent as "not answered" (SPEC 10.2). | OneCare |
| Home address by hand | Counts as added as soon as any part is typed. No address is checked against a real service. | OneCare |
| Reminders | Phone and email are checked only when filled in. A wrong one blocks "Continue to sign" but not "Skip for now". | OneCare |
| Health questions address in the URL | The health view is `?view=health` on the section address, so the browser Back button leaves it. | Product owner |
| Explanations written in place of placeholders | At the product owner’s request, seven bracketed placeholders now hold draft text by Claude: why Sex and Race are asked, "About this vaccine", "Good to know before the shot", the "No insurance" note, the "Add a second card" note, and "Read the vaccine information". They are also in `Field_Reason.xlsx`. None is confirmed, and the Sex and Race wording states a research use that OneCare has only noted with a question mark. | OneCare, clinical and legal |
| Address suggestions | The mock completes any "house number + street" with five Michigan cities, so the type-ahead answers whatever a tester types. These are not real addresses. | Replaced by a real address service |
| Camera on a wide screen | The QR hand-off is gone; the third tile uses the computer’s own camera. A phone hand-off needs a server to pair the two devices. | Product owner, when a backend exists |
| Optional sub-panels | "More about", home address and reminders start open. The health questions are still their own view. | Product owner |
| Header and progress | Stay at the top of the screen while the page scrolls, except on very short or very narrow screens. | Product owner |
| Demo notice | Start shows "Demo only" while `demoNotice` is on in the config. Turn it off for a real launch. | Product owner |
| Consent version | Stored with each signature as the placeholder `draft-2026-11`. | OneCare legal |
| Sample card and addresses | The mock card reader returns made-up values ("Sample Health Plan", BIN `000000`). The address list is 12 made-up addresses. | Replaced by real services in Prompt 12 |
| `readCard` argument | Takes a third argument, `'medicare'` or `'other'`, beyond the two in SPEC section 8, so the reader knows which card to expect. | Whoever builds the real endpoint |
| Consent on second press | Built as decided (SPEC 10.1, item 9): consents start unticked; pressing the submit button with a box unticked shows a notice, and pressing it again ticks every box and sends the sign-up. Changing anything in between resets this. Whether agreeing this way is valid consent is a legal question. | OneCare legal |
| Consent wording | Draft, from the reference page. The helper version starts "I am signing for [patient]"; the version for someone signing for themselves is my rewording in the first person. | OneCare legal |
| Terms and vaccine information | Both links open a bracketed placeholder. They sit under the consent box, not inside its text, so tapping them does not tick the box. | OneCare |
| Who can sign | The helper by default when there is one, else the patient. A patient under 18 is not offered as signer. | OneCare legal |
| Drawn signature | Saved as a PNG picture of the canvas. People who cannot draw use Type. | OneCare legal |
| Calendar file | One hour long, because the clinic has no end time yet. Location is the pharmacy name plus the address placeholder. | OneCare |
| Changes after signing | A "Still open" row on Done opens the optional details and returns to Done. What is added there is not sent again: the mock is only called once, at signing. | Whoever builds the real endpoint |
| Confirmation number | Shown on Done. The mock returns `OC-MOCK-0001` and so on. | OneCare |
| "No insurance" choice | Completes the Insurance section and shows a bracketed placeholder for what happens next. | OneCare, pharmacy billing |
| Medicare lookup | Interface only: when the record has Medicare on file, the section shows "On file at [pharmacy]: Medicare number ending K73". The number and the last 4 of the SSN are still asked for. No real lookup exists. | OneCare |
| Insurance choices | Medicare, "Other health insurance" and "No insurance" from age 65; "Health insurance" and "No insurance" under 65. The person picks one before anything else shows. This differs from A06, which shows the photo buttons straight away. | Product owner |
| Low-confidence readings | A field read with confidence under 0.7 is marked "Please check this one" until the person edits it. The threshold is mine. | Whoever builds the real card reader |
| Camera fallback | Without a camera, or when permission is refused, "Take a photo" opens the phone camera through a file input, with no error message. Some browsers refuse to open a file picker after a permission prompt; then the next tap opens it. | Test on real iOS and Android devices |
| Camera not tried on a real device | The camera view is covered by tests with a mocked camera only. It has not been run against a real camera. | Test on real devices |
| Photo capture | The whole video frame is saved as a JPEG, not cropped to the card frame. | Whoever builds the real card reader |
| Desktop layout | Drop zones and the QR tile replace the camera buttons from 900px wide, whatever the device. The QR hand-off is a placeholder. | OneCare |
| Which insurance fields are required | Treated as required behind one config flag (SPEC 5.4), except when "no insurance" is chosen. | OneCare |
| Typed signature | Type is the default mode. | OneCare legal (SPEC 5.7) |
| Device memory | Behind a config flag. | OneCare privacy (SPEC 6) |

## 3. Design system choices made in Prompt 1

| Item | What the build does | Why it needs a look |
|---|---|---|
| Type scale | The fourteen font sizes in `docs/onecare.css` became a six-step scale: 14, 15, 16, 18, 21 and 24 to 27px (the largest shrinks on narrow screens). Sizes 17 and 19 became 18; 20 and 22 became 21; 13 became 14. Two sizes stay outside the scale: the logo placeholder (11px) and the script signature (44px, was 46). | Text no longer matches the references pixel for pixel. |
| Control heights | Inputs and buttons 52px (were 56 and 58), list rows 56px (were 60 to 68), small buttons 44px (were 46). | Tighter than the references, still at or above 44px. |
| Field error color | Amber, from the existing `--warn` variables, with an icon, a thicker border and a message. | Prompt 1 says to use existing variables. Red is more usual: change `--error` and `--error-bg` in one place if wanted. |
| Button text color | Follows each class, so "Why we ask" and link buttons are green and camera buttons are white. | The reference pages show `<button>` text in dark ink, because `.oc button{color:inherit}` outranks the class colors there. |
| Vaccine row | The status chip is inside the checkbox label and drops under the name on a narrow screen. | Differs from the reference markup. |
| Inline links | Links inside sentences (consent text) are about 19px tall. | SPEC 7 asks for 44px targets; inline links are the one exception. |
| Spanish and Chinese | All 454 strings are translated by Claude, in `src/i18n/es.ts` and `src/i18n/zh-Hans.ts`. The 14 health questions and 5 consent and signature texts are marked `needsReview` and listed in `TRANSLATION-REVIEW.md`. Everything else is ordinary interface text that a native speaker should still read. | Professional translator for the marked entries; native speakers for the rest |
| Spanish choices | Formal "usted"; "farmacéutico" and "paciente" in the masculine; vaccine names such as "Culebrilla" and "Triple vírica (MMR)". | Native speaker |
| Chinese choices | "接种人" for patient, "通行证" for pass, first name labelled "名" and last name "姓" with the field order unchanged. | Native speaker |
| Screens not checked in three languages | Done, the camera view and the 1280px layouts were not part of the 390px language sweep. | Check before launch |

## 4. Placeholders still showing

`[Clinic address]`, `[pharmacy phone]`, and the terms of service and privacy notice. The logo is a drawing, not the official file.

## 5. Accessibility

See `ACCESSIBILITY.md` for the audit. Still to do before launch: a pass with real screen readers, a look by eye at every screen at each size, and the camera view on real phones.

## 6. Tooling

- This machine has Node 22.11. Vite 8 and Vitest 5 need Node 22.12 or later, so the project pins Vite 6, Vitest 3, TypeScript 5.9 and ESLint 9.
- The Playwright smoke test in `e2e/kit.spec.ts` has not been run: the browsers are not installed yet (`npx playwright install chromium`).
