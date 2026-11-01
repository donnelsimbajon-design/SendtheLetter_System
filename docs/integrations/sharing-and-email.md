# Email and Social Sharing — Implementation Contract

## Current status

The existing ShareModal sends an in-app message to a friend. This PR adds an authenticated Resend email endpoint for letters owned by the sender. It requires `RESEND_API_KEY` and a verified `EMAIL_FROM` value at runtime. There is still no configured provider credential in this repository session and no Meta API integration.

## Share policy

| Channel | Supported implementation | Important boundary |
| --- | --- | --- |
| Email | Authenticated server-side Resend API adapter | Requires verified sender domain and server API key; current per-process sender limit is not a distributed rate limiter and delivery audit persistence remains future work. |
| Facebook | Public URL sharing through Facebook's share dialog is wired in the UI | No automatic posting to a user's feed or Meta Graph API publishing. |
| Messenger | Native device share-sheet handoff is wired in the UI | Availability depends on the device/apps; no arbitrary direct messages or Messenger API integration. |
| Instagram | Downloadable 1080×1350 PNG export and native device share-sheet handoff are wired in the UI | Automatic feed/story publishing and unrestricted DMs are not implemented; platform support varies by device. |
| Copy link | Copy a canonical public URL or authorized private token URL | Private URLs require random, expiring/revocable tokens and server-side authorization. |
| In-app message | Keep existing friend message workflow | Send a letter reference, not a truncated copy of private content, after authorization. |

## Implemented email endpoint

`POST /api/letters/:id/email` (authenticated). The author supplies `recipientEmail`; the server verifies ownership and that the letter is published, available, and not archived, then sends the full letter through Resend. Private letters are not exposed through a public URL. A per-process limit of five sends per user per hour is a basic abuse guard, not a substitute for a shared Redis/database limiter in a multi-instance deployment. Provider delivery is not active until credentials and sender-domain verification are configured.

## Further hardening and future work

### Email send

The implemented endpoint is `POST /api/letters/:id/email` (authenticated). The following requirements describe future hardening.

Request:
```json
{
  "letterId": 123,
  "recipientEmail": "recipient@example.com"
}
```

Server requirements:
- Authenticate the sender.
- Load the letter and verify sender ownership.
- Require explicit confirmation that the sender is allowed to disclose the letter to this email address.
- Validate recipient address and rate-limit sends.
- Use a server-only provider key.
- Send only the content the author explicitly chose to share.
- Persist provider message ID, status, timestamp, and safe error category.
- Never log full letter content, bearer tokens, or provider credentials.

### Public URL

Only generate a public URL when `isPublic=true`, `status=published`, the letter is not archived, and any `openDate` has passed. The public detail route re-checks these conditions on every request. Do not expose draft, scheduled, archived, or private letters through social preview endpoints.

### Private link

Use a cryptographically random token, store only its hash, bind it to one letter and optionally one recipient, add expiry and revocation, and rate-limit resolution. Do not use sequential letter IDs as secret links.

## Social preview note

The current Vite single-page app updates the document title and description after the public letter loads. Social crawlers often require server-rendered or pre-rendered Open Graph tags, so reliable per-letter Facebook/Instagram link previews still need SSR, prerendering, or an edge metadata endpoint. Do not promise a unique preview until verified with platform sharing debuggers.

## Meta integration

- Facebook public sharing: use the supported share dialog and correct Open Graph metadata.
- Messenger: prefer native share handoff; direct messaging requires a supported Meta app setup, permissions, eligible account, and policy compliance.
- Instagram: native share sheet and generated image export are the practical baseline. Publishing APIs have professional-account and permission requirements.
- Keep provider-specific app IDs and tokens server-side where required; do not assume an app review is approved.

## Configuration

See `Note_letter/server/.env.example`. Email delivery remains disabled until the owner configures a provider key and verified sender identity.
