# SendTheLetter 2026: market evidence, first-user journey, release plan and guardrails

Research date: **2026-11-04**. This is **directional competitive research**, not proof of product-market fit.

## What the evidence actually shows

- **Digital letters have an established audience.** FutureMe advertises **20 million+ letters sent over 20 years**, but that lifetime count does **not** measure SendTheLetter's potential market, repeat retention, paying users, or acquisition costs. Source: https://www.futureme.org/
- **The Philippines has digital reach, not guaranteed demand for our app.** DataReportal's Digital 2026 Philippine report estimates **98.0 million internet users** and **95.8 million social media user identities** in late 2025. Identity counts are not all unique people. Source: https://datareportal.com/reports/digital-2026-philippines
- **Competitors demonstrate specific gifting expectations.** OpenYourLetter supports private links/QR, photos, music, optional password and a recipient experience (https://openyourletter.com/en). Loveletter.digital advertises expiring/free trials, personalized envelopes, per-recipient links, printable keepsakes, recipient reactions and scheduled unlocking (https://loveletter.digital/features). These are **vendor claims**, not verified market share or satisfaction.
- **Phone sharing should use native share UI when supported, not promise direct Messenger/TikTok DM delivery.** The Web Share API invokes an operating-system picker, is not available in every browser, and requires a user click on HTTPS. Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API

### Our baseline at time of research

Connected production database returned aggregate counts (not raw content) on 2026-11-04: **9 accounts, 23 letters, 14 public letters, 3 repeat authors; 0 messages and follows**. Some may be test data. This is insufficient evidence for product-market fit.

**Hypothesis to test:** A meaningful-letter gift that recipients can read **without signup** and answer with a simple reaction will have stronger completion and word-of-mouth than a general-purpose public letter social feed.

## The smallest complete delight loop

1. Writer chooses occasion: birthday, gratitude, friendship, apology, or Future Me.
2. Writer types real words; auto-save succeeds; optional image/music stays subordinate to text.
3. Writer explicitly publishes a **private** letter and generates an **expiring, revocable bearer link**. An author with a public letter can use the existing public share flow.
4. Writer uses **Copy link**, operating-system share sheet (including Messenger/TikTok if offered), or an **offline-generated QR**. A recipient can read only when they possess the exact link; this is **not identity verification**.
5. Recipient opens a private envelope and reads without login or payment; sends **one optional private reaction/reply**.
6. Writer sees reply in their own panel. Recipient can optionally try creating a letter. No forced invite or conversion wall.

## Included in PR #56 (code, not all deployed)

| Capability | Implementation / limits |
|---|---|
| Private bearer invitation | Cryptographically random 24-byte token; only SHA-256 token hash in DB; new link revokes previous one |
| Expiry/revoke | 1, 7 or 30 days; manual revoke, visibility/archive/status revocation trigger |
| Free guest opening | `/open#TOKEN`; token stays out of server path/query and API is POST body; deliberately generic link preview |
| Guest reply | Reaction plus optional name/message (600-character limit); one reply per invitation; writer inbox |
| QR | Offline version 6-L SVG; never sends secret to third-party QR service; copy-link fallback |
| Social | OS share sheet + manual copy; **no unauthorized automated DM or account access** |
| API cost | Batch like/comment counts for public feed instead of per-letter queries; lazy-load friends on demand |

## Not included (still needed before a broad public launch)

**P0/P1: trust and reliability:** Historical public uploaded files and credential rotation verification, strict database TLS certificate verification, backup/restore drill, verified private-media handling, secure email verification and abuse reporting; staging tests with two distinct real accounts; schema migration review and rollback.

**P1: recipient experience:** Safe free guest write-before-signup flow, recipient link/QR forwarding tests across real Messenger/Facebook/TikTok clients, recipient identity optional verification, optional scheduled unlock countdown, accessibility/performance review on low-end Android/mobile data.

**P2: growth and sustainability:** Privacy-safe opt-in funnel analytics, consent-based reminder emails, responsive printable keepsake (e.g. PDF), habit/occasion research, anonymous community moderation, two-way reply flows, optional short video message **only** with explicit media upload authorization, storage quotas, content moderation and real pricing tests.

### Recommended low-risk next experiments

Invite **20–30 consenting test users** across 3 occasions (birthday, gratitude, friendship) plus recipients. Use fictional test data for QA and obtain express consent before sharing actual recipient letters. Capture first-user completion times and voluntary feedback; **do not send private letter text, URLs, tokens, images or email addresses to analytics**.

Proposed experiment targets, **not industry benchmarks**:
- 50%+ of first-time starters finish a first letter.
- 95%+ successful first save/reopen across real devices, with **zero observed data loss**.
- 30%+ of started letters produce a voluntarily shared invitation.
- 70%+ of invitations used in the pilot are opened.
- 10–20% of recipients choose to write their own letter.
- Zero critical privacy incidents, zero unauthorized content disclosures.

A low-frequency, occasion-driven product should judge **letter completion, successful delivery, recipient joy/replies and repeat gifting** more than daily streaks or endless-scrolling engagement.

## UX choices that should *not* be added by default

- No auto-DM, deceptive notifications, auto-generated fake emotional messages, forced signups to read a gift, or public publication of private drafts.
- No external QR rendering or URL shortener that sees private bearer tokens.
- No auto-playing hidden YouTube video (platform policy).
- No intrusive real-user letter analytics; track counts and coarse events with explicit notice/consent.
- No broad ads until measurable retention/delivery reliability exists.

## Release validation checklist

- [ ] Additive SQL migration reviewed, applied with appropriate backup/rollback plan.
- [ ] RLS enabled on new tables; anon and authenticated roles cannot query them.
- [ ] Only authenticated letter owner can create/revoke/list link info and replies.
- [ ] Private, draft, archived and future-scheduled letters never appear in public endpoints.
- [ ] Token never returned in owner status/list or shared-page public metadata.
- [ ] Expired/revoked/wrong token returns generic error.
- [ ] Actual guest can read and reply from another device without signup.
- [ ] Old links stop working after a replacement and on public/archive changes.
- [ ] QR scans to the intended letter on low-end Android/iOS.
- [ ] Frontend/backend CI, mobile/desktop tests, and production smoke gates pass.
- [ ] Verify external social sharing across Messenger/TikTok since native picker options depend on device.
