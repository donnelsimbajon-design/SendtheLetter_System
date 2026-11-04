# SendTheLetter — research-backed product strategy and safe beta checklist
**2026-11-04 · PR #56 · Research synthesis, not proof of product–market fit**

## 1. Market evidence and realistic positioning

- [FutureMe](https://www.futureme.org/) is a successful long-running future-letter product; its own public landing page reports over **20 million letters** sent. That is a **provider claim about historical letter volume**, not independent conversion or current monthly active-user data.
- [Slowly](https://slowly.app/) centers deliberate pen-pal communication and delayed letter delivery. Its model differs from instantly shared personal gift letters.
- [MDN Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API): on supported HTTPS devices, native sharing invokes a **user-chosen** share target. It cannot silently select a Messenger/TikTok conversation, and unsupported browsers need Copy Link.
- [TikTok Content Posting API](https://developers.tiktok.com/docs/en/content-posting-api-get-started): direct posting images/video is an authorized creator-content workflow requiring developer integration, permissions and audit; it is **not** an API for sending DMs to any target user.
- Personal emotional writing is **not the same thing as daily social engagement**. A gift/occasion product should measure delivery and recipient satisfaction, not push daily streaks or intrusive notifications.

**Working hypothesis:** first-time visitors most want to write a thoughtful, pretty letter, deliver it to one person, and know it was appreciated. **Unverified:** whether enough real people will choose this over messaging apps, whether they return, and what monetization (if any) is desired.

**Differentiator to test:** **“Some feelings deserve more than a message.”** SendTheLetter is a mobile-first private letter gift, with a gentle public-writing community as an optional activity — not a general-purpose social network, chat app, or video platform.

## 2. Existing product (do not recreate)

The repository already contains letter drafts/autosave, picture import and positioning, a letter-book reader, template prompts, private/public status, scheduled release, profile pages, public Community and guest comments/gifts, Spotify playback links, YouTube external links, share sheet support, and authenticated messaging. This PR reuses those instead of adding duplicate systems.

Outstanding platform audit to track separately: git-tracked uploads and historical secrets, strict database TLS CA, real-user save/restore testing, accessibility in actual devices, account verification and abuse controls, upload retention, private media storage and account deletion; see [production audit](../audits/2026-11-04-production-readiness.md).

## 3. PR #56 MVP: recipient invitation and free gift reading

**Author story**
1. Sign in; create and **publish a private** letter in My Library.
2. Open *Share Letter* → *Send to someone special*; explicitly choose **1, 7 or 30 days** and create a link.
3. On creation, an existing invitation for the same letter becomes unusable. Token is 24 cryptographically random bytes (192 bits); server stores only SHA-256 hash. The author copies the link or downloads a QR card generated **locally** without a third-party URL service.
4. Share via Web Share or manual copy/paste to Messenger, Facebook chat, TikTok messages, etc. **No automatic DM.**
5. Owner can revoke access or inspect short guest replies. There is no live “who opened this letter” tracking. One reply per invitation protects the simple guest experience.

**Recipient story**
1. Tap or scan private `/open#<token>` link (fragment not included in ordinary static-site URL requests).
2. See a generic envelope reveal and *Open my letter*. **No account, payment or login** required.
3. Read the letter and optionally send **one** emoji reaction and a short private reply. A recipient is identified only by possession of the link; this is **not** proof of identity.
4. “Write a letter back” is an optional CTA after reading, never an obstacle to reading or reacting.

**Security and expectations**
- Treat invitations as bearer links: **anyone who receives or forwards a valid link can read**. Do not send secrets/passwords or confidential records. Invite can be revoked and expires automatically.
- Private letters never enter the public feed. Public OG metadata is **not** generated for private letters. Guest API payload excludes recipientAddress, coordinates, shareToken, owner user ID and private account data.
- The token stays in a URL **fragment** (not web-server access URL) and is submitted in HTTPS POST body to API; no raw token in database.
- Guests cannot upload files or videos, write to Community, impersonate account owners, or view other private replies.
- New private tables have RLS and explicit removal of `anon` / `authenticated` grants; authorization is enforced by the existing Express API with owner check and token hashing.
- In-memory rate-limiting is a **beta safeguard**, not a distributed production protection. Shared persistent limits, content moderation and anti-abuse review remain pre-scale tasks.

## 4. Lower API load

- Public feed/profile currently needs like/comment counts for every letter. This PR replaces `2N` or `3N` separate count/look-up statements with up to **3 batch statements** (the letter query remains), without changing existing API JSON shape.
- Friends in Share Modal are **lazy-loaded only on demand** instead of one request every time Share Modal opens.
- Recipient page performs one private API read and, if the user voluntarily replies, one POST; no polling, no analytics beacons, no needless request after each text input.
- Generating QR is entirely browser-side; no service/API request.
- **Follow-up performance work:** pagination for oversized public feeds, attachment object storage instead of base64 JSONB, cached non-sensitive lists with invalidation, DB index review, shared spam rate limits, 5xx/p95 monitoring. Changes are **not** in this PR to avoid changing existing client contracts during core sharing rollout.

## 5. Public launch validation, not just green CI

**Required security/technical gates**
- Frontend TypeScript and production build, backend TypeScript and test suite, desktop/mobile Playwright.
- Apply additive SQL migration **before** enabling/merging server routes; verify both new tables have RLS, zero direct `anon`/`authenticated` grants and no policies.
- With two isolated *test accounts*, verify owner-only create/status/revoke/reply inbox; invalid, expired, archived, scheduled and published-public letters return no private details.
- Exercise link creation, QR scan (Android and iPhone), guest read and reply using two browsers. Verify old links are revoked after replacement and visibility change.
- Test real HTTPS share sheet on phone; where native sharing unavailable, copy/paste works.
- Prove the API returns no private addresses or account emails; inspect response/cache headers.
- Test browser back/reload, copy URL to a separate device, render on 320/375/768/1280px; no horizontal overflow.
- Enable live Render SPA rewrites; smoke-check `/open` direct route. Do **not** claim this is verified merely because mock Playwright succeeds.
- Have a DB backup/restore plan and rollback path (disable recipient routes/UI, preserve stored table rows). Never delete existing letters or photos.

**Out of scope / later PRs**
- Video uploads, TikTok posting integration and automatic DMs (third-party approval and policy/abuse constraints).
- Private letters from unauthenticated **authors**, unless secure browser draft recovery and abuse controls are designed.
- Multi-user collaborative letters; email verification; dedicated private image-storage migration; account deletion, payments or subscription billing; marketing telemetry; global CDN and production load tests.
- No claim that every previously suggested feature has been built in this one release.

## 6. First 30-day measured pilot

| Week | Goal | Evidence to collect |
|---|---|---|
| 1 | Internal release safety | 100% of test invitation create/read/revoke/reply flows pass; zero cross-account reads |
| 2 | Recruit 10–20 consenting testers | % able to make and privately share their **first letter without help** |
| 3 | 20–30 consent-based occasion letters | Invite→open conversion, author-reported recipient delight, number of genuine replies |
| 4 | Iterate after qualitative research | Why users abandoned, QR usefulness, repeat occasion, willingness to recommend |

**Initial experiment targets (not industry benchmarks):** 50% of testers who begin creation finish one letter; 70% of successfully delivered test invitations opened; zero observed private-data leaks or lost drafts; collect at least 10 structured usability interviews. These are hypotheses, not guarantees and cannot be inferred from existing database counts.

**Interview prompts:** “Show me how you would send a birthday letter”; “Where did you hesitate?”; “Would you use a private link or QR?”; “What would you fear others might see?”; “Would you send a second letter in the next month/occasion?”; “Do you prefer anonymity, reply, or read receipt?”; “What can this do that a messenger chat cannot?”

**Avoid vanity growth:** Do not measure success by forcing daily logins or auto-sharing private letters. Prefer recipient-open success, first-letter completion, voluntary recommendations, accessibility and trust.

## 7. Free plan and later monetization

Keep writing, basic templates, private delivery, QR, recipient reading and replies **free during the pilot**. If actual demand emerges, consider optional premium design assets or professionally printable keepsakes; never paywall essential security/privacy, the ability to recover drafts, or reading a letter someone sent.

## 8. Near-term remaining product backlog

**P0:** Restore/test private media handling, credential rotation, database trust chain, real-account link isolation and safeguards. **P1:** onboarding simplification, server pagination, real-device QR and accessibility, moderation/reporting, readable Help/Privacy pages, support feedback. **P2:** opt-in event reminders, consent-based occasion kits, print-ready keepsakes, export and shared replies. **P3:** optional external video surprise links with permission/licensing, no hidden YouTube audio/video and no hosted unmoderated uploads.

This plan is a **product hypothesis and launch protocol**. Shipping code alone cannot establish demand; only observed use by independently recruited people can validate it.
