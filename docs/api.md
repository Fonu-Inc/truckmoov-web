# API Layer

All backend communication lives in `packages/api` (`@truckmoov/api`). Apps never call the backend directly — they import from this package.

## Environment

Apps that import from `@truckmoov/api` must define `VITE_BACKEND_URL` in their environment.

`packages/api/src/lib/axios-instance.ts` reads the value with `import.meta.env.VITE_BACKEND_URL` and uses it as the Axios `baseURL`. If the value is missing, the package throws:

```text
[truckmoov/api] VITE_BACKEND_URL is not set. Add it to your .env file.
```

Example app `.env` value:

```sh
VITE_BACKEND_URL="your value"
```

Use a local backend URL for development when needed.

## Package structure

```text
packages/api/src/
├── lib/
│   ├── auth-store.ts     — zustand session store (accessToken, refreshToken, user, setSession, logout)
│   ├── axios-instance.ts — axios instance with token injection and 401-refresh interceptors
│   └── query-client.ts   — shared QueryClient singleton
└── [service-name]/
    ├── types.ts
    ├── requests.ts
    └── index.ts
```

## Available import paths

```ts
import { useAuthStore }                   from "@truckmoov/api/lib/auth-store"
import { axiosInstance }                  from "@truckmoov/api/lib/axios-instance"
import { queryClient }                    from "@truckmoov/api/lib/query-client"
import type { ServerResponse, ServerErrorResponse } from "@truckmoov/api/lib/types"
import { ... }                            from "@truckmoov/api/auth"
import { ... }                            from "@truckmoov/api/fleet"
import { ... }                            from "@truckmoov/api/dispatch"
import { ... }                            from "@truckmoov/api/tracking"
import { ... }                            from "@truckmoov/api/notification"
import { ... }                            from "@truckmoov/api/console"
```

Both apps resolve these through two wildcard `paths` entries in
`tsconfig.app.json`, so a new service needs no per-module entry:

```json
"@truckmoov/api/lib/*": ["../../packages/api/src/lib/*.ts"],
"@truckmoov/api/*":     ["../../packages/api/src/*/index.ts"]
```

## Keeping types in sync with the server

The service types are hand-written against the published OpenAPI documents:

