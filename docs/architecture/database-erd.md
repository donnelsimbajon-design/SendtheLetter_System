# Database / ER Model

This ER view is based on Sequelize models currently present in `Note_letter/server/src/models`. It is a logical summary; confirm exact deployed constraints and indexes against the live database before migrations.

```mermaid
erDiagram
  USERS ||--o{ LETTERS : writes
  USERS ||--o{ MESSAGES : sends
  USERS ||--o{ MESSAGES : receives
  USERS ||--o{ NOTIFICATIONS : receives
  USERS ||--o{ NOTIFICATIONS : triggers
  USERS ||--o{ FRIENDS : requests
  USERS ||--o{ FRIENDS : receives
  USERS ||--o{ FOLLOWS : follows
  USERS ||--o{ FOLLOWS : followed_by
  LETTERS ||--o{ COMMENTS : has
  LETTERS ||--o{ LIKES : receives
  USERS ||--o{ COMMENTS : writes
  USERS ||--o{ LIKES : creates
  USERS ||--o{ REPOSTS : creates
  LETTERS ||--o{ REPOSTS : reposted

  USERS {
    int id PK
    string username
    string email
    string password_hash
    string bio
    string avatar
    string coverImage
    string location
  }
  LETTERS {
    int id PK
    int userId FK
    string title
    text content
    string type
    boolean isPublic
    string status
    datetime scheduledDate
    datetime openDate
    boolean isTimeCapsule
    boolean isArchived
  }
  MESSAGES {
    int id PK
    int senderId FK
    int receiverId FK
    text content
    boolean isRead
  }
  NOTIFICATIONS {
    int id PK
    int userId FK
    int actorId FK
    string type
    int entityId
    boolean isRead
  }
  FRIENDS {
    int id PK
    int requesterId FK
    int recipientId FK
    string status
  }
  FOLLOWS {
    int id PK
    int followerId FK
    int followingId FK
  }
  COMMENTS {
    int id PK
    int letterId FK
    int userId FK
    text content
  }
  LIKES {
    int id PK
    int letterId FK
    int userId FK
  }
  REPOSTS {
    int id PK
    int letterId FK
    int userId FK
  }
```

## Current gaps relative to planned features

- No recipient user ID or verified recipient email field is present in the Letter model inspected.
- No share-token model, delivery-attempt table, or durable job/outbox model was found.
- Existing Notification `entityId` is polymorphic in practice and is not a declared foreign key to every entity type.
- Scheduled fields exist, but the worker that acts on them is absent.
- Confirm Comment, Like, Follow, and Repost constraints/indexes from their model files and live schema before making ER guarantees.
