# App Design

How the tenant app (`apps/main`, `http://localhost:3001`) looks and is put together.
Read this before building or changing any UI. The admin app (`apps/admin`, `:3002`)
shares the same design system and layout conventions.

Source of truth files:

| Concern | File |
|---------|------|
| Design tokens, typography, utilities | `packages/reusables/src/index.css` |
| Tailwind token mapping | `apps/main/tailwind.config.ts` |
| Page shell | `apps/main/src/components/layout/DashboardLayout.tsx` |
| Sidebar | `apps/main/src/components/layout/DashboardSidebar.tsx` |
| Top bar | `apps/main/src/components/layout/DashboardHeader.tsx` |
| Navigation per role | `apps/main/src/lib/sidebarConfig.ts` |
| UI primitives | `packages/reusables/src/components/shadcn/` |

## Identity

MTN-inspired enterprise fleet management. Dark-first, yellow accent, dense
data tables, no decoration for its own sake. Product title is "FleetPro"
(`apps/main/index.html`); the repo/workspace name is Truckmoov.

## Theme

Dark is the default. `apps/main/index.html` runs an inline script before paint
that adds `.dark` to `<html>` unless `localStorage.theme === "light"`, so there
is no flash. Light mode is the `:root` block, dark is `.dark`.

Never hardcode a color. Use the semantic Tailwind token (`bg-card`,
`text-muted-foreground`, `border-border`) so both themes work.

### Core tokens

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `background` | `0 0% 99%` | `220 20% 7%` | App canvas |
| `card` | `0 0% 100%` | `220 18% 13%` | Content surfaces (lighter than sidebar) |
| `primary` | `45 100% 45%` | `45 100% 51%` | MTN yellow — CTAs, active nav, highlights |
| `accent` | `40 95% 45%` | `40 95% 45%` | Warm gold secondary accent |
| `secondary` / `muted` | `220 14% 96%` | `220 16% 16%` | Subtle fills, hover states |
| `muted-foreground` | `220 10% 40%` | `220 10% 55%` | Secondary text |
| `border` | `220 13% 90%` | `220 16% 20%` | Hairlines |
| `destructive` | `0 72% 51%` | `0 72% 51%` | Destructive actions, errors |
| `success` | `152 69% 36%` | `152 69% 41%` | Active / healthy |
| `warning` | `38 92% 45%` | `38 92% 50%` | Idle / attention |
| `info` | `199 89% 42%` | `199 89% 48%` | Informational |
| `ring` | primary | primary | Focus rings are always yellow |

`--radius: 0.5rem`. The sidebar keeps its own token set
(`sidebar-background`, `sidebar-accent`, …) and stays dark in **both** themes
for contrast.

Charts use `--chart-1..5` (yellow, green, blue, purple, red) — MTN-aligned,
not the shadcn defaults.

### Typography

Inter, imported at the top of `index.css` (`index.html` also preloads
Instrument Sans). Base heading scale is set globally in `@layer base`, so plain
`<h1>`–`<h4>` are already styled:

- `h1` — `text-3xl font-bold tracking-tight`
- `h2` — `text-2xl font-semibold tracking-tight`
- `h3` — `text-xl font-semibold`
- `h4` — `text-lg font-medium`

### Custom utilities

Defined in `index.css`, prefer these over ad-hoc CSS:

- Gradients: `bg-gradient-primary`, `bg-gradient-hero`, `bg-gradient-auth`, `text-gradient`
- Surfaces: `bg-glass` (blur 16px), `bg-overlay` (map scrim), `card-elevated` (hover-lift shadow)
- Emphasis: `glow-primary`, `glow-success`, `mtn-highlight`, `animate-pulse-slow`
- Status pills: `status-active`, `status-idle`, `status-offline`, `status-moving`
- Map/vehicle: `map-marker` (ping ring), `vehicle-active` (pulse)
- Focus: `focus-mtn`

Scrollbars are restyled globally to a 6px muted thumb.

## Layout anatomy

`DashboardLayout` wraps every authenticated page:

```
┌────────────┬──────────────────────────────────────────┐
│  Sidebar   │  DashboardHeader (title, search, bell,   │
│  w-64      │  org switcher, profile)                  │
│  (w-20     ├──────────────────────────────────────────┤
│ collapsed) │  TrialBanner (conditional)               │
│            ├──────────────────────────────────────────┤
│  dark      │  <main class="p-6">  page content        │
│  always    │  (p-0 when fullWidth — maps, split views)│
└────────────┴──────────────────────────────────────────┘
```

```tsx
<DashboardLayout title="Organization Settings" subtitle="Optional line">
  {/* page content */}
</DashboardLayout>
```

- Fixed sidebar; content column offsets with `ml-64` / `ml-20`, animated
  `transition-all duration-300`. Collapse state lives in
  `stores/sidebarStore.ts` (Zustand), so it persists across routes.
- Content column is `bg-card`, one step lighter than the sidebar — that
  contrast *is* the layout separation. Don't add a border to fake it.
- Sidebar, header, and page content each sit in their own `ErrorBoundary`; one
  broken page never blanks the shell.
- `OnboardingRouteGate` wraps children and can redirect users who haven't
  finished KYC/onboarding.
- Header `title` is auto-overridden by the active sidebar entry's label, so the
  top bar and nav never disagree. The `title` prop is the fallback.
