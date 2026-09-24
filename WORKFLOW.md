# Assunnah Foundation Service Portal — Workflow

How routes, middleware, and API calls work in this project.

## High-level flow

```mermaid
flowchart TD
  A[Browser request] --> B{Path type?}
  B -->|Page URL<br/>/bn/... or /en/...| C[middleware.ts]
  B -->|API URL<br/>/api/...| D[API route handler]

  C --> E[Split locale bn / en]
  E --> F[Read NextAuth session]
  F --> G{Auth guard}
  G -->|Guest opens /dashboard| H[Redirect to /locale/login]
  G -->|Signed-in opens / or /login| I[Redirect to /locale/dashboard]
  G -->|Allowed| J[next-intl locale routing]
  J --> K[Render App Router page]

  D --> L[Validate + business logic]
  L --> M[Prisma / MySQL]
  M --> N["JSON { success, data } or { success: false, error }"]
```

## App routes

```mermaid
flowchart LR
  subgraph Guest["(guest) — public"]
    R1["/[locale]"] --> R2["/[locale]/login"]
    R1 --> R3["/[locale]/forgot-password"]
  end

  subgraph Portal["(portal) — signed in"]
    R4["/[locale]/dashboard"]
    R4b["/[locale]/dashboard/requests/[publicId]"]
  end

  subgraph Special["Shared UI"]
    R5["error.tsx"]
    R6["loading.tsx"]
    R7["not-found.tsx"]
    R8["[...rest] → 404"]
  end

  R2 -->|successful login| R4
  R4 -->|sign out| R2
```

| URL | File | Access |
|---|---|---|
| `/[locale]` | `app/[locale]/(guest)/page.tsx` | Guest → redirects to login |
| `/[locale]/login` | `app/[locale]/(guest)/login/page.tsx` | Guest |
| `/[locale]/forgot-password` | `app/[locale]/(guest)/forgot-password/page.tsx` | Guest |
| `/[locale]/dashboard` | `app/[locale]/(portal)/dashboard/page.tsx` | Signed in |
| `/[locale]/dashboard/requests/[publicId]` | `app/[locale]/(portal)/dashboard/requests/[publicId]/page.tsx` | Signed in (role-scoped) |
| `/[locale]/*` unknown | `app/[locale]/[...rest]/page.tsx` | Any → 404 |

Locales: `bn` (default), `en`. Route groups `(guest)` and `(portal)` are not part of the URL.

## Login API call flow

```mermaid
sequenceDiagram
  participant U as Login page
  participant S as lib/services/auth.ts
  participant C as lib/api/client.ts
  participant A as POST /api/auth/login
  participant V as Yup validation
  participant Auth as authenticateUser()
  participant DB as MySQL (users + roles)
  participant NA as NextAuth signIn()
  participant D as Dashboard

  U->>S: loginRequest({ email, password }, { signal })
  S->>C: api.post("/api/auth/login", body, { signal })
  C->>A: HTTP POST + AbortSignal
  A->>A: assertMethod POST + rate limit
  A->>V: parseLoginBody()
  V-->>A: email, password
  A->>Auth: authenticateUser(email, password, signal)
  Auth->>DB: find user + role, verify bcrypt
  DB-->>Auth: user or null
  Auth-->>A: { id, name, email, role }
  A->>NA: signIn("credentials")
  NA-->>A: session cookie set
  A-->>C: { success: true, data: { user } }
  C-->>S: user data
  S-->>U: LoginResult
  U->>D: router.push("/dashboard")
```

## Login flowchart (simplified)

```mermaid
flowchart TD
  A[User submits login form] --> B[Formik client validation]
  B --> C[loginRequest via api.post]
  C --> D[POST /api/auth/login]
  D --> E{Rate limit OK?}
  E -->|No| F[429 TOO_MANY_REQUESTS]
  E -->|Yes| G{Body valid?}
  G -->|No| H[400 VALIDATION_ERROR]
  G -->|Yes| I{Email + password match DB?}
  I -->|No| J[401 INVALID_CREDENTIALS]
  I -->|Yes| K[NextAuth creates session cookie]
  K --> L[200 success + user]
  L --> M[Redirect to /locale/dashboard]

  C -.->|User leaves page or resubmits| N[AbortController cancels request]
  N --> O[Ignore REQUEST_ABORTED on client]
```

## API pattern for every future endpoint

```mermaid
flowchart LR
  P[Page / Component] --> SVC["lib/services/*.ts"]
  SVC --> API["api.get / post / put / patch / delete"]
  API --> RT["app/api/.../route.ts"]
  RT --> VAL[Validate + AbortSignal]
  VAL --> PR[Prisma]
  PR --> RES["jsonOk / handleRouteError"]
```

**Client**

```ts
import { api, useAbortableRequest } from "@/lib/api";

const abortable = useAbortableRequest();
await api.post("/api/...", body, { signal: abortable.nextSignal() });
```

**Server**

```ts
import { assertMethod, throwIfAborted, jsonOk, handleRouteError } from "@/lib/api";
```

## Auth-related APIs

| Method | Path | Role |
|---|---|---|
| `POST` | `/api/auth/login` | App login (validate, DB, session) |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth CSRF, session, callbacks |

## Data used by login today

```mermaid
erDiagram
  roles ||--o{ users : has
  users {
    int id
    string email
    string password_hash
    int role_id
  }
  roles {
    int id
    string name
  }
```

Seeded roles: `admin`, `manager`, `office`, `requester`.  
Other tables (`services`, `service_requests`, `service_activities`) are ready for portal features next.
