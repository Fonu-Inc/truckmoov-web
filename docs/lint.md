# Lint

All three apps share one ESLint config. It lives in the `app-core` package and
each app's `eslint.config.js` is a three-line re-export of it — put rule changes
in the shared file, never in an app.

```sh
pnpm lint       # report
pnpm lint:fix   # report and autofix (turbo fans out to every app)
```

## Where it lives

| File | What it is |
|---|---|
| `packages/app-core/src/lib/eslint-config.mjs` | the config; exported as `@truckmoov/app-core/eslint-config` |
| `apps/*/eslint.config.js` | `export default truckmoov()` — nothing else |

The export takes overrides if one app ever needs them:

```js
import truckmoov from "@truckmoov/app-core/eslint-config";

export default truckmoov(
  { formatters: false },
  { rules: { "no-console": "off" } },
);
```

## What it is

[`@antfu/eslint-config`](https://github.com/antfu/eslint-config) with
`react: true`, `type: "app"`, and stylistic set to double quotes, 2-space
indent, semicolons. The rule overrides on top of it force one argument, array
element, object property, and JSX prop per line once there are two of them.

Only `**/dist/**` is ignored. Everything else in an app — `vite.config.ts`,
`index.html`, `tsconfig*.json`, tests — is linted, and `formatters: true` runs
Prettier over the CSS, HTML, and Markdown that ESLint itself does not cover.

The plugin deps (`@antfu/eslint-config`, `@eslint-react/eslint-plugin`,
`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
`eslint-plugin-format`, `@tanstack/eslint-plugin-query`) are dependencies of
`app-core`. Apps only need `eslint` itself.

## Deliberately off

| Rule | Why |
|---|---|
| `unicorn/filename-case` | most components are PascalCase; kebab-case would flag ~80% of the files |
| `antfu/consistent-list-newline` | it and the `style/*-newline` rules disagree, and `--fix` oscillates between them until it gives up |
| type-aware rules (no `tsconfigPath`) | each app's `tsconfig.json` is a solution file with `files: []`, so the TS project service cannot resolve app sources |

`style/function-paren-newline` is `"multiline-arguments"` rather than
`{ minItems: 2 }` for the same reason as the row above it: a lone multiline
argument — `createRoot(...).render(<App />)` — has to be allowed to break, or
the fixer never converges.
