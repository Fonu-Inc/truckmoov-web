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
│   ├── auth-store.ts          — zustand session store (accessToken, refreshToken, user, setSession, logout)
│   ├── axios-instance.ts      — axios instance with token injection and 401-refresh interceptors
│   ├── http-errors.ts         — shared isServerErrorResponse + normalizeError helpers
│   ├── onboarding-instance.ts — axios instance for the public onboarding-applications flow (X-Application-Token)
│   └── query-client.ts        — shared QueryClient singleton
└── [service-name]/
    ├── types.ts
    ├── requests.ts
    └── index.ts
```

## Available import paths

```ts
import { useAuthStore }                   from "@truckmoov/api/lib/auth-store"
import { axiosInstance }                  from "@truckmoov/api/lib/axios-instance"
import { onboardingInstance,
         setOnboardingToken,
         getOnboardingToken }             from "@truckmoov/api/lib/onboarding-instance"
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
  …) and the platform-admin group (`/auth/system/...`) keep it — the rest sit
  at the root: `/profile`, `/organization`, `/onboarding`, `/sims`, `/data-bundles`. Every fleet route remains under
  `/fleet`, including `/fleet/vehicles`, `/fleet/devices`, `/fleet/drivers`,
  and `/fleet/webhooks/health`.
  `dispatch`, `notification` and `tracking` still prefix everything. Keep
  each service's routes in its own `src/[service]/` folder regardless, and do
  not re-add a prefix the document does not show.

Endpoints deliberately left out of this package, because a browser client is not
the caller: liveness/readiness probes (`/health`, `/ready`, `/metrics`,
`/test-sentry`), device-side telemetry ingest (`/tracking/ingest*`), provider
webhooks (Paystack, Meta/WhatsApp), the SSE bridge
(`/onboarding/payment/events` — not an Axios call), and pure aliases of routes already covered (`GET /fuel/transactions`,
`PUT /dispatch/jobs/{jobId}`).

Deliberate simplifications and fields kept despite being absent from the current
spec are marked with a `ponytail:` comment naming what to do about them.

## Realtime socket

`packages/api/src/lib/realtime-socket.ts` (`@truckmoov/api/lib/realtime-socket`) owns the one
socket.io connection to the realtime gateway (`/realtime/socket.io` on the
`VITE_BACKEND_URL` origin). It is server-to-client only: the room comes from the token's
verified claim, so there is nothing to join or emit.

- **Auth** goes in the handshake `auth: { token }` frame, never the query string (query strings
  land in proxy logs). It is a callback, so each (re)connect sends the current token.
- **Shared and reference-counted.** `acquireRealtimeSocket()` opens it on first use and returns
  `{ socket, release }`; the last `release()` removes every listener, disconnects and drops the
  auth-store subscription. Never call `io()` anywhere else.
- **Token changes** reconnect with the new token; **logout** disconnects.
- **`refused`** (`origin_not_allowed` | `capacity_reached` | `unauthenticated`) is followed by a
  server disconnect, which socket.io does not retry. On `unauthenticated` the module makes one
  authed request so the axios 401 → `/auth/refresh` flow runs; the new token reconnects.

In components use the app hooks (`apps/main/src/features/map/hooks/useRealtime.ts`):
`useRealtimeEvent(event, handler)` — one listener per mount, removed with `socket.off` and a
`release()` on unmount — and `useRealtimeStatus()` for the indicator. In dev,
`window.__realtimeDebug(event)` reports `{ refCount, connected, listeners }` for checking cleanup.

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

### Tenant support tickets

Tenant-facing support uses the auth service through `@truckmoov/api/auth`:

- `getSupportTicketsQueryOptions({ params })` calls `GET /auth/support-tickets`; `search`, `status`, `category`, and `priority` are server-side filters. The response data is `{ tickets, countsByStatus, total }`.
- `getSupportTicketQueryOptions(id)` calls `GET /auth/support-tickets/{id}` when the ticket detail dialog opens. The response data is `{ ticket, messages, attachments }`.
- `useCreateSupportTicket()` calls `POST /auth/support-tickets`.
- `useAttachSupportTicketFiles()` posts one or more files to `POST /auth/support-tickets/{id}/attachments` as multipart fields named `files`.

The attachment endpoint accepts images, PDF, DOC/DOCX, TXT, CSV, XLS/XLSX up to 10 MB per file. Create the ticket first, then use the returned ticket id for its attachments.

### Installer settings

