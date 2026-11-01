# SendTheLetter

A digital letter-writing and connection experience built with React, TypeScript, Vite, Tailwind CSS, Zustand, and Socket.IO.

## Frontend setup

```bash
cd Note_letter
npm ci
npm run dev
```

Create a `.env` file in `Note_letter` when connecting to a deployed API:

```env
VITE_API_URL=https://your-api-host.example
```

The frontend falls back to `http://localhost:5000` for local backend development.

## Production build

```bash
cd Note_letter
npm run build
npm run preview
```

## Design system

The refreshed interface uses the Warm Editorial palette by default:

| Token | Hex |
| --- | --- |
| Warm Ivory | `#F6F1E9` |
| Forest Green | `#263B35` |
| Terracotta | `#C87965` |
| Soft Gold | `#D8B879` |
| Sage Green | `#A9B9A6` |
| Charcoal | `#343638` |

The dashboard includes Warm Editorial, Cool Blue, and Forest Dark appearance choices. The selected theme is stored locally in the browser.

## Product scope notes

The frontend should only advertise capabilities that are implemented and backed by the API. Future-delivery/time-capsule workflows, attachments, and advanced privacy guarantees require explicit backend support and should not be presented as completed features until those integrations are verified.

## Quality checks

GitHub Actions runs the frontend TypeScript project build and Vite production build for pull requests and relevant branch pushes. The lockfile includes semver-compatible dependency security updates; CI runs a full npm dependency audit.


## System architecture and integrations

The architecture handbook and implementation boundaries are documented in [docs/architecture](docs/architecture/README.md). It includes the system context, logical architecture, data flows, sequence diagrams, database model, deployment view, security findings, and sharing/email integration contract.

The current implementation supports in-app friend sharing and a public-letter URL flow for published public letters. Email-provider delivery, scheduled delivery worker, private share tokens, and direct Meta API publishing/messaging still require additional implementation and owner-supplied credentials. See [implementation status](docs/implementation-status.md) before treating these as production features.