- Global search (`⌘K`-style shortcuts in `hooks/useKeyboardShortcuts.ts`) and
  the notification center live in the header.

## Navigation model

Navigation is **role-derived, not route-derived**. `getSidebarConfig(user)`
returns `{ homeRoute, entries }` for the user's role; there is no per-page nav
markup. Roles:

| Role | Home | Sidebar flavor |
|------|------|----------------|
| `ENTERPRISE_ADMIN` | `/enterprise` | Logistics Overview, Shipments, Fleet Providers |
| `FLEET_ADMIN` | `/admin` | Fleet Operations, Dispatch, Vehicles, Drivers |
| `AGGREGATOR_ADMIN` | `/aggregator` | Network Overview, Job Coordination, Network Members |
| `OWNER_OPERATOR` | `/owner-operator` | My Overview, My Jobs, My Vehicles (single-user) |
| `OPERATIONS_MANAGER` | see config | Operations subset |
| `DISPATCHER` | see config | Dispatch subset |
| `FINANCE_VIEWER` | see config | Read-only financial subset |

Entries are either a flat `SidebarNavItem` or a `SidebarNavGroup` (collapsible,
e.g. "Communications" → Messaging Center / Omnichannel Inbox). Groups
auto-expand when a child route is active. Badges come from `badgeKey`
(`messages`, `jobOffers`) resolved against live realtime counts.

Active item styling: `bg-primary/10 text-primary` with a 2px left primary
border. Inactive: `text-sidebar-foreground/80` with `hover:bg-sidebar-accent`.

**To add a page to the nav, edit `sidebarConfig.ts`** — `getAllowedRoutes()`
derives route authorization from the same config, so a page added only to the
router is unreachable/unauthorized by design.

The sidebar shows org branding (`branding.logoUrl`, `organizationName` from
`getOrganizationSettingsQueryOptions`), falling back to the MTN logo, plus a
short role badge (`ENTERPRISE`, `FLEET`, `OPERATOR`, …).

## Standard page composition

Most pages are: layout → optional `Tabs` → `Card` per section → `TableToolbar`
in `CardHeader` → `Table`. See `apps/main/src/pages/admin/Settings.tsx` for the
canonical example (tabbed settings with a filtered members table).

```tsx
<Card className="bg-card/50 border-border/50">
  <CardHeader>
    <TableToolbar
      search={search} onSearchChange={setSearch}
      searchPlaceholder="Search by name or email..."
      status={status} onStatusChange={setStatus}
      statusOptions={[{ value: "all", label: "All statuses" }, ...]}
      filterEntity="team members"
      filterFields={filterFields} filterValues={filters} onFiltersApply={setFilters}
    />
  </CardHeader>
  <Table>…</Table>
</Card>
```

Conventions that repeat across pages:

- Panel surface is `bg-card/50 border-border/50` — a translucent card on the
  card-colored content column.
- Table rows use `border-border/50`; header rows add `hover:bg-transparent`.
- Every table gets the three states: loading row, error row with a retry
  `Button variant="link"`, and two distinct empty states ("nothing yet, here's
  the first action" vs. "nothing matches your filters").
- Row actions go in a trailing `w-[60px]` cell as a `DropdownMenu` behind a
  `MoreHorizontal` ghost icon button; destructive items get
  `className="text-destructive"`.
- Status and role are `Badge`s driven by a `statusColors` / `roleColors` lookup
  map, never inline conditionals.
- Search/status/filter state is plain `useState` in the page; filtering is done
  client-side over the query result.

## Component rules

- All primitives are shadcn/Radix in `packages/reusables/src/components/shadcn/`,
  imported as `@/components/shadcn/*` (aliased in each app's `vite.config.ts`
  and `tsconfig.json`). Never copy a primitive into an app.
- New shared UI goes in `packages/reusables`, not in an app.
- `TableToolbar` is the only sanctioned table toolbar — search + status select +
  structured filter popover (`range` / `date` / `daterange` / `select` fields
  with per-field enable checkboxes, Apply / Show All). Don't hand-roll one.
- Buttons: see [button.md](button.md). The project `Button` has a `loading`
  prop — use it instead of a bespoke spinner. `variant="gradient"` is the
  primary CTA in dialogs.
- Forms: see [forms.md](forms.md) — react-hook-form + zod + shadcn `Form`.
- Toasts are `sonner`. Icons are `lucide-react`, `h-4 w-4` inline / `h-3 w-3` in
  dense table meta.
- Modals are `Dialog`; mobile/side panels are `Sheet` or `Drawer`.
- Charts use the shadcn `chart` wrapper with `--chart-*` tokens.

## Data & state

- Server data: React Query via `@truckmoov/api` (`packages/api`). Apps never
  call endpoints directly — see [api.md](api.md).
- Client state: Zustand stores in `apps/main/src/stores/` (`authStore`,
  `sidebarStore`, …).
- Realtime: `useRealtimeNotifications`, `useRealtimeMessages` feed the header
  bell and sidebar badges.

## Notes

- This document was written from the repo (tokens, layout, sidebar config,
  Settings page) rather than by clicking through the running app; when the code
  and this file disagree, the code wins — fix this file.
- Local credentials for `:3001` used during review:
  `festusolaleyef@gmail.com` / `12345678` (ENTERPRISE_ADMIN, dev only).
