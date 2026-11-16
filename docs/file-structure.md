# File Structure

Feature-based architecture. Applies to `apps/main` and `apps/admin`.

`apps/landing-page` is the exception — it is a marketing site with no features to speak of,
so it uses `src/ui/{pages,components,shadcn}` plus `src/lib`, wired that way in its
`components.json`. It also keeps its **own copies** of the shadcn primitives it needs in
`src/ui/shadcn/` rather than importing `packages/reusables`, which targets React 18 +
Tailwind v3 + the split `@radix-ui/react-*` packages and cannot be consumed by a React 19 +
Tailwind v4 + unified `radix-ui` app. A multi-part component gets its own folder under
`src/ui/components/` (`get-started/` is the worked example: dialog shell, step bodies, and a
`.ts` data module — the `react-refresh/only-export-components` lint rule forbids exporting
constants from a file that also exports components).

`src/` has exactly two buckets plus entry files:

```
src/
  features/       one folder per feature
  shared/         code used across features in this app
  App.tsx
  main.tsx
  assets/
  vite-env.d.ts
```

No other top-level folders. A loose `src/components/`, `src/hooks/`, `src/pages/`,
`src/utils/`, `src/stores/`, `src/services/`, `src/contexts/`, or `src/types/` means the code
has not been placed yet — it belongs to a feature or to `shared/`.

## Features

```
features/[feature-name]/
  components/
    pages/      route-level screens
    ui/         presentational pieces for this feature
    forms/      react-hook-form + zod forms (see docs/forms.md)
    layout/     shells, sidebars, headers scoped to the feature
    providers/  React context providers
  hooks/
  stores/
  services/
  utils/
  types/
```

Feature names are kebab-case (`owner-operator`, `fleet`, `billing`).

## Shared

```
shared/
  components/
    ui/
    layout/
    providers/
  hooks/
  stores/
  services/
  utils/
  types/
  lib/
```

Same categories as a feature, minus `pages/` and `forms/` under `components/`. A page is a
route and a form is a domain contract — both belong to a feature. `shared/` holds only
feature-agnostic building blocks.

## No data folder

There is no `data/` folder in `features/` or `shared/`. Hardcoded and mock data are not part
of this architecture. Data comes from `packages/api`, reached through `services/` and
`hooks/`.

## Repo-level tests

Browser, payment and load tests are not app code, so they live outside every `src/`, in
`tests/k6/` at the repo root: one `<app>[.<kind>].test.js` per suite plus shared helpers in
`tests/k6/lib/`. See `docs/browser-tests.md`. Unit tests stay next to the file they test.

## Import rules

- A feature imports from `shared/` and from `packages/*`.
- A feature does **not** import from another feature's internals. If two features need the
  same thing, move it to `shared/`.
- `@/features/auth/stores/authStore` is the one sanctioned exception: the session store is
  read app-wide and stays with the auth feature rather than moving to `shared/`.
- `shared/` never imports from `features/`.
- shadcn primitives still come from `@/components/shadcn/*` (which resolves to
  `packages/reusables`). They are not copied into `shared/`.
- `shared/` is for code shared *within one app*. Code shared *between apps* goes to
  `packages/reusables`, `packages/app-core`, or `packages/api`.

## Aliases

`@/features/*` and `@/shared/*` work through each app's existing `@/* -> ./src/*` alias in
`tsconfig.json` and `vite.config.ts`. No config change needed. The `@/components/shadcn/*`
and `@/lib/utils` overrides stay pointed at `packages/reusables`.

```tsx
import { JobsTable } from "@/features/jobs/components/ui/JobsTable"
import { useOrgDataScope } from "@/shared/hooks/useOrgDataScope"
import { Button } from "@/components/shadcn/button"
```

## A panel that is exactly one route

A route screen normally lives in `components/pages/`. The exception: when a tab
or page is exactly one panel with no props, route that panel's named export
directly instead of writing a three-line wrapper page.

```ts
// shared/lib/route.tsx
{ path: "storage", lazy: async () => ({ Component: (await import("@/features/settings/components/ui/StoragePanel")).StoragePanel }) }
```

`features/settings` is the worked example: 15 tabs in `apps/main`, 5 in
`apps/admin`, and only the ones needing props or holding more than one panel have
a file in `components/pages/`. The route table plus that feature's
`utils/settingsNav.ts` are the index of which `ui/` components are routes.

## Create only what you need

Do not scaffold empty category folders. A feature that is one component is just
`features/[name]/components/ui/Thing.tsx`. Add `hooks/` the day there is a hook.

## Tests

Colocated next to their subject: `NotificationPreferencesPanel.tsx` sits beside
`NotificationPreferencesPanel.test.tsx`.

## Where does this file go?

| File | Location |
| --- | --- |
| A route screen | `features/[feature]/components/pages/` (unless it is [exactly one panel](#a-panel-that-is-exactly-one-route)) |
| A form for one feature | `features/[feature]/components/forms/` |
| A hook used by one feature | `features/[feature]/hooks/` |
| A hook used by two features | `shared/hooks/` |
| A button/badge/table used everywhere | `shared/components/ui/` |
| A shadcn primitive | `packages/reusables` (import via `@/components/shadcn/*`) |
| A route screen shared by **two apps** | `packages/reusables/src/components/pages/` |
| An API call | `packages/api`, wrapped by a feature `services/` or `hooks/` file |

`components/pages/` in `reusables` is the one exception to "a page belongs to a
feature": it holds route screens that are identical in every app and own no
domain logic — the 404, 403 and crash screens (see
[design.md](design.md#status-screens)). A page with any domain meaning still
belongs to a feature in its own app. Helpers those screens need go in
`packages/reusables/src/utils/`.
