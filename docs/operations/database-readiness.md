# Database-aware API readiness

SendTheLetter keeps two different unauthenticated probes:

- `GET /api/health` is a fast **liveness** response. It means Express is serving requests, **not** that PostgreSQL is healthy.
- `GET /api/ready` is a bounded **readiness** probe. It calls Sequelize's `authenticate()` against the configured PostgreSQL database. Successful response: HTTP 200 `{"status":"ok"}`. Failed/slow response: HTTP 503 `{"status":"unavailable"}`, plus `Retry-After: 5`. Both responses include `Cache-Control: no-store`.

Readiness is cached for 5 seconds, takes at most 2.5 seconds before returning 503, and shares one pending check across concurrent clients. A timed-out database driver operation may still finish later; caching reduces but does not completely eliminate the resource impact of repeated checks. The endpoint intentionally returns no usernames, connection details, error messages, credentials, or private content.

## Safe rollout

1. Merge the reviewed backend PR only after CI passes. `/api/health` remains unchanged.
2. Confirm the **sendtheletter-api** Render service deploys the new commit and is Live. Its auto-deploy history has not consistently tracked recent main merges. Check the exact backend revision before assuming the endpoint is available.
3. Request `/api/ready` anonymously. Verify HTTP 200 with only `{"status":"ok"}`. Do **not** interpret HTTP 503 as permission to expose DB error text.
4. In GitHub Actions, manually trigger **Production availability smoke checks** and enable the `verify_database_readiness` input to test this endpoint. Ordinary PR/push/scheduled checks skip the new endpoint until the deployed backend is upgraded.
5. Only after verifying readiness and rollback behavior, consider setting the Render health check path to `/api/ready`. If the database experiences a temporary outage, this can cause instance replacement/restarts; evaluate against Render's health-check and instance behavior before enabling. This PR does **not** change Render settings.

Do not configure TLS verification as part of this feature. The separate `DB_SSL_CA_PEM` and `DB_SSL_STRICT` database TLS hardening must have a trusted CA, staging checks, and a deployment rollback plan before production enforcement.

## Tests

`npm run build && npm run test:quality` in `Note_letter/server` covers success, unavailable DB, timeout, cache expiration, and simultaneous probes. The test suite uses injected functions, so it does not connect to production or read user data.
