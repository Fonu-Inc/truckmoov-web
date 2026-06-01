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
- `packages/ui/tsconfig.json` extends `../app-core/tsconfig.base.json` and only adds its local `@/*` path alias.
- `packages/app-core/tsconfig.base.json` owns shared compiler defaults such as `jsx`, `moduleResolution`, `target`, `strict`, `skipLibCheck`, and `noEmit`.

## App Configs

Apps can extend the base config when their compiler settings match the shared defaults, but they may keep app-specific config when needed for tooling or framework differences.

The tenant and admin apps currently keep explicit app configs because they include app-specific path mappings and test types:

- `apps/main/tsconfig.app.json`
- `apps/admin/tsconfig.app.json`

The landing page also keeps its own Vite/React app config because it uses a different frontend dependency stack:

- `apps/landing-page/tsconfig.app.json`

When adding a new app, start from the shared base when possible, then add only the path aliases, framework types, and stricter app-specific checks that the app needs.