The installer Settings page (TRU-FE-21) uses `@truckmoov/api/auth` hooks for
`/auth/installer/profile`, `/profile/photo`, `/password` and `/preferences/{display,notifications,work}`.
Every PATCH answers with the whole record, which is written straight into the query cache.

- `useChangeInstallerPassword()` calls `setSession` on success: the server ends every earlier
  session (the old refresh token stops working) and returns a new token pair.
- `useUpdateInstallerDisplayPreferences()` updates the `installerDisplayPreferences` cache that
  every installer page reads its time zone from.
- Two-factor (`/auth/two-factor*`) is shared with the tenant app: `enrol` returns the secret and
  otpauth URI once, `enrol/confirm` returns the recovery codes once.

### Installer notifications & support (TRU-FE-22)

- `useInstallerNotifications(limit?)` — `GET /auth/installer/notifications`, newest first with
  `unreadCount`. The header bell (`limit=5`), the dashboard preview (`limit=3`) and `/notifications`
  share the `installerNotifications` prefix key, so `useMarkInstallerNotificationRead()` and
  `useMarkAllInstallerNotificationsRead()` refresh all three.
- `useCreateInstallerSupportTicket()` — `POST /auth/installer/support/tickets`. `category` is the
  same enum as `INSTALLER_ISSUE_TYPES`; `issueCode` is required when the category has chips
  (from `GET /auth/installer/options`); `callbackPhone` is required.
- `useInstallerSupportTickets(query?)` / `useInstallerSupportTicket(id)` — list with counts, and the
  read-only detail with its related job and attachments. `getInstallerSupportTicketAttachmentLink()`
  is a plain request: the link is short-lived, so fetch it on click.
- Every ticket status change arrives as a notification.

Swagger documents no response bodies for these routes; the ticket shapes in `types.ts` are marked
`ponytail:` until confirmed against dev.

### Two-factor sign-in (TRU-FE-23)

Every portal's password step (`useLogin`, `useSystemLogin`, `useInstallerLogin`) answers with a
session **or** a challenge; check with `isTwoFactorChallenge(res.data)`. The hooks store a session
only, never a challenge. The code goes to the same portal's two-factor route (`useLoginTwoFactor`,
`useSystemLoginTwoFactor`, `useInstallerLoginTwoFactor`), which stores the session.

- A challenge lasts five minutes and works once, on the portal that issued it. 401 "This sign-in
  has expired; start again" means back to the password step; 401 "That code is not valid" means retry.
- After three wrong codes the account's code checks answer **429 with `retryAfterSeconds`**, even
  for a correct code — count down, then retry with the same challenge. The per-IP limit is also a
  429 but has **no** `retryAfterSeconds`; that field is how the two differ (`cooldownSeconds()`).
- Admin only: when the platform requires two-factor, an admin without it gets `step: "enrolment"`
  with `enrolment { secret, otpauthUri }`; the first code goes to `/auth/system/login/two-factor`,
  which also returns `recoveryCodes`.

The UI is shared from `packages/reusables/src/components/auth/`: `TwoFactorCodeForm` (sign-in code
step, with the cooldown countdown), `TwoFactorSetupCard` (settings: QR via `qrcode.react`, recovery
codes gated behind copy or download) and `TwoFactorEnrolmentStep` (admin first enrolment). Each app
passes its own portal's mutation as `verify`. `packages/reusables` pins `react`/`react-dom` 18 as
devDependencies so its peers don't resolve to the landing page's React 19.

### Jobs page (`/jobs`)

`apps/main/src/features/jobs/` — behaviour verified against dev, where it differs from the spec:

- Job responses carry only `assigned_driver_id` / `assigned_vehicle_id` reliably; the
  `assigned_driver_name` / `assigned_vehicle_reg` fields are undocumented and not always sent.
  Names come from `useDrivers()` / `useVehicles()` by id.
- `POST /dispatch/jobs/{id}/assign` requires **both** `driver_id` and `vehicle_id` (400 otherwise).
  Assigning one side sends the job's current other side; an unassigned job holds the first pick
  and opens the other picker.
- Driver ranking is `GET /fleet/dispatch/recommend-drivers` (`score`, `reasons`, `distanceKm`).
  Fleet has no vehicle-recommend route, so vehicles are ranked client-side; proximity comes from
  `GET /fleet/vehicles/nearest`.
- `GET /dispatch/jobs` `weight_from` / `weight_to` are **tonnes**; `POST /dispatch/jobs`
  `cargoWeight` is tonnes too, so the page always sends `load_weight_kg`.
