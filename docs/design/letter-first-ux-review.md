# SendTheLetter — Letter-first UI/UX redesign

**Status:** Draft PR #39 on branch design/letter-first-experience-20261103. **Not deployed or merged.**

## Source inspected before edits

Public pages Home, Services, About, Contact, Login, Signup, PublicWriterPage; signed-in DashboardPage, Notes, Messages and Settings; reusable DashboardLayout, Notecard, LetterEditorModal, LetterViewModal, WriterProfileScreen, Mascot and CharacterBadge; CSS design tokens, custom SVG mascots and logo, session and note stores.

## UX goals and implemented changes

1. First visit: emotional but concrete message, prominent Write CTA, native mascot artwork and clickable starting-point examples.
2. Prompt selection: allowlisted gratitude, future-self, apology or hello; safe signup returnTo or existing authenticated deep link; no guest API write.
3. Existing editor: prefill an existing template; selected template does not overwrite an existing draft; native controls and optional focus mode; honest unsaved/saving/saved status.
4. Dashboard: next actions before vanity metrics; draft continuation, letter overview, writing inspirations and community discovery.
5. Mobile: prominent Write shortcut with the original Lumi character, profile reachable from account menu, safe area and compact layouts.
6. Community: filters use real categories returned by public API; users can clear filters or find writers. Private items must never appear in public feed.
7. Public profiles and Services: consistent custom illustrations; no claims of direct recipient delivery from scheduled letters.
8. Accessibility: skip links, readable text-only controls, focusable letter-card overlay, accessible password visibility and reduced-motion support already in CSS.

## Verified UI journey map

| Entry | Action | Destination |
| --- | --- | --- |
| Public homepage | Pick gratitude/future-self/apology/hello | Existing signup with encoded allowlisted returnTo, or authenticated notes editor |
| Signup | Create an account | Safe editor returnTo or normal dashboard |
| Dashboard | Write a letter | /dashboard/notes?compose=1 |
| Dashboard | Select a prompt | /dashboard/notes?compose=1&template=future-self (or other allowlisted template) |
| Dashboard | Continue drafts | /dashboard/notes?tab=drafts |
| Notes | Open composition | Existing LetterEditorModal and existing API operations |
| Community | Pick topic | Client-side filter of existing released public letters |
| Public writer profile | Visitor wishes to write | Signup CTA |

## Automated verification

The existing Frontend quality checks workflow runs npm ci, dependency audit, TypeScript checks and Vite build plus the backend type-check. A new UI browser smoke workflow uses Chromium desktop and Pixel 7. Tests cover homepage, prompt preview, redirect preservation, signup password visibility, skip link, Services copy and 320px overflow.

Isolated authenticated browser tests mock API data; they check editor template prefill, focus mode, topic filters, and the mobile Write action. **Mocks do not establish real API/database behavior or production security.**

## Manual staging release checklist

- [ ] Check visual layout at 320px, 375px, tablet, desktop and widescreen.
- [ ] Check Warm Editorial, Cool Blue and Forest Night themes and contrast.
- [ ] Inspect animations with reduced-motion and test keyboard/screen-reader navigation.
- [ ] Verify original mascot assets on real Android and iPhone.
- [ ] Confirm all modal controls remain accessible with mobile keyboard shown.
- [ ] Test live staging signup and login: chosen prompt → expected editor.
- [ ] Test draft editing, autosave, publish, private/public visibility and session expiry.
- [ ] Test community search, category filters, comments and reactions.
- [ ] Test long titles, Unicode, image letters, error and network-offline states.
- [ ] Verify no deployed code/DB/secret changes and that production rollout readiness is separately approved.
- [ ] Approve PR only after the latest head SHA passes all CI checks and manual staging review.

## Out of scope / limitations

This redesign does not create new database tables, email delivery, a new guest backend, social network, payments, or production service integrations. The user-facing changes are on a draft branch, not live Render. Browser smoke checks are not a replacement for production, mobile physical-device or staging acceptance testing. Do not auto-merge or deploy from this design task.
