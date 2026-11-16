# truckmoov-web

Truckmoov web is organized as a pnpm/Turborepo monorepo. It contains the public landing experience, the tenant-facing app, the admin/platform app, and shared workspace packages used across the apps.

## Workspace

```text
apps/
  landing-page/  Public marketing and entry-point site.
  main/          Tenant-facing Truckmoov application.
  admin/         Admin and platform operations application.

packages/
  api/           Shared backend API layer and React Query integration.
  app-core/      Shared app foundations and cross-app configuration.
  reusables/     Shared React UI components, utilities, and base styles for main and admin.

docs/
  design.md            App design system, layout, navigation, and page patterns.
  time-utils.md        The single place all date/time handling lives.
  commit-messages.md   How to write and make a commit in this repo.
  api.md               API package conventions and service patterns.
```

The workspace is declared in `pnpm-workspace.yaml` with `apps/*` and `packages/*`.

## Apps

- `apps/landing-page` - Vite React public landing page. Runs on `http://localhost:3000`.
- `apps/main` - Vite React tenant app for Truckmoov product workflows. Runs on `http://localhost:3001`.
- `apps/admin` - Vite React admin/platform app for operational and platform management workflows. Runs on `http://localhost:3002`.
- `apps/installer` - Vite React installer portal. Runs on `http://localhost:3003`.

## Packages

- `@truckmoov/api` (`packages/api`) - Owns backend communication for the apps. It exports token helpers, the configured Axios instance, the shared React Query client, and service modules such as `@truckmoov/api/auth`.
- `@truckmoov/app-core` (`packages/app-core`) - Shared app-level foundations, starting with the exported base TypeScript config and a home for runtime code that should converge across apps.
- `@truckmoov/reusables` (`packages/reusables`) - Shared React components, UI utilities, and base styles used by the main and admin apps. Shadcn primitives live under `src/components/shadcn/`. Apps resolve them via `@/components/shadcn/*` and `@/lib/utils`. The shared base stylesheet is imported as `@truckmoov/reusables/index.css`.

## Documentation

- [docs/design.md](docs/design.md) documents the design tokens and theme, the dashboard layout shell, role-based navigation, and the standard page/table patterns. Read it first for any UI work.
- [docs/time-utils.md](docs/time-utils.md) documents `packages/app-core/src/utils/time-utils.ts`, the only place date, time and duration handling belongs. Read it before writing any date logic.
- [docs/api.md](docs/api.md) documents the API package structure, import paths, service file conventions, React Query patterns, and how to add a new API service.
- [docs/git-workflow.md](docs/git-workflow.md) documents the Husky pre-commit hook and conventional commit message format.
- [docs/commit-messages.md](docs/commit-messages.md) documents how to write and make a commit here — scopes, body structure, and the deploy consequences of a push.
- [docs/tsconfig.md](docs/tsconfig.md) documents the shared TypeScript base config and app/package override conventions.
- [docs/browser-tests.md](docs/browser-tests.md) documents the Grafana k6 browser, payment and load tests in `tests/k6/` — install k6, start an app, then run `pnpm test:k6:main` (or `admin`, `installer`, `landing`, `writes`, `payments`, `cleanup`, `load`).

When adding backend calls, put the service in `packages/api` and import it from the app through `@truckmoov/api`. Apps should not call backend endpoints directly.

When adding shared UI components or styles, add them to `packages/reusables`. Shadcn components go in `src/components/shadcn/` and are imported via `@/components/shadcn/*` in the apps.

## Requirements

- Node.js
- pnpm

The repo is pinned to `pnpm@10.15.0` in `package.json`.

## Install

```sh
pnpm install
```

## Develop

Run every app with a dev script:

```sh
pnpm dev
```

Run a single app:

```sh
pnpm dev:landing
pnpm dev:main
pnpm dev:admin
```

Default local ports:

- Landing page: `http://localhost:3000`
- Main app: `http://localhost:3001`
- Admin app: `http://localhost:3002`

## Build

```sh
pnpm build
```

## Lint

```sh
pnpm lint
pnpm lint:fix
```

All three apps share one config, exported from `app-core`. See
[docs/lint.md](docs/lint.md).
