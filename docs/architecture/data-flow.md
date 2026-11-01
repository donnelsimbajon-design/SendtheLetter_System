# Data Flow Diagrams

## DFD Level 0 — system boundary

```mermaid
flowchart LR
  author[Author] -->|Letter details / actions| system((SendTheLetter))
  recipient[Recipient] -->|Login / read / messages| system
  visitor[Public visitor] -->|Browse public letters| system
  system -->|Pages / status / notifications| author
  system -->|Authorized letters / messages| recipient
  system -->|Public published letters| visitor
  system <--> db[(PostgreSQL)]
  system -.->|Future email delivery| email[Email provider]
  system -.->|Share URL handoff| social[Facebook / Messenger / Instagram]
```

## DFD Level 1 — create a letter

```mermaid
flowchart TD
  A[Author composes letter in React] --> B[POST /api/letters]
  B --> C[JWT authentication]
  C --> D{Authenticated?}
  D -- No --> E[401 response]
  D -- Yes --> F[Validate required fields and visibility]
  F --> G{Valid?}
  G -- No --> H[400 response]
  G -- Yes --> I[Letter controller]
  I --> J[(letters table via Sequelize)]
  J --> K[201 response with saved letter]
  K --> L[Client refreshes letter list]
```

## DFD Level 1 — current in-app message

```mermaid
flowchart TD
  A[Sender selects a friend] --> B[POST /api/messages/send]
  B --> C[JWT authentication]
  C --> D[Message controller]
  D --> E[(messages table)]
  E --> F[Load sender and receiver display data]
  F --> G[Emit new_message to receiver user room]
  G --> H[Recipient client updates conversation]
  F --> I[HTTP response to sender]
```

## DFD Level 1 — proposed external share

```mermaid
flowchart TD
  A[Author clicks Share] --> B[Check visibility and ownership]
  B --> C{Public published letter?}
  C -- Yes --> D[Create canonical public URL]
  C -- No --> E{Explicit private recipient authorization?}
  E -- No --> F[Block external link sharing]
  E -- Yes --> G[Create random expiring/revocable token]
  D --> H[Native share / Facebook share URL]
  G --> I[Recipient-specific URL]
  H --> J[External platform]
  I --> J
```

The external-share flow is a target design. A public route and secure private-token implementation must exist before enabling these actions.
