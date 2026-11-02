# SendTheLetter — production verification and release gate

Last reviewed: 2026-11-03 (Asia/Manila).

## Verified with read-only checks

- Live API health, public Community feed, and public writer profile API.
- Anonymous GET requests to `/api/letters/mine`, `/drafts`, `/scheduled`, and `/archived` must return 401.
- Community must only return `isPublic: true`, `status: published`, non-archived, released letters; no private address/account fields.
- A named author's profile and published letters should load without exposing email or password metadata.
- The `production-smoke.yml` workflow runs daily and can be manually started from GitHub Actions. It uses only GET requests and does not create accounts, letters, uploads, or storage objects.
- Backend unit tests verify the new image width/position JSONB fields and the legacy layout compatibility.

## Outstanding: Render static site direct navigation

**Reproduced:** `GET https://sendtheletter-web-phzx.onrender.com/dashboard/community` returned HTTP 404 while `/` was 200. It means opening/refreshing client-side routes can fail even though navigating from inside the React app works.

The Vite `public/_redirects` file is not an effective substitute for Render's own routing rules.

To fix the **existing** `sendtheletter-web` static site (do not create a second site):

1. Open [Render static site settings](https://dashboard.render.com/static/srv-dbjmh9h42hec73dfl8f0).
2. Go to **Redirects/Rewrites** under the site's settings.
3. Add a rule: **Source** `/*`, **Destination** `/index.html`, **Action** `Rewrite` (not Redirect).
4. Save the change. Do not rewrite real static assets in the build; Render prioritizes existing resources.
5. Verify direct URLs `/dashboard/community`, `/dashboard/notes`, and `/writers/some-username` return the React HTML shell. Authentication still controls protected routes inside the SPA and at the API.
6. Run the smoke workflow again. To enforce deep-link checks as a hard launch gate, set `STRICT_DEEP_LINKS=true` in the workflow's Node step, then rerun it.

**Note:** The connected Render tool currently exposes service reads, deploys, logs, and environment variables but not static-site redirect/rewrite mutations. Adding a `render.yaml` to a manually created site does *not* automatically apply Blueprint rules without a Blueprint association/sync.

## Still requires authenticated user/browser QA

The current connected tools do not expose a real logged-in browser session for this account. Test using a dedicated test user; do not use real personal letters as test data:

1. Sign in, reload `/dashboard/community` and `/dashboard/notes`; verify nav state and separation.
2. Click an author's avatar/name from a public letter and confirm that person's profile opens.
3. Create a **private draft** with a sample photo; drag, resize, set above/below text, save, reopen, and verify layout survives.
4. Confirm private drafts/scheduled letters never appear in Community. Archive and restore only test letters.
5. Test image upload persistence by opening a test profile image after a backend redeploy; presence of Supabase credentials in startup logs does not prove uploads succeeded.
6. Check mobile viewport and keyboard accessibility.

## Data protection

Do not modify real letters, ownership, schedule dates, user accounts, or production RLS/Storage objects while running these checks.
