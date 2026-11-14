# Project rules: OneCare vaccine sign-up

Read `docs/SPEC.md` before any task. It is the source of truth. `docs/reference/*.html` shows every screen and state; `docs/onecare.css` is the design system they use.

## What we are building
Two versions of one sign-up flow, served side by side at `/a` (one page, folding sections) and `/b` (one step per screen, clinic pass). Both use the same section components, data model, services, strings and stylesheet. Only the shell differs.

## Stack
If this repository already has an app, follow its stack, conventions and folder layout, and say so before you start. Otherwise use Vite, React 18, TypeScript (strict), React Router, plain CSS from `onecare.css`, Vitest with Testing Library, and Playwright.

## Rules
- Reuse the class names in `onecare.css`. Do not add a CSS framework or a component library. New styles go in the same file, using the existing variables.
- No section component may know which option it is in. Theme comes from the root class; layout comes from the shell.
- Every user-facing string lives in the string dictionaries (`en`, `es`, `zh-Hans`). No literal UI text in components.
- All "Why we ask" and "Why it matters" rows start folded.
- A folded panel is the review; its head is one button that opens it for editing. No separate Edit buttons.
- Never write to `localStorage` any field on the "Never store" list in SPEC section 6.
- Services are mocked behind interfaces in `src/services`. Never call a real endpoint or a paid API.
- Text in square brackets in the references is a placeholder. Keep it visible as a placeholder; do not invent the real value.
- Accessibility is part of done: real buttons, links and labelled inputs, `aria-expanded` on disclosures, visible focus, 44px targets.
- Keep each change small. Run type-check, lint and tests before you say a step is finished, and report what you ran.
- When the spec and a reference page disagree, stop and ask.
