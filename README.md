# truckmoov-web

Truckmoov is now organized as a pnpm/Turborepo monorepo.

## Apps

- `apps/landing-page` - public landing page built with Next.js.
- `apps/main` - the existing Vite React app that previously lived at the repo root.

## Requirements

- Node.js
- pnpm

The repo is pinned to `pnpm@10.15.0` in `package.json`.

## Install

```sh
pnpm install
```

## Develop

```sh
# Run every app with a dev script
pnpm dev

# Run a single app
pnpm dev:landing
pnpm dev:main
```

Default local ports:

- Landing: `http://localhost:3000`
- Main: `http://localhost:3001`

## Build

```sh
pnpm build
```
