# SendTheLetter — Architecture Handbook

This handbook documents the repository as inspected on 2026-11-01. It separates **implemented behavior** from **proposed work** so diagrams do not imply that an integration exists when it does not.

## Current system at a glance

- **Web client:** React 18, TypeScript, Vite, React Router, Zustand, Axios, Socket.IO client, Leaflet.
- **Application server:** Node.js, Express, TypeScript, Socket.IO.
- **Persistence:** Sequelize configured for PostgreSQL through `DATABASE_URL`. The server package also contains MySQL driver dependencies, but the active Sequelize configuration is PostgreSQL.
- **Authentication:** JWT bearer tokens and bcrypt password hashing in the User model hooks.
- **Current API groups:** auth, letters, notifications, users/follows, messages, friends.
- **Realtime:** Socket.IO user and letter rooms. The current room-join events need server-side authentication and authorization hardening.
- **Uploads:** local Express static `/uploads` directory using Multer; this is not durable object storage in a multi-instance production deployment.

## Read these documents

1. [System context](./system-context.md)
2. [System architecture](./system-architecture.md)
3. [Data flow](./data-flow.md)
4. [Sequence diagrams](./sequence-diagrams.md)
5. [Database model](./database-erd.md)
6. [Deployment view](./deployment.md)
7. [Security and gaps](../security/current-state-and-gaps.md)
8. [Integration plan](../integrations/sharing-and-email.md)

## Important current-state limitations

- Scheduled/time-capsule fields and read endpoints exist, but the inspected server has no background worker that releases due letters. Scheduled delivery is therefore **not verified as operational**.
- There is no email provider integration in the inspected server.
- The current ShareModal sends an in-app message to an existing friend. It does not yet integrate Facebook, Messenger, or Instagram APIs.
- There is no public, token-protected letter-share route in the inspected route list. Private letter sharing must not be implemented by exposing a guessable record ID.
- Provider credentials, sender-domain verification, Meta app configuration, and production deployment credentials must be supplied by the project owner.
