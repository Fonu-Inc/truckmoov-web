# landing-page

The FleetPro Enterprise public marketing site. Built with Next.js 16 (App Router), React 19
and Tailwind v4, and matched to the Figma file "Fleet Pro (Landing Page)". Every page is
prerendered at build time.

## Run

```sh
cp .env.example .env     # NEXT_PUBLIC_BACKEND_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_MAIN_APP_URL
pnpm dev:landing          # from the repo root; http://localhost:3000
```

| Script                                          | What it does                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`                                      | `next dev` on port 3000, all interfaces                                       |
| `pnpm build`                                    | production build to `.next/` (standalone server in `.next/standalone/`)       |
| `pnpm start`                                    | serves the production build on port 3000                                      |
| `pnpm lint`                                     | shared ESLint config (`@truckmoov/app-core/eslint-config`)                    |
| `pnpm env:generate` / `env:check` / `env:watch` | regenerate / verify / watch `src/shared/env/env.ts` from `.env` (type-envgen) |

## Docs

- [docs/landing-page.md](../../docs/landing-page.md): structure, rendering and caching rules,
  env, design tokens, and how to verify against Figma.
- [docs/landing-deploy.md](../../docs/landing-deploy.md): how CI packages the standalone
  server and what the server runs.
- [docs/file-structure.md](../../docs/file-structure.md): where files go.
