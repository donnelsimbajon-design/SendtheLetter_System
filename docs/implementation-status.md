# Implementation Status and Acceptance Criteria

This file is the source of truth for the scope of the architecture and integration work. Do not mark a row complete solely because a button or diagram exists.

| Workstream | Current repository state | Acceptance criteria |
| --- | --- | --- |
| Architecture diagrams | Added in this PR | Diagrams match source and label planned components as planned. |
| Environment hygiene | Tracked env removal and examples added in this PR | No active secrets in tracked working tree; owner rotates historical values. |
| Auth | JWT + bcrypt model hooks exist | API tests for register/login, malformed tokens, expiry, and authorization. |
| Letter CRUD | Existing API/model | Tests for ownership, public/private visibility, draft and archived status. |
| Time Capsule | Fields and listing endpoints exist; no worker found | Durable worker, atomic claim, retries, idempotency, recipient delivery, timezone tests. |
| Email | Authenticated Resend endpoint implemented; disabled until provider secrets are configured | Verified sender, shared rate limiting, durable delivery records, provider integration tests. |
| Facebook | Not integrated | Public URL sharing, Open Graph preview validation. |
| Messenger | Not integrated | Native share handoff verified on supported devices; no arbitrary DMs. |
| Instagram | Not integrated | Image export and native share sheet tested on supported devices. |
| Private share links | Not implemented | Random token, hash storage, expiry, revocation, recipient authorization, audit trail. |
| Realtime | Socket.IO exists | Handshake JWT auth and authorized room membership tests. |
| Upload storage | Local Multer directory | Content validation and durable object storage in production. |
| CI | Frontend workflow exists | Backend type-check/build/tests plus frontend checks pass. |

## Owner-provided setup still required

- Rotate credentials that were committed in repository history.
- Configure production `DATABASE_URL` and `JWT_SECRET`.
- Choose and configure an email provider and verified sender domain.
- Configure Meta app credentials only if a later API feature genuinely needs them.
- Supply staging/production host and domain access for deployment verification.
