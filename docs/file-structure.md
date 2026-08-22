# File Structure

Feature-based architecture. Applies to `apps/main`, `apps/admin`, and `apps/landing-page`.

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

## Import rules

- A feature imports from `shared/` and from `packages/*`.
- A feature does **not** import from another feature's internals. If two features need the
  same thing, move it to `shared/`.
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

## Create only what you need

Do not scaffold empty category folders. A feature that is one component is just
`features/[name]/components/ui/Thing.tsx`. Add `hooks/` the day there is a hook.

## Tests

Colocated next to their subject: `NotificationPreferencesPanel.tsx` sits beside
`NotificationPreferencesPanel.test.tsx`.

## Where does this file go?

| File | Location |
| --- | --- |
| A route screen | `features/[feature]/components/pages/` |
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
