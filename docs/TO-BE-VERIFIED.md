# To be verified

Everything in the build that is mocked, drafted or assumed, and who needs to confirm it. Add a row whenever something uncertain goes in; remove it when it is confirmed.

Last updated: Nov 14, 2026 (after Prompt 1).

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

| Item | What the build does | Who confirms |
|---|---|---|
| Age rules per vaccine | Not built yet. Prompt 2 adds mock rules in config, chosen only so the reference scenario works (DTaP, Hib, Rotavirus and HPV hidden at age 72). | OneCare (SPEC 5.3, 9) |
| Consent on second press | Planned for Prompt 8: pressing submit with a consent unticked shows a notice, and pressing again ticks the consents and submits (SPEC 10.1, item 9). | OneCare legal |
| "No insurance" choice | Planned for Prompt 6: completes the Insurance section. Wording and what the pharmacy does next are not defined. | OneCare, pharmacy billing |
| Medicare lookup | Planned for Prompt 6 as interface only. No real lookup exists in the prototype. | OneCare |
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
| Spanish and Chinese interface strings | Translated by Claude for the strings that exist so far. | Needs a native-speaker review (Prompt 9). |

## 4. Placeholders still showing

`[Clinic address]`, `[pharmacy phone]`, the OneCare logo, "About this vaccine" and "Good to know before the shot" for every vaccine, and the purpose of Sex and Race.

## 5. Tooling

- This machine has Node 22.11. Vite 8 and Vitest 5 need Node 22.12 or later, so the project pins Vite 6, Vitest 3, TypeScript 5.9 and ESLint 9.
- The Playwright smoke test in `e2e/kit.spec.ts` has not been run: the browsers are not installed yet (`npx playwright install chromium`).
