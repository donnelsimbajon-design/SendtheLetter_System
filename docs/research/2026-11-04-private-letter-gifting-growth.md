# SendTheLetter — private gifting growth research and release decisions
_Last verified: November 4, 2026. Findings reflect publicly available evidence and repo audits; this is not proof of product–market fit._

## Sources and what they actually establish

- [DataReportal Digital 2026 — Philippines](https://datareportal.com/reports/digital-2026-philippines) reports **98.0 million internet users** in October 2025 and **95.8 million social-media identities**. Identity counts are not unique persons, and neither estimate proves these people want digital letters. We should optimize a mobile/social share path, then validate actual demand with testers.
- [FutureMe](https://www.futureme.org/) publicly reports **over 20 million future letters in 20 years**. It emphasizes one easy flow: write, pick delivery date, send and verify. This is a competitor claim, not independent audit of active users.
- [Slowly official product](https://slowly.app/) and its [help center](https://help.slowly.app/hc/en-us/articles/115001740772-What-is-Slowly) emphasize intentional letter exchanges, delayed delivery, interest matching and stamps. Our differentiator should be a beautiful letter as an occasion-based **gift to someone you already know**, rather than building a duplicate pen-pal network.
- [MDN Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) verifies that websites can hand a URL to **user-selected** share targets. Target apps vary by device and browser. A normal web app cannot silently select a Facebook Messenger or TikTok conversation or send messages as the user.
- [MDN Web Share API overview](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) documents the secure-context, user-gesture and availability constraints. Therefore all share UIs must also support **Copy link** and **Download QR**.

## Product thesis and user experience

**Some feelings deserve more than a message.**

The immediate promise is: **write a heartfelt letter → privately give it to someone → let them open it for free → keep a thoughtful reply**. No account is required for recipients to open or react. The author is in control of privacy and expiry. Community is optional, not the default for intimate writing.

Release journey:
1. Writer signs in and creates a letter. Editor defaults to a **private draft** and saves as the writer types; advance options can be tucked away.
2. Writer explicitly publishes it as **private**, with any future release time already elapsed. Publishing is *not* the same as posting it to Community.
3. In Share, writer creates an expiring invitation (1, 7, or 30 days). Raw token is shown once. Creating a new token replaces all older tokens; writer can revoke at any time.
4. Writer uses **native Share**, **Copy**, or a **locally generated QR**. QR generation must not send the private URL to a third party. Share titles/previews must never reveal the letter title/body.
5. Recipient sees a generic, warm invitation and chooses **Open my letter**. No login prompt, payment, public post or forced app install.
6. Recipient may submit **one optional reaction and short reply**; abuse controls and input length restrictions apply. No claim of verifying the recipient's identity.
7. A gentle **Write a letter for someone** link invites recipients into the author journey *after* reading. No intrusive countdown, forced referrals or misleading urgency.

## Hypotheses to test with people, not promises

| Hypothesis | Evidence we need | Proposed pilot target (not benchmark) |
| --- | --- | --- |
| People will finish a meaningful letter more easily with a simple template. | Unassisted task observation, start-to-finish completion, time-on-task | >=50% completion among first-time starters |
| People will actually share letters with someone they know. | Explicit opt-in share action; no scraping of third-party messages | >=30% of started letters result in a link/QR copy or share |
| Recipients will open the gift when it arrives. | Aggregate opens/success where user consents; no storing letter contents, IPs or private token in analytics | >=70% of test deliveries opened, measured in a recruited pilot |
| Reading sparks someone else to write. | Recipient opt-in CTA, completed new letter | Test 10–20% referral-to-letter conversion |
| Reliability creates trust. | Draft reopen, media fidelity, mobile network interruption tests | Zero known data-loss or private-content exposure bugs |

These targets are **experiment goals**, not a prediction. Early accounts can include developers/test data; do not present account counts as real market traction.

## What stays free

- Reading recipient links, writing the core letter, essential private draft autosave and privacy controls must be free.
- No recipient account requirement; the recipient can decline to reply.
- Future monetization should be *optional* premium envelopes, multi-page gift designs and printable keepsakes after real feedback. Do not charge for recovery, basic accessibility or security.

## Privacy and operational requirements

- **Private by default.** A private invitation is a bearer secret: anyone who receives/forwards it can access the letter until revocation or expiry. This must be clearly disclosed.
- Store **SHA-256 hash of a high-entropy random token**, not plaintext. Keep token in a URL fragment (`/open#token`), send it in a POST body to the API, and set `Cache-Control: no-store`, `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex`. Avoid letter titles/body in social OG metadata.
- Public and private URLs are **different products**. Never reuse public Community share tokens for private recipient reads.
- Link creation must be owner-only; archived/draft/scheduled/public/time-locked letters cannot be read with recipient tokens. Changing privacy or future release state revokes existing links.
- Responses should redact writer email, address, geolocation and internal ownership. Do not add private-body analytics, QR-service fetches, or third-party advertising pixels.
- Limit guest reply attempts, enforce exactly one reply per invitation, and test replay, expiry, cross-user ownership and concurrent revocation.
- Prepare DB migration with owner review and rollback/backup. API first, website second. A failed migration must not take down existing public routes or the editor.

## API request budget and performance

- Guest opening: one POST to fetch the letter, then **zero polling** while reading.
- Guest reply: one POST on submit, no automated retry that might cause duplicate messages.
- Writer creation: one POST; status/revoke/replies fetched **on request**, not at every modal open.
- Public feeds: batch like/comment aggregate counts instead of 2–3 queries per letter; future work should add cursor pagination.
- Friend list: fetch only when the public in-app sharing panel opens.
- Avoid live analytics widgets, repeated QR network calls, periodic access-token refreshes or auto-playing media requests in the guest letter flow.
- Validate with production-like datasets; track p95 response time, 5xx rate, media payload and failure conditions before 100-user beta.

## What this PR deliberately does NOT claim to deliver

- Native Messenger/TikTok DMs or auto-sending to a particular contact (needs provider-specific authorization; web share chooses a target).
- An AI-written letter by default, verified recipient identity, public viral growth, video hosting/recording, premium billing, push notifications, or automated marketing.
- Full offline editor and resumable uploads, verified database backup/restore, public-repo uploaded-image history remediation, email verification, or shared rate limiting across all API instances.

Those require separate consent/security/operational review or external credentials. Build them based on pilot evidence instead of asserting unsupported functionality.

## Controlled-beta go/no-go

- All backend/frontend/browser/dependency checks pass for the exact commit.
- SQL migration reviewed, executed, and checked against a snapshot; new tables have RLS, no direct anonymous grants.
- Two accounts tested: only owner can generate/revoke; unauthorized author cannot view replies; draft/public/time capsule stays inaccessible; expiry/revocation removes access.
- Recipient tested on iPhone and Android; QR scans, link fragment survives copying/sharing, and the guest page works without login.
- No private text in server logs, OG cards, unauthenticated Community endpoints or error responses.
- Observed users can complete creation, sharing and replies without developer assistance.
- Operational rollback plan exists, including disabling new endpoint/UI without deleting private data.
