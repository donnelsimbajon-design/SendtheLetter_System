# Guest first-letter practice — safe conversion experiment

2026-11-04. This feature closes the first-time signup wall identified in the product audit. It is an **experiment**, not evidence of product-market fit.

## Behavior and boundaries

- Public `/try` lets anyone write a title, recipient name and up to 12,000 characters, choose a light prompt and preview the result. No letters API request occurs while practicing.
- Only the user-visible content is stored in the current tab's `sessionStorage` (24-hour application expiry), not in query strings, browser `localStorage`, a database, or external analytics. This is **not encrypted**, might survive session restore, and must not be treated as secure long-term storage.
- `Continue to save or send` goes to signup (or directly to My Library for signed-in users) and preserves the local draft for the existing authenticated letter editor. Signup and login validate internal return destinations; the saved draft is imported as a **private** new letter.
- The temporary copy is cleared **only after the API confirms successful save/publish**, never when signup fails or the editor is closed. No automatic sending, public publishing, recipient claims or login bypass.
- Browser storage may be disabled: explain the limitation and do not send the user away with an unrecoverable draft. Existing account flows, public/private controls, original letter editor, templates, QR and guest reading remain unchanged.

## Verification

- Desktop/mobile browser test: no letter API calls during practice, refresh survives, valid signup return path, owner editor receives draft and saves private, local temporary copy cleared only after success.
- Production QA still required on real Android and iPhone, including storage-denied/private browsing behavior, tab restore, keyboard reading order, and screen reader labels.
- Measure `/try` start -> signup -> **first server-saved letter** in a privacy-preserving opt-in experiment, without collecting draft text. Do not infer actual demand from button-clicks alone.

References: [MDN sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage), [React Router useNavigate](https://reactrouter.com/api/hooks/useNavigate). This is a beta feature, not a replacement for server-backed draft reliability.
