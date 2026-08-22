# App Design

How the tenant app (`apps/main`, `http://localhost:3001`) looks and is put together.
Read this before building or changing any UI. The admin app (`apps/admin`, `:3002`)
shares the same design system and layout conventions.

Source of truth files:

| Concern | File |
|---------|------|
| Design tokens, typography, utilities | `packages/reusables/src/index.css` |
| Tailwind token mapping | `apps/main/tailwind.config.ts` |
| Page shell | `apps/main/src/features/dashboard/components/layout/DashboardLayout.tsx` |
| Sidebar | `apps/main/src/features/dashboard/components/ui/DashboardSidebar.tsx` |
| Top bar | `apps/main/src/features/dashboard/components/ui/DashboardHeader.tsx` |
| Navigation per role | `apps/main/src/features/dashboard/utils/sidebarNav.ts` |
| UI primitives | `packages/reusables/src/components/shadcn/` |
| Status screens (404 / 403 / crash) | `packages/reusables/src/components/pages/` |

`apps/admin` mirrors all four of those paths under its own `features/dashboard/`.

## The page shell

`DashboardLayout` is a **pathless route**, not a component pages render. It sits in
`shared/lib/route.ts` wrapping every route that gets the sidebar and top bar, so the
shell mounts once and survives navigation:

```ts
{ Component: DashboardLayout, children: [ /* dashboard routes */ ] }
```

A page therefore returns only its own content — it takes no `title` prop and never
imports the layout. Auth screens, the redirect aliases, the print-only P&L preview and
the 404/403 screens sit outside that wrapper and own their own chrome.

### One route, one name

`sidebarNav.ts` is the whole navigation: the nav list *and* the page titles. An entry's
`label` is both the sidebar link text and the top-bar heading, matched against
`location.pathname` by `matchNavEntry` (exact match, else longest href prefix). So a
page is called the same thing everywhere, and renaming it is a one-word edit.

Two consequences worth knowing:

- **A route with no entry has no top-bar title.** That is deliberate — the list is the
  nav. Pages off the nav (`/help`, `/architecture`, the onboarding steps) name
  themselves in their own body.
- `fullWidth: true` on an entry drops the `p-6` on `<main>` for full-bleed pages like
  `/map`. It replaced a per-page prop.

Visibility is `hasPermission`: a role sees an entry iff its key is listed, and
`getEntriesForRole` drops groups whose children are all filtered out.

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
│  w-64      │  profile)                                │
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
  broken page never blanks the shell. See [Status screens](#status-screens).
- `OnboardingRouteGate` wraps children and is a pass-through in both apps today
  ("soft gate: never blocks navigation"); write actions are gated at the
  action/button level instead. It is the seam if route gating is ever added.
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
| `ENTERPRISE_ADMIN` | `/enterprise` | Logistics Overview, Jobs, Fleet |
| `FLEET_ADMIN` | `/overview` | Dashboard, Jobs, Fleet, Drivers |
| `AGGREGATOR_ADMIN` | `/aggregator` | Network Overview, Jobs, Fleet, Drivers |
| `OWNER_OPERATOR` | `/owner-operator` | My Overview, My Jobs, My Vehicles (single-user) |
| `OPERATIONS_MANAGER` | see config | Operations subset |
| `DISPATCHER` | see config | Dispatch subset |
| `FINANCE_VIEWER` | see config | Read-only financial subset |

Entries are either a flat `SidebarNavItem` or a `SidebarNavGroup` (collapsible,
e.g. "Communications" → Messaging Center / Omnichannel Inbox). Groups
auto-expand when a child route is active. Badges come from `badgeKey`
(`messages`, `jobOffers`) resolved against live realtime counts.

All entries for all roles live in **one** `SIDEBAR_ENTRIES` array. Visibility is
a per-entry `hasPermission: UserRole[]` — a role sees an entry iff its key is
listed — and `getEntriesForRole(role)` filters that array. There are no
per-role entry arrays. Two consequences:

- One route means one entry with one label. A page is called the same thing for
  everybody who can reach it — `/fleet` is "Fleet" for the fleet provider,
  the aggregator and the enterprise alike — so a route is never listed twice
  under different names.
- The array order is the single canonical order; each role's sidebar is a
  projection of it. Moving an entry moves it for every role that sees it.

A group's children may carry their own `hasPermission`; omitted means inherit
the group's. A group whose children are all filtered out drops from the
sidebar. `hasPermission` is required on top-level entries (the array's type
enforces it), so a new entry cannot accidentally default to visible-to-all.

Active item styling: `bg-primary/10 text-primary` with a 2px left primary
border. Inactive: `text-sidebar-foreground/80` with `hover:bg-sidebar-accent`.

**To add a page to the nav, add one entry to `SIDEBAR_ENTRIES` in
`sidebarConfig.ts` with the roles that may see it.**

`hasPermission` controls **sidebar visibility only** — it is not route
authorization. There is no route-level guard: `AuthGuard` checks for a session
(and nothing else), so any authenticated user can reach any path in the route
table by typing it, whatever their role. Treat the sidebar as navigation, and
gate anything that actually matters at the action or query level.

`/not-authorized` is therefore reached only via `getPostLoginRedirectPath`, when
a role is missing from `ROLE_REDIRECT_MAP` (`features/auth/utils/authRedirect.ts`),
or by typing the URL. If real route gating is ever added, `OnboardingRouteGate`
is the seam for it.

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

## Status screens

404, 403 and crash all render the same full-bleed diagnostic panel, shared by
both apps from `packages/reusables/src/components/pages/`:

| Screen | File | Code | Accent |
|---|---|---|---|
| 404 catch-all | `NotFound.tsx` | 404 | `primary` — a wrong turn, not a fault |
| No access | `NotAuthorized.tsx` | 403 | `destructive` |
| Crash fallback | `AppError.tsx` | 500 | `destructive` |

They compose `StatusScreen.tsx`, which is presentational — no router, no stores,
the action is a `children` slot. That is what lets both apps import the pages
directly in `shared/lib/route.ts` instead of keeping a copy each.

The panel is a solid `bg-card` card with a **2px accent left rail** — the same
device the sidebar uses for its active item — an eyebrow log line, the status
code as a flat `font-mono` numeral beside the `h1`, and one detail chip when
there is a fact worth showing (404 shows the requested path). No icon medallion,
no gradient, no glow. Motion is one `animate-fade-in` with
`motion-reduce:animate-none`.

Every screen carries exactly **one** action: `GoBackButton`. It falls back to
`/` when there is no in-app history, so the button never dead-ends — `/`
resolves to the role home in main and the platform dashboard in admin. The
depth check is `utils/goBack.ts`: `history.state.idx > 0`. Do **not** use
`history.length` (it counts the whole tab session, so it is > 1 even in a fresh
tab) or `location.key === "default"` (`createBrowserRouter` always generates a
key, so it never equals `"default"`).

### ErrorBoundary

`ErrorBoundary` takes `variant`:

- `inline` (default) — compact card in the slot that broke, with `Try again`.
  Used for the sidebar / header / page-content boundaries in `DashboardLayout`.
- `page` — `AppError` full screen. Used around `<Outlet/>` in both `App.tsx`.

```tsx
<ErrorBoundary variant="page"><Outlet /></ErrorBoundary>
```

Both variants render `ErrorDetails`, which shows the error name, message, stack
frames and component stack plus a **Copy error details** button — and renders
`null` unless `import.meta.env.DEV`. Production sees the message and the button,
never a stack.

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
