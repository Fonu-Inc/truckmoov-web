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
│   ├── token.ts          — TOKEN_KEY constant, getToken / setToken / clearToken
│   ├── axios-instance.ts — configured axios instance with JWT request interceptor
│   └── query-client.ts   — shared QueryClient singleton
└── [service-name]/
    ├── types.ts
    ├── requests.ts
    └── index.ts
```

## Available import paths

```ts
import { getToken, setToken, clearToken } from "@truckmoov/api/lib/token"
import { axiosInstance }                  from "@truckmoov/api/lib/axios-instance"
import { queryClient }                    from "@truckmoov/api/lib/query-client"
import { ... }                            from "@truckmoov/api/auth"
```

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

All API responses share the envelope shape `{ status, message, data }`. Use the `ServerResponse<T>` generic from `@truckmoov/api/lib/types` to define response envelope types:

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
  })
}
```

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
3. Add a TypeScript path in `tsconfig.app.json` for each consuming app:
   ```json
   "@truckmoov/api/[service-name]": ["../../packages/api/src/[service-name]/index.ts"]
   ```
