# Administrator access

The original application had no administrator role, protected admin API, or admin dashboard. This change adds those pieces.

## Promote the first administrator

1. Deploy the updated server. The existing Sequelize schema sync adds the users.role and users.isActive columns.
2. Have the intended administrator create a normal account through public sign-up.
3. Verify the person's account through a trusted, separate channel. This application does not currently provide email verification, so do not rely on an email address alone. Obtain the numeric user ID from the trusted account record.
4. Ensure the server has been built (the normal production build creates the compiled command under dist), then on a trusted server or deployment shell with the production database environment configured, run:

   ```bash
   cd Note_letter/server
   npm run admin:promote -- 123
   ```

5. Review the displayed account ID, username, and email. Type PROMOTE to confirm.
6. The account holder must sign out and sign back in, then visit /admin.

Never add a role field to public registration, expose database credentials to the browser, or run the promotion command from an untrusted machine. The promotion command changes only the existing account selected by numeric ID.

## Admin capabilities

- View aggregate account and letter counts.
- Search and inspect account metadata and letter metadata.
- Promote/demote users and suspend/reactivate accounts.
- Remove a letter from public view without permanently deleting the author's content.

All admin API routes verify the signed-in account's current database role on every request. A role shown in the frontend is only for navigation and is not an authorization boundary. Suspending an account blocks subsequent API requests and disconnects its active Socket.IO sessions.

## Required server configuration

- DATABASE_URL: PostgreSQL connection URL.
- JWT_SECRET: a random secret of at least 32 characters.
- CLIENT_URL or FRONTEND_URL: the deployed frontend origin. Local development also allows http://localhost:5173.

Existing JWTs expire after 24 hours. Changing JWT_SECRET invalidates existing sessions; sign in again after rotation. Login/registration rate limiting is process-local; use a shared gateway or Redis-backed limiter when running multiple server instances.