- `PATCH /dispatch/jobs/{id}` is not partial — it rejects a body without `pickup`.

### Fleet page (`/fleet/*`)

`apps/main/src/features/fleet/` — tabs are NavLinks (`utils/fleetNav.ts`), one route each.

- **Trips** (`/fleet/schedules`) is built from `GET /dispatch/jobs` plus `useVehicles()` /
  `useDrivers()` for names; progress follows the dispatch status (en-route 25 → delivered 100).
  `MaintenanceProfilesTab` is unmounted (the design has no Schedules tab).
- `GET /fleet/vehicles` with a `tabs` header (`useVehiclesByTab`) is no longer rendered — its
  summary payload isn't part of the design.
- Compliance "Set Reminder" is `PATCH /fleet/compliance/documents/:id/reminder` (`reminderDays`
  only); `POST /fleet/compliance/reminders/send` takes no body, so the recipient email the dialog
  collects is not sent.
- Renewing a compliance document creates a new record and supersedes the old one
  (`supersededById`) rather than updating it in place.
- Financials "Cost per KM" is total cost ÷ `kmDriven` summed over `POST /fleet/financials/profitability`.

### Drivers page (`/drivers/*`)

`apps/main/src/features/drivers/` — NavLink tabs from `utils/driversNav.ts`.

- **Drivers**: performance comes from the server (`performanceScore ?? behaviorScore`); `null`
  renders "Unscored" — nothing is derived client-side. Suspend/reinstate use the dedicated
  `POST /fleet/drivers/:id/suspend|reinstate` routes, not a status PATCH.
- **Behaviour**: `/fleet/drivers/behavior/{summary,ranking,events,geofence-alerts}`. The spec has
  no response bodies for these; `types.ts` follows the dev payloads. Geofence alerts carry ids only
  — zone names come from `/fleet/geofences`, plates from `/fleet/vehicles`.
- **Fatigue AI**: there is no list route — the page reads `/fleet/drivers/fatigue/summary`, then
  `GET /fleet/drivers/:id/fatigue` per driver (`useQueries`). When the deployment has fatigue
  switched off every fatigue route answers **503 `FeatureDisabled`**; the page shows a
  "not enabled" state and skips the per-driver calls.

### Login / logout mutations

`useLogin` and `useSystemLogin` call `setSession` automatically on success. `useLogout` calls `logout()` automatically on success. Components do not need to manage the store directly for these flows.

## Public onboarding-applications flow

> **No consumer today.** The `/apply` page in `apps/main` used to drive this
> flow, but the endpoints are not available yet, so it was reduced to a UI-only
> walkthrough — it advances on local state and makes no network calls. The
> package code below is kept and still typed against the spec; re-wire `/apply`
> to it (see `ApplyForAccount.tsx`, and `useApplyApplication.ts` in git history)
> once the endpoints land.

The tenant-onboarding landing page uses a separate axios instance, `onboardingInstance`, defined in `packages/api/src/lib/onboarding-instance.ts`. It has its own auth model and does not read the auth store:

- No JWT. `POST /auth/onboarding/applications` returns an `applicationToken` once. Every subsequent call carries it as `X-Application-Token`.
- `useCreateOnboardingApplication()` persists the token via `setOnboardingToken` on success.
- The token is kept in memory and mirrored to `sessionStorage` under the key `truckmoov_onboarding_token` — per tab, never in a URL or cookie. If it is lost, the application cannot be resumed.
- A wrong or missing token returns **404 deliberately** — do not treat it as "not found" in the UI. The `admin request-changes` flow re-issues a fresh token by email; the app's resume route should call `setOnboardingToken` with the token from the query string.
- The onboarding-applications endpoints are the only ones that go through `onboardingInstance`. Everything else (including admin review at `/auth/system/onboarding/applications/*`) still goes through `axiosInstance` with a bearer.

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

Failed API calls are normalized by `axiosInstance` and `onboardingInstance` to the shared `ServerErrorResponse` shape:

```ts
export type ServerErrorResponse = {
  error: string
  message: string
  statusCode: number
  field?: string             // set on 400s that come with a per-field validation message
  retryAfterSeconds?: number // set on 429 cooldown responses
}
```

`query-client.ts` registers `ServerErrorResponse` as React Query's default error type. Mutation `onError` callbacks can use `error.message` directly for toasts without casting to `Error` or reading Axios internals. Forms can bind `error.field` via `react-hook-form`'s `setError`.

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
