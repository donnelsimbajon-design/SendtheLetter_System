# Email and Social Sharing — Implementation Contract

## Current status

The existing ShareModal sends an in-app message to a friend. There is no configured email provider or Meta API integration in the inspected backend. This document defines a safe implementation path.

## Share policy

| Channel | Supported implementation | Important boundary |
| --- | --- | --- |
| Email | Server-side email provider adapter (Resend is one option) | Requires verified sender domain, API key, abuse controls, and delivery logs. |
| Facebook | Share a canonical public URL via Facebook's share dialog | Does not authorize automatic posting to a user's feed. |
| Messenger | Use device-native share sheet / supported Messenger handoff | No arbitrary unsolicited DMs. Direct messaging APIs have eligibility and policy restrictions. |
| Instagram | Generate/download a letter image and use native share sheet | Do not promise automatic feed/story publishing or unrestricted DMs. |
| Copy link | Copy a canonical public URL or authorized private token URL | Private URLs require random, expiring/revocable tokens and server-side authorization. |
| In-app message | Keep existing friend message workflow | Send a letter reference, not a truncated copy of private content, after authorization. |

## Recommended backend contracts

### Email send

`POST /api/share/email` (authenticated)

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

Only generate a public URL when `isPublic=true` and `status=published`. Add a public letter detail route that re-checks visibility on every request. Do not expose draft, scheduled, archived, or private letters through social preview endpoints.

### Private link

Use a cryptographically random token, store only its hash, bind it to one letter and optionally one recipient, add expiry and revocation, and rate-limit resolution. Do not use sequential letter IDs as secret links.

## Meta integration

- Facebook public sharing: use the supported share dialog and correct Open Graph metadata.
- Messenger: prefer native share handoff; direct messaging requires a supported Meta app setup, permissions, eligible account, and policy compliance.
- Instagram: native share sheet and generated image export are the practical baseline. Publishing APIs have professional-account and permission requirements.
- Keep provider-specific app IDs and tokens server-side where required; do not assume an app review is approved.

## Configuration

See `Note_letter/server/.env.example`. Email delivery remains disabled until the owner configures a provider key and verified sender identity.