| Service | Swagger UI | OpenAPI JSON |
|---|---|---|
| auth | [/docs/auth](https://dev-api.truckmoov.com/docs/auth) | `/openapi/auth.json` |
| fleet | [/docs/fleet](https://dev-api.truckmoov.com/docs/fleet) | `/openapi/fleet.json` |
| dispatch | [/docs/dispatch](https://dev-api.truckmoov.com/docs/dispatch) | `/openapi/dispatch.json` |
| tracking | [/docs/tracking](https://dev-api.truckmoov.com/docs/tracking) | `/openapi/tracking.json` |
| notification | [/docs/notification](https://dev-api.truckmoov.com/docs/notification) | `/openapi/notification.json` |
| console | [/docs/console](https://dev-api.truckmoov.com/docs/console) | `/openapi/console.json` |

All served from `https://dev-api.truckmoov.com`.

Three conventions fall out of those documents:

- **Envelope.** Every service wraps responses in `ServerResponse<T>` **except
  `tracking`**, and except `POST /notify/messages/send` and
  `POST /notify/messages/retry/{id}` — those return the record unwrapped. Type
  them as bare payloads, not `ServerResponse<T>`.
- **Casing.** Several `notification` and `dispatch` bodies accept both a
  snake_case and a camelCase spelling of the same field. Only the canonical
  (documented-required) form is typed — adding both doubles every payload type
  for no gain.
- **Route groups and service prefixes.** `auth` is split into groups that are
  *not* all mounted under the service name. In `auth`
  only the `Auth` group keeps it (`/auth/login`, `/auth/me`, `/auth/invite`,
  …) — the rest sit at the root: `/profile`, `/organization`, `/system`,
  `/onboarding`, `/sims`, `/data-bundles`. Every fleet route remains under
  `/fleet`, including `/fleet/vehicles`, `/fleet/devices`, `/fleet/drivers`,
  and `/fleet/webhooks/health`.
  `dispatch`, `notification` and `tracking` still prefix everything. Keep
  each service's routes in its own `src/[service]/` folder regardless, and do
  not re-add a prefix the document does not show.

Endpoints deliberately left out of this package, because a browser client is not
the caller: liveness/readiness probes (`/health`, `/ready`, `/metrics`,
`/test-sentry`), device-side telemetry ingest (`/tracking/ingest*`), provider
webhooks (Paystack, Meta/WhatsApp), the SSE and WebSocket bridges
(`/onboarding/payment/events`, `/tracking/ws` — neither is an Axios call),
and pure aliases of routes already covered (`GET /fuel/transactions`,
`PUT /dispatch/jobs/{jobId}`).

Deliberate simplifications and fields kept despite being absent from the current
spec are marked with a `ponytail:` comment naming what to do about them.

## Auth session

The shared auth session is managed by a zustand store persisted to `localStorage` under the key `truckmoov_auth`.

```ts
import { useAuthStore } from "@truckmoov/api/lib/auth-store"

// Inside a React component
const { user, logout } = useAuthStore()

// Outside React (e.g. in mutation callbacks)
const { accessToken } = useAuthStore.getState()
```

### Store shape

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | `string \| null` | JWT access token |
| `refreshToken` | `string \| null` | Refresh token |
| `user` | `AuthUser \| null` | `{ id, email, role, tenantId }` |
| `setSession(session)` | action | Stores tokens and user after a successful login |
| `logout()` | action | Clears all session state from the store and localStorage |

### Token injection

The axios instance automatically reads `accessToken` from the store and adds `Authorization: Bearer {token}` to every outgoing request. No manual header management is needed.

### Automatic token refresh

When a request returns 401 the axios instance:
1. Calls `POST /auth/refresh` with the stored `refreshToken` (using a separate bare axios instance to avoid interceptor loops)
2. Stores the new session via `setSession`
3. Retries the original request with the new token

Concurrent 401 responses are queued and replayed once the single refresh resolves. If the refresh itself fails, `logout()` is called and all queued requests reject with `{ error: 'TOKEN_REFRESH_FAILED', statusCode: 401 }`.

### Login / logout mutations

`useLogin` and `useSystemLogin` call `setSession` automatically on success. `useLogout` calls `logout()` automatically on success. Components do not need to manage the store directly for these flows.

## Service structure

Each service owns three files under `src/[service-name]/`.

| File | Purpose |
|------|---------|
| `types.ts` | Request payload and response types |
| `requests.ts` | Plain async endpoint functions |
| `index.ts` | Query keys, query option factories, and mutation hooks |

Components import from the service barrel (`@truckmoov/api/[service]`), not from individual files.

## `types.ts`

Define request payloads and response types here. Use `type`, not `interface`.

```ts
export type ActivityLog  = {
  id: string;
  activity: string;
}

export type ActivityLogQuery = {
  params?: {
    search?: string
    status?: string
    page?: number
  }
}

export type User = {
  name: string;
}

export type UpdateInvitedUserPayload = {
  id: string
  data: {
    role: string
    email: string
  }
}

export type DeleteUserPayload = {
  id: string
}
```

### Response types

Most API responses share the envelope shape `{ status, message, data }` — see
[Keeping types in sync with the server](#keeping-types-in-sync-with-the-server)
for the services that do not. Use the `ServerResponse<T>` generic from
`@truckmoov/api/lib/types` to define response envelope types:

```ts
import type { ServerResponse } from '../lib/types'

export type ActivityLogResponse = ServerResponse<ActivityLog[]>
export type UserResponse = ServerResponse<User>
```

You can also use `ServerResponse<T>` inline directly in `requests.ts`:

```ts
axiosInstance.get<ServerResponse<ActivityLog[]>>('/auth/activity-log')
```

| Property | Use it for |
|----------|------------|
| `id` | URL identifiers, such as `/users/:id` |
| `data` | POST, PATCH, or PUT request bodies |
| `params` | Query string parameters |

### Error responses

Failed API calls are normalized by `axiosInstance` to the shared `ServerErrorResponse` shape:

```ts
export type ServerErrorResponse = {
  error: string
  message: string
  statusCode: number
}
```

`query-client.ts` registers `ServerErrorResponse` as React Query's default error type. Mutation `onError` callbacks can use `error.message` directly for toasts without casting to `Error` or reading Axios internals.

## `requests.ts`

Request functions are plain async functions. They should not use React hooks.

```ts
import { axiosInstance } from "../lib/axios-instance"

import type { ActivityLogQuery, UpdateInvitedUserPayload } from "./types"

export async function getActivityLog(payload?: ActivityLogQuery) {
  const { data } = await axiosInstance.get<ActivityLog[]>("/auth/activity-log", {
    params: payload?.params,
  })
  return data
}

export async function updateInvitedUser({ id, data: body }: UpdateInvitedUserPayload) {
  const { data } = await axiosInstance.patch<User>(`/auth/invited-users/${id}`, body)
  return data
}
```

## `index.ts`

Use `index.ts` for React Query integration.

### Query keys

Export one query key object per service.

```ts
export const AUTH_QUERY_KEY = {
  user: ["user"],
  invitedUsers: ["invitedUsers"],
  activityLog: (payload?: ActivityLogQuery) => ["activityLog", payload],
} as const
```

### Queries

Wrap query configuration in a `queryOptions()` factory.

```ts
import { queryOptions } from "@tanstack/react-query"

import { getActivityLog, getInvitedUsers } from "./requests"
import type { ActivityLogQuery } from "./types"

export function getInvitedUsersQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.invitedUsers,
    queryFn: getInvitedUsers,
  })
}

export function getActivityLogQueryOptions(payload?: ActivityLogQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.activityLog(payload),
    queryFn: () => getActivityLog(payload),
  })
}
```

In components:

```tsx
const { data } = useQuery(getInvitedUsersQueryOptions())
const { data } = useSuspenseQuery(getActivityLogQueryOptions({ params: { status: "active" } }))
```

### Mutations

Use `useMutation`. On success, invalidate the relevant query keys. Toast calls belong in the component's `onSuccess` handler — keeps the package UI-framework-agnostic.

```ts
import { useMutation } from "@tanstack/react-query"

import { queryClient } from "../lib/query-client"
import { updateInvitedUser } from "./requests"

export function useUpdateInvitedUser() {
  return useMutation({
    mutationFn: updateInvitedUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.invitedUsers })
    },
    onError: () => {
      toast.error("some error")
    }
  })
}
```

Apps should provide the shared `queryClient` from `@truckmoov/api/lib/query-client` to `QueryClientProvider` so package mutation hooks invalidate the same React Query cache the app renders from.

## Naming

| Item | Pattern | Example |
|------|---------|---------|
| Request function | verb + resource | `getInvitedUsers()` |
| Query options | request name + `QueryOptions` | `getInvitedUsersQueryOptions()` |
| Mutation hook | `use` + action | `useUpdateInvitedUser()` |
| Query keys | service + `QUERY_KEY` | `AUTH_QUERY_KEY` |

## Component imports

Import from the service barrel, not from `requests.ts` or `types.ts`:

```ts
import {
  getInvitedUsersQueryOptions,
  useUpdateInvitedUser,
} from "@truckmoov/api/auth"
```

## Forms

Pair form submission with a mutation hook:

```tsx
const mutation = useUpdateInvitedUser()

function onSubmit(data: FormValues) {
  mutation.mutate(
    { id, data },
    {
      onSuccess: () => {
        toast.success("User updated")
      },
      onError: (error) => {
        toast.error(error.message)
      },
    },
  )
}

<Button type="submit" disabled={mutation.isPending}>
  Save
</Button>
```

See [forms.md](forms.md) for the full form pattern.

## Adding a new service

1. Create `packages/api/src/[service-name]/` with `types.ts`, `requests.ts`, `index.ts`
2. Add a subpath export in `packages/api/package.json`:
   ```json
   "./[service-name]": "./src/[service-name]/index.ts"
   ```
3. Re-export the service's types from its `index.ts` so consumers get them from
   the barrel:
   ```ts
   export type * from './types'
   ```

No `tsconfig.app.json` change is needed — the `@truckmoov/api/*` wildcard path
already covers any `src/[service-name]/index.ts`.
