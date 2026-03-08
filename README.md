# truckmoov-web

Fleetflow-pro UI has been fully ported into this repo (pages, components, hooks, styles, and routing), while integration paths are stubbed for local-first development.

## What this port includes

- Full Fleetflow UI surface under `src/`:
  - `src/pages/*` (legacy compatibility shims)
  - `src/components/*`
  - `src/hooks/*`
  - `src/index.css` + Tailwind/shadcn stack
- Fleetflow routing and dashboard flows from `src/App.tsx`.
- Assets and UI dependencies required for visual parity.

## Integration behavior in this repo

To keep this local and integration-free by default:

- `src/integrations/supabase/client.ts` now exports a mock Supabase client.
- Auth bootstraps to demo users (default: `platform_admin`) when no live session exists.
- Supabase queries/functions/storage/channels resolve mock-safe responses so UI flows render without external services.

## Architecture mapping used here

Micro-frontend boundaries are restored through feature modules under `src/features/*`:

- `domain/`: route catalog and feature boundary constants.
- `application/`: route builders that compose each bounded context.
- `infrastructure/`: feature-level integration policy notes.
- `ui/`: adapters that expose page entrypoints used by feature route builders.

`src/App.tsx` only composes feature route builders; it no longer imports page modules directly.

The following migration is now completed:

- Route pages were moved into feature-owned `ui/pages/`.
- Context-specific component groups were moved into feature-owned `ui/components/` for:
  - platform
  - supervisor
  - owner-operator
  - tenant-admin (`admin`)
  - business (`aggregator`)
  - support
- Context-specific hooks were moved into feature-owned `application/hooks/` for selected modules.

Legacy paths under `src/pages/*`, and selected paths under `src/components/*` and `src/hooks/*`, remain as compatibility shims so existing imports do not break while the migration continues.

Remaining Fleetflow implementation still under legacy locations (to be moved incrementally) includes:

- `src/components/*`
- `src/hooks/*`

Feature route ownership is enforced in `src/features/*` and verified with `pnpm verify:architecture`.

## Run locally

```bash
cp .env.example .env
pnpm install
pnpm dev
```

## Validate

```bash
pnpm verify:architecture
pnpm build
```

## Notes for next phase

- If you want real services, replace the mock Supabase client with live adapters gradually per module.
- Next step after parity: progressively migrate each context’s internal hooks/components into corresponding `src/features/<context>` folders while keeping route contracts stable.
