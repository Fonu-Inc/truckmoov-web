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
  ui/            Shared React UI primitives and utility helpers.

docs/
  api.md         API package conventions and service patterns.
```

The workspace is declared in `pnpm-workspace.yaml` with `apps/*` and `packages/*`.

## Apps

- `apps/landing-page` - Vite React public landing page. Runs on `http://localhost:3000`.
- `apps/main` - Vite React tenant app for Truckmoov product workflows. Runs on `http://localhost:3001`.
- `apps/admin` - Vite React admin/platform app for operational and platform management workflows. Runs on `http://localhost:3002`.

## Packages

- `@truckmoov/api` (`packages/api`) - Owns backend communication for the apps. It exports token helpers, the configured Axios instance, the shared React Query client, and service modules such as `@truckmoov/api/auth`.
- `@truckmoov/app-core` (`packages/app-core`) - Shared app-level foundations, starting with the exported base TypeScript config and a home for runtime code that should converge across apps.
- `@truckmoov/ui` (`packages/ui`) - Shared React components and UI utilities. Apps import shared primitives from paths such as `@truckmoov/ui/components/*` and `@truckmoov/ui/lib/*`.

## Documentation

- [docs/api.md](docs/api.md) documents the API package structure, import paths, service file conventions, React Query patterns, and how to add a new API service.
- [docs/git-workflow.md](docs/git-workflow.md) documents the Husky commit hooks and conventional commit message format.
- [docs/tsconfig.md](docs/tsconfig.md) documents the shared TypeScript base config and app/package override conventions.

When adding backend calls, put the service in `packages/api` and import it from the app through `@truckmoov/api`. Apps should not call backend endpoints directly.

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
```
