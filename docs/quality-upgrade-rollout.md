# SendTheLetter — consolidated quality upgrade (2026-11-02)

This PR upgrades profile uploads, notification UX, scheduling validation, and community filtering without altering existing account/letter tables.

## Production rollout prerequisites

**Do not merge/deploy profile-storage changes without reviewing this checklist.**

1. Supabase project: `Sendthe_letter`. The existing `uploads` bucket is **public**. It may ONLY hold public profile pictures and cover photos. Never upload private letters, drafts, capsule contents, or private attachments to this bucket.
2. On the **Render API service only**, set `SUPABASE_URL` to the project's HTTPS URL, `SUPABASE_SECRET_KEY` to the modern server-only `sb_secret_*` key (preferred), or `SUPABASE_SERVICE_ROLE_KEY` to the legacy service-role JWT, and optionally `SUPABASE_STORAGE_BUCKET=uploads`. Never configure a publishable key for this. Do not add these to frontend `VITE_*` values, GitHub files, screenshots, or browser code. Rotate credentials through Supabase if they were ever disclosed.
3. Test profile avatar + cover upload with a test account, verify both files survive an API restart/redeploy, and confirm that old `/uploads/...` images still render (legacy compatibility). Existing files are **not** migrated automatically. Keep the old files available until an owner-authorized migration, including verification/rollback.
4. A server with no Supabase credentials uses the old local-disk fallback for development compatibility; this is **not durable production storage**. Confirm secrets are configured before enabling profile uploads on the live API.
5. No SQL changes are required. Keep storage RLS policies restrictive; the privileged key exists only in server environment variables and should never be sent to a client.
6. Rollback: redeploy previous frontend + API, without deleting buckets, local files, or database rows. Do not delete storage objects during rollback.

## Tested and changed areas

- **Upload security:** MIME and magic-byte validation, 5 MB cap, UUID generated filenames, optional durable public profile storage. Other private letter image content remains under existing authorization paths and is not published in the public bucket.
- **Notifications:** per-recipient read update, a separate Mark all read action, clearer wording for scheduled/time-capsule events, and links to related owned/public letters.
- **Discovery:** category/search/sorting, accessible counts, mobile friendly selectors.
- **Time capsule:** reject invalid/past release times, explain local timezone, with isolated schedule validation tests.
- **Tests:** backend image signature and date boundary tests added to the CI script. Existing backend association and privacy tests remain in CI.

## Follow-up production hardening (not covered by this PR)

- Migrate legacy `uploads` assets only after verifying backups and ownership.
- Design private object storage for attachments with app-authenticated authorization checks, not public links.
- Add browser end-to-end coverage of real signup/login and notifications in an isolated staging environment.
- Configure centralized incident alerts and a reviewed restore drill. Avoid live destructive testing.

## Supabase security review (read-only)

The current security advisor reports RLS enabled without Data API policies on twelve tables. Some sensitive tables (`password_reset_tokens`, `user_blocks`) still have SQL grants to the `anon` and `authenticated` roles. RLS with no permissive policy currently denies direct row access, but grants should be reviewed and reduced via a separately approved migration. **Do not disable RLS to make a table accessible.** This PR intentionally does not change production grants or read any private table contents.

Advisor guidance: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Performance advisor flags unused indexes; preserve them until representative production traffic and query plans are reviewed rather than deleting them on an early-life database.
