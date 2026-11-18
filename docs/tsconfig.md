# TypeScript Config

Truckmoov uses a shared TypeScript base config from `packages/app-core`.

## Shared Base

The base config lives at:

```text
packages/app-core/tsconfig.base.json
```

It is exported from `@truckmoov/app-core` as:

```json
"./tsconfig.base.json": "./tsconfig.base.json"
```

Workspace packages should extend it with a relative path:

```json
{
  "extends": "../app-core/tsconfig.base.json",
  "include": ["src"]
}
```

Use the relative path for package `tsconfig.json` files because TypeScript editors can fail to resolve package exports in the `extends` field even when the build works.

## Package Configs

Shared packages should keep their `tsconfig.json` small and only add package-specific settings.

Current package usage:

- `packages/api/tsconfig.json` extends `../app-core/tsconfig.base.json`.
- `packages/reusables/tsconfig.json` extends `../app-core/tsconfig.base.json` and only adds its local `@/*` path alias.
- `packages/app-core/tsconfig.base.json` owns shared compiler defaults such as `jsx`, `moduleResolution`, `target`, `strict`, `skipLibCheck`, and `noEmit`.

## App Configs

Apps can extend the base config when their compiler settings match the shared defaults, but they may keep app-specific config when needed for tooling or framework differences.

The tenant and admin apps currently keep explicit app configs because they include app-specific path mappings and test types:

- `apps/main/tsconfig.app.json`
- `apps/admin/tsconfig.app.json`

The installer app does the same (`apps/installer/tsconfig.app.json`).

### Pinned type paths in the Vite apps

The Vite apps run React 18. The landing page runs React 19 and zod 4. pnpm shares one store,
so a library such as `react-router` or `@hookform/resolvers` can resolve its `react` or `zod`
types to the landing page's newer copy. Each Vite app's `tsconfig.app.json` therefore pins
those imports to its own `node_modules` in `paths`:

```jsonc
// Pin React types to this app's own @types/react 18 …
"react": ["./node_modules/@types/react"],
"react/*": ["./node_modules/@types/react/*"],
"react-dom": ["./node_modules/@types/react-dom"],
"react-dom/*": ["./node_modules/@types/react-dom/*"],
// Same for zod …
"zod": ["./node_modules/zod"],
```

Keep these entries (and their comments) when editing those files. Add the same pins to any
new Vite app.

### Landing page

`apps/landing-page/tsconfig.json` is the single config that Next.js generates and maintains.
It is not a solution file and has no `tsconfig.app.json` / `tsconfig.node.json`. It has the
`next` TypeScript plugin, includes `next-env.d.ts` and `.next/types/**`, and adds the `@/*`
alias plus path mappings for the `@truckmoov/api` TypeScript sources. `next build` type-checks
with it. To check by hand, run `npx tsc --noEmit -p .` from the app.

When adding a new app, start from the shared base when possible, then add only the path aliases, framework types, and stricter app-specific checks that the app needs.
