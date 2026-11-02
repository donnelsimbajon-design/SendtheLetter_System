# Production TLS certificate rollout (Supabase + Render)

Supabase's recommended `verify-full` verifies both the issuing CA and the hostname. The current production API historically used `rejectUnauthorized: false`; simply changing that flag without installing the trusted root certificate can cause an outage.

1. From the **correct** Supabase project, open Database Settings → SSL Configuration → Download Certificate. Check that the certificate belongs to the actual pooler/direct database endpoint configured in `DATABASE_URL`.
2. Add the PEM text to the Render API service as the secret `DB_SSL_CA_PEM`. This supports actual PEM line breaks or literal `\\n` sequences. Do **not** commit secrets or trust arbitrary certificates returned by an unauthenticated endpoint.
3. With the same certificate and database endpoint, validate TLS connections from a staging environment. Confirm the hostname and CA chain and that HTTPS endpoints work.
4. Set `DB_SSL_STRICT=true` only after staging passes. The application then refuses startup without the CA PEM rather than silently disabling verification.
5. Check Render startup logs, authenticated API requests, and database readiness. Keep a rollback plan for certificate rotation.

**Status:** This code enables verified TLS only when `DB_SSL_CA_PEM` is configured. Without it, it retains the prior TLS-only behavior and logs a warning. Do not mark the certificate finding fixed until the hosted service has the PEM secret, strict mode enabled, and a successful connection confirmed.

References: https://supabase.com/docs/guides/platform/ssl-enforcement and https://supabase.com/docs/guides/database/connecting-to-postgres.
