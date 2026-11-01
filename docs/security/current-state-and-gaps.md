# Security Review — Current State and Gaps

Review scope: repository source and configuration inspected on 2026-11-01. This is not a penetration test or live infrastructure audit.

## High-priority findings

1. **Environment files are tracked in Git.** Remove tracked `.env` files, keep only sanitized `.env.example` templates, and rotate every credential/API key that has ever been committed. Deleting a file in a new commit does not erase it from Git history.
2. **Socket.IO room joins trust client-supplied IDs.** The current `join` and `join_letter` handlers do not authenticate the socket or verify access to the user/letter room. Require JWT handshake authentication and server-side authorization before joining rooms.
3. **CORS is permissive for Express.** Replace wildcard/default CORS with an explicit allowlist from `CLIENT_ORIGIN`; configure Socket.IO with the same validated allowlist.
4. **Production schema sync uses alter mode.** Replace startup `sequelize.sync({ alter: true })` with versioned migrations and a controlled release step.
5. **Upload validation trusts MIME metadata.** Add extension/content signature validation, safe generated filenames, and storage outside the application container; keep size limits.
6. **Authentication configuration fails open at startup.** Validate `JWT_SECRET` at boot and fail with a clear configuration error if absent or too short. Keep the secret outside source control.

## Additional hardening

- Add request rate limits for login, registration, share, and email endpoints.
- Validate and normalize email/username/password inputs.
- Avoid returning raw exception messages or stacks to clients in production.
- Avoid logging profile payloads, tokens, private letter content, or provider secrets.
- Restrict private letter read/update/delete endpoints by ownership or explicit recipient grant.
- Ensure optional authentication is used only on intentionally public routes.
- Add CSRF protection if cookie-based sessions are introduced.
- Add audit events for share-link creation/revocation and delivery attempts.
- Set security headers and a restrictive Content Security Policy.
- Use short-lived, random, revocable private share tokens; store only token hashes.
- Add data retention and account deletion policies.

## Credential rotation

The repository history may retain values even after tracked files are removed. Rotate exposed database credentials, JWT signing secrets, map/API keys, and any other credentials that were committed. Revoke old values, update hosting secrets, and confirm the new values are not present in Git history or build artifacts.
