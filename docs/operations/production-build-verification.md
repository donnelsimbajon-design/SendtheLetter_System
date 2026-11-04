# Production build verification

SendTheLetter's Render static site automatically builds `Note_letter` from the configured `main` branch. A merged pull request is **not proof that the new code is live**: compare the Git revision recorded by Render with the GitHub branch.

## Automated verification

The Vite build emits `/build-version.json` with one public value:

```json
{"commit": "40-character-git-commit-sha"}
```

The source is Render's documented build-time `RENDER_GIT_COMMIT` (falling back to GitHub Actions' `GITHUB_SHA`). A local build with neither variable produces `{"commit":null}`. No secret values, tokens, environment configuration, usernames, or letter content are written to this file.

The GitHub **Frontend quality checks** job verifies the build artifact's SHA against the job's own `GITHUB_SHA`. The daily and manually triggered **Production availability smoke checks** workflow compares the live `/build-version.json` against the current `main` SHA. Pull-request and ordinary push smoke checks do **not** compare SHAs, because Render might still be processing that push. All runs also verify API privacy responses and direct SPA routes, including `/try`.

## If production is stale

1. Open the Render **sendtheletter-web** service's Deploys tab and compare the latest **Live** deployment commit to GitHub `main`.
2. Check if a deploy is already building/queued. Avoid duplicate deploys.
3. Verify the site is connected to the correct GitHub repository/branch and Render auto-deploy/webhook access is functioning. Auto-deploy being set to "yes" is not evidence a new deploy has started.
4. When automatic deployment did not trigger, deploy the latest `main` revision from Render and verify its status becomes **Live**.
5. Run the **Production availability smoke checks** GitHub Actions workflow on `main`. Open `/try` and manually complete a guest-writing → signup → import → save/reopen test in a safe test account.

The build marker verifies code freshness, **not** real-browser usability, auth correctness, Supabase integration, or safe migration state. It is not a substitute for real-account acceptance tests.
