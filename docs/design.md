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
| Settings tab bar | `apps/main/src/features/settings/utils/settingsNav.ts` |
| UI primitives | `packages/reusables/src/components/shadcn/` |
| Status screens (404 / 403 / crash) | `packages/reusables/src/components/pages/` |

`apps/admin` mirrors all four of those paths under its own `features/dashboard/`.

## The page shell

`DashboardLayout` is a **pathless route**, not a component pages render. It sits in
`shared/lib/route.tsx` wrapping every route that gets the sidebar and top bar, so the
shell mounts once and survives navigation:

```ts
{ Component: DashboardLayout, children: [ /* dashboard routes */ ] }
```

A page therefore returns only its own content — it takes no `title` prop and never
imports the layout. Auth screens, the redirect aliases, the print-only P&L preview and
the 404/403 screens sit outside that wrapper and own their own chrome.

`/settings` nests a second layout route inside it — `SettingsLayout`, a
**pathful** one — which owns the settings tab bar the same way: its tab pages
render content only. See [Tabs are routes](#tabs-are-routes-not-query-params).

### One route, one name

`sidebarNav.ts` is the whole navigation: the nav list *and* the page titles. An entry's
`label` is both the sidebar link text and the top-bar heading, matched against
`location.pathname` by `matchNavEntry` (exact match, else longest href prefix). So a
page is called the same thing everywhere, and renaming it is a one-word edit.

Two consequences worth knowing:

- **A route with no entry has no top-bar title.** That is deliberate — the list is the
  nav. Pages off the nav (`/help`, the onboarding steps) name themselves in their
  own body.
- `fullWidth: true` on an entry drops the `p-6` on `<main>` for full-bleed pages like
  `/map`. It replaced a per-page prop.
- `manualTitle: true` blanks the top-bar title for pages that render the design app's
  in-page heading (`h1` + description, actions on the right) themselves. The `label`
  still names the sidebar link. Admin pages render `<PageTitle>`; main pages render
  `<PageHeader>` (`apps/main/src/shared/components/layout/PageHeader.tsx`) — today `/`,
  `/jobs`, and every `/fleet`, `/drivers` and `/reports` tab (those layouts keep only
  the tab bar; each tab page renders its own heading and actions under it).
  `/subscription` and `/settings` render the heading in the layout instead (tab
  label + `description` from `billingNav.ts` / `settingsNav.ts`), since none of
  their tabs has heading actions.
  `/analytics` is `manualTitle` too, but its tabs copy the design app's per-tab
  headings as-is (a small `h3`, an `h2`, a `PageHeader`, or a status bar).

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

`--radius: 0.875rem`. The sidebar keeps its own token set
(`sidebar-background`, `sidebar-accent`, …) and **stays dark charcoal in both
themes** — only the content column and page surfaces flip with the theme, so
the sidebar always reads as the app's identity rail. The auth branding panel
(`AuthBrandingPanel`) also renders dark: it scopes `.dark` on itself so
`bg-sidebar` resolves to the dark values regardless of the app-level theme.

Charts use `--chart-1..5` (yellow, green, blue, purple, red) — MTN-aligned,
not the shadcn defaults.

### Typography

Inter for body, Inter Tight for headings — both imported at the top of
`index.css` (`index.html` also preloads Instrument Sans). Inter Tight is applied
to `h1`–`h5` and `.font-display` with `letter-spacing: -0.02em` for a tighter,
display-grade feel. Base heading scale is set globally in `@layer base`, so plain
`<h1>`–`<h4>` are already styled:

- `h1` — `text-3xl font-bold tracking-tight`
- `h2` — `text-2xl font-semibold tracking-tight`
- `h3` — `text-xl font-semibold tracking-tight`
- `h4` — `text-lg font-medium`

### Custom utilities

Defined in `index.css`, prefer these over ad-hoc CSS:

- Gradients: `bg-gradient-primary`, `bg-gradient-hero`, `bg-gradient-auth`, `text-gradient`
- Surfaces: `bg-glass` (blur 16px), `bg-overlay` (map scrim), `card-elevated` (hover-lift shadow), `surface-sleek` (elevated card + hover shadow), `lift-on-hover` (2px translateY on hover)
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
│  themed    │  <main class="p-6">  page content        │
│            │  (p-0 when fullWidth — maps, split views)│
└────────────┴──────────────────────────────────────────┘
```

```tsx
<DashboardLayout title="Organization Settings" subtitle="Optional line">
  {/* page content */}
</DashboardLayout>
```

- Fixed sidebar; content column offsets with `ml-64` / `ml-20`. The collapse is
  **not animated** — `transition-all duration-300` on a full-height fixed element
  and its content column forced a layout pass on the whole page for 300ms per
  toggle. Width snaps instead. Nothing in the sidebar transitions a layout
  property; rows use `transition-colors` only.
- Collapse state lives in `features/dashboard/stores/sidebarStore.ts` (Zustand
  with `persist`), so it survives navigation *and* reload. The localStorage key
  is per app (`main-sidebar` / `admin-sidebar`) because both dev servers share
  `localhost`'s storage across ports.
- A 2px primary bar at the very top of the shell shows `useNavigation().state`.
  Page chunks load on demand (see below), so a click can block briefly; without
  the bar that wait reads as the app freezing.
- Content column is `bg-card` and the sidebar is `bg-sidebar`. The content
  column flips with the theme; the sidebar stays dark charcoal in both
  themes, so it always contrasts against the content column — dark on
  darker in dark mode, dark on white in light mode. A `border-r
  border-sidebar-border` marks the seam.
- Sidebar, header, and page content each sit in their own `ErrorBoundary`; one
  broken page never blanks the shell. See [Status screens](#status-screens).
- `OnboardingRouteGate` wraps children and is a pass-through in both apps today
  ("soft gate: never blocks navigation"); write actions are gated at the
  action/button level instead. It is the seam if route gating is ever added.
- Header `title` is auto-overridden by the active sidebar entry's label, so the
  top bar and nav never disagree. The `title` prop is the fallback.
- Global search (`⌘K`-style shortcuts in `hooks/useKeyboardShortcuts.ts`) and
  the notification center live in the header.
- **Page heading (admin).** The admin top bar carries no title — fleetflow's
  fork moved it into the content area. `apps/admin/src/shared/components/layout/PageTitle.tsx`
  (`PageTitle`, `PageActions`) is the heading: large `h1` + description, actions
  on the right. `DashboardLayout` renders it above the page from the sidebar
  entry's `label` and `description`, unless the entry is `manualTitle` — tabbed
  pages render `<PageTitle title description primaryActions />` under their tab
  bar with a per-tab title. A page moves an existing button into the heading
  with `<PageActions>…</PageActions>` (a portal). Off-nav routes render their
  own `PageTitle`.

## Navigation model

Navigation is **role-derived, not route-derived**. In `apps/main`, `getEntriesForRole(role)` (`features/dashboard/utils/sidebarNav.ts`)
filters one shared `SIDEBAR_ENTRIES` list by `hasPermission`; there is no per-page nav
markup. Roles:

| Role | Home | Sidebar flavor |
|------|------|----------------|
| `ENTERPRISE_ADMIN` | `/` | Overview, Jobs, My Vehicles, My Drivers, My Devices, Live Tracking, M2M IoT Bundles, Communications, Payouts & Invoicing, Reports, Analytics, Billing, Settings |
| `AGGREGATOR_ADMIN` | `/aggregator` | Network Overview, Jobs, Fleet, Drivers |
| `OWNER_OPERATOR` | `/` | Overview, Jobs, My Vehicles, My Drivers, My Devices, Live Tracking, M2M IoT Bundles, Reports, Analytics, Billing, Settings |
| `OPERATIONS_MANAGER` | see config | Operations subset |
| `DISPATCHER` | see config | Dispatch subset |
| `FINANCE_VIEWER` | `/fleet/analytics` | Read-only financial subset; `/fleet` shows only Maintenance, Fuel, Financials, Analytics (`hiddenFor` in `fleetNav.ts`) |

In both apps, entries are either a flat `SidebarNavItem` or a
`SidebarNavGroup` (collapsible, e.g. "Communications" → WhatsApp Setup /
Messaging Center). A group auto-expands when a child route is active and closes
again when you navigate away — unless you toggled it by hand, which takes over
from then on.

`apps/admin` grew its first group ("Communications" → WhatsApp Setup /
Messaging Center) when those pages landed. The fleetflow fork (21 Nov 2026)
dropped that group from the platform nav, so admin's sidebar is flat again and
`/inbox`, `/messaging`, `/campaigns`, `/voice` and `/sms-templates` are
reachable by URL only (`/whatsapp` redirects to `/inbox`). The machinery —
`SidebarNavGroup` / `SidebarEntry` / `isNavGroup` in `sidebarNav.ts`, `NavGroup`
in `DashboardSidebar.tsx` — was copied across from main then. Only the group
branch came: main also carries `labelByRole` / `resolveLabel` for per-role
naming, which admin has no use for. Note the two lists still differ in what a
group may say — main's groups take `disabled: true` for a coming-soon section,
admin's have no such field.

Both apps' Communications groups now point at the same two surfaces: WhatsApp
Setup on a flat `/whatsapp`, Messaging Center on `/inbox`. In `apps/main`
`/whatsapp` is deliberately **not** a child of the `/messages` tab layout — it
renders `WhatsAppBusinessSetup` alone, without the outer tab bar. The rest of
that layout (Campaigns, Email, Templates, Voice & IVR, Recordings, IVR
Dashboard) is built and stays reachable by URL, just off the nav until it
ships; `/messages` therefore takes `guardedBy` with the `/whatsapp` role list
rather than `guarded`, since it no longer has a sidebar entry of its own.

There are **no nav badges**. `badgeKey` / `badge` and the `useRealtimeMessages`
hook behind them are gone — the counts were a stubbed `useState(0)`, so every
badge was decoration. They come back with a real feed.

All entries for all roles live in **one** `SIDEBAR_ENTRIES` array. Visibility is
a per-entry `hasPermission: UserRole[]` — a role sees an entry iff its key is
listed — and `getEntriesForRole(role)` filters that array, caching the result per
role. `SIDEBAR_ENTRIES` is a module constant, so a role's answer can never go
stale, and the cache is what makes the sidebar's `memo`'d rows referentially
stable. There are no per-role entry arrays. Two consequences:

- One route means one entry. A route is never listed twice, but the label may
  differ per role via a sparse `labelByRole` — `/fleet` is "Fleet" for the fleet
  provider and the aggregator, "My Vehicles" for the enterprise admin and the
  owner-operator. Roles absent from `labelByRole` see the base `label`, and the
  resolved label is also the top-bar title.
- The array order is the single canonical order; each role's sidebar is a
  projection of it. Moving an entry moves it for every role that sees it.

A group's children may carry their own `hasPermission`; omitted means inherit
the group's. A group whose children are all filtered out drops from the
sidebar. `hasPermission` is required on top-level entries (the array's type
enforces it), so a new entry cannot accidentally default to visible-to-all.

Active item styling: `bg-primary/10 text-primary` with a 2px left primary
border. Inactive: `text-sidebar-foreground/80` with `hover:bg-sidebar-accent`.

**To add a page to the nav, add one entry to `SIDEBAR_ENTRIES` in
`sidebarNav.ts` with the roles that may see it.**

Two ways to show something that isn't built yet. A single entry gets a normal
route pointing at `features/dashboard/components/pages/ComingSoon` — the row
navigates and highlights, the body reads "Coming soon" (for future pages). A whole section gets `disabled: true` on its group
instead: the row greys out, stops being a link, and carries a "Coming soon"
tooltip ("Communications"). Both are one-line reversals when the feature ships.
`apps/admin` has no `disabled` field on either its items or its group; adding
one means porting the greyed-out branch from main's `NavGroupBase` too. Its
Communications pages take a third route instead: they render **demo data** from
`features/communications/demoData.ts` and make no requests at all. The
`/notify/whatsapp/*` endpoints exist but are scoped to tenant-side roles — a
platform admin gets 403 `"dispatcher role required"` /
`"administrator role required"` — so no admin user can load them. Both pages
carry a `Demo data` badge so nothing reads as live. Delete that module and wire
the real hooks when admin-scoped endpoints exist.

The settings tab bar has its own list with its own field: `SETTINGS_TABS` in
`features/settings/utils/settingsNav.ts` carries `hasPermissions: UserRole[]`,
where **empty means every role reaching this app** — the opposite default from
the sidebar's `hasPermission`, which is required precisely so a new nav entry
can't slip in visible-to-all. A non-empty array both hides the tab *and*
gates its URL: `shared/lib/route.tsx` reads the same list to wrap each tab's
lazy Component in `RequireRole`, so a hidden tab is unreachable by typing —
see [Route-level authorization](#route-level-authorization).

### Sidebar rendering rules

The sidebar re-renders once per session, not once per navigation. Three rules
keep it that way — break any of them and every click pays for the whole tree:

- `DashboardSidebar` is `memo`'d and takes **no props**, so `DashboardLayout`
  re-rendering for the page title stops at the sidebar boundary.
- **Nothing at the top of the sidebar reads the location.** Active styling comes
  from `NavLink`'s own `className={({ isActive }) => …}` render prop, so a click
  updates the two anchors whose state changed. `useLocation()` appears only
  inside `NavGroup` (main only, one or two instances), which needs the pathname
  to auto-expand.
- The active left rail is always rendered as `border-l-2 border-transparent` and
  only changes colour. Toggling the border on and off changed the row's box
  metrics, making every navigation a layout pass instead of a repaint.

An href carrying a query (`/fleet?tab=maintenance`) never highlights: `NavLink`
matches on pathname only, so it would light up on plain `/fleet` next to the real
Fleet row.

### Route code splitting

`shared/lib/route.tsx` loads pages through react-router's `lazy`, one chunk
per page, in both apps:

```ts
{ path: "/fleet", lazy: async () => ({ Component: (await import("@/pages/admin/FleetManagement")).default }) }
```

`App`, both layouts, the auth pages, `RoleHomeRedirect` and the 404/403 screens
stay eagerly imported — small, critical path, and a spinner in place of the login
form is worse than the bytes. There is no `Suspense` boundary; the router owns
the pending state and `DashboardLayout` renders it as the top progress bar.

### Route-level authorization

Two lists — `SIDEBAR_ENTRIES` and `SETTINGS_TABS` — feed the same
`RequireRole` wrapper in `shared/lib/route.tsx`, so a URL a role can't see
in the nav can't be reached by typing it either. Roles are read once via
each app's `useAuthStore`; the check happens client-side before the route's
chunk loads.

- **Main app.** `getRolesForHref(href)` in `sidebarNav.ts` returns the union
  of `hasPermission` for every entry (including group children) pointing at
  that href. `guarded(href, importer)` in `route.tsx` looks it up and wraps
  the lazy Component in a `RequireRole` that redirects to `/not-authorized`
  when the role doesn't match. Routes not in the sidebar — onboarding, the
  supervisor tree, `/help`, the architecture docs, detail pages — stay
  open, same as before. Settings tabs are guarded a second time by their
  own `hasPermissions` list.
- **Admin app.** Every route shares the three `ADMIN_ROLES`, so a single
  `withGuard(ADMIN_ROLES, DashboardLayout)` at the shell covers the whole
  tree; the settings layout gets the same wrapper.

`AuthGuard` still only checks for a session — role gating is the wrapper's
job. `/not-authorized` is reached three ways now: `getPostLoginRedirectPath`
sending a role missing from `ROLE_REDIRECT_MAP`
(`features/auth/utils/authRedirect.ts`), the `RequireRole` wrapper firing on
a URL-typed hidden route, or typing the URL directly.

This is client-side gating and treated as a nav convenience — the browser
still owns the guard. Real authorization stays at the API layer.

The sidebar shows org branding (`branding.logoUrl`, `organizationName` from
`getOrganizationSettingsQueryOptions`), falling back to the MTN logo, plus a
short role badge (`ENTERPRISE`, `FLEET`, `OPERATOR`, …).

In `apps/admin` the rail block below the logo is a **static identity strip**
— "Platform Administration" / "Platform Admin" — not the signed-in user's
email or role label. The header owns the per-user identity; the sidebar
names the app section.

## Standard page composition

Most pages are: layout → optional `Tabs` → `Card` per section → `TableToolbar`
in `CardHeader` → `Table`. See
`apps/main/src/features/settings/components/pages/UsersSettingsPage.tsx` for the
canonical example (a filtered members table with row actions and dialogs).

### Tabs are routes, not query params

`/settings` in both apps is the pattern to copy for a tabbed screen:
`SettingsLayout` is a **pathful layout route** owning the tab bar and the
`Outlet`, and every tab is a child route — `/settings`, `/settings/subscription`,
`/settings/users`. The bar is a `<nav>` of `NavLink`s wearing `TabsTrigger`'s
classes (`isActive` in place of `data-[state=active]`), not Radix `Tabs`: a tab
is a page, so it gets a real anchor, back/forward, middle-click and a URL you
can send someone — and no `aria-controls` pointing at a panel that isn't there.
Every link takes `end`; settings routes are all leaves.

Three consequences worth copying:

- The tab list lives in `features/settings/utils/settingsNav.ts`
  (`SETTINGS_TABS`), the way the nav lives in `sidebarNav.ts`. Adding a tab is
  one row there plus one child route.
- A tab that is exactly one panel is routed straight off that panel's named
  export (`lazy: async () => ({ Component: (await import(…)).StoragePanel })`),
  so there is no wrapper page. Only tabs needing props, or holding more than one
  panel, have a file in `components/pages/`. See
  [file-structure.md](file-structure.md#a-panel-that-is-exactly-one-route).
- A tab that itself holds several routes nests one more layout the same way.
  `/settings/subscription` in `apps/main` is `SubscriptionSettingsPage`, a
  mini layout with Plan (`index`) and Invoices (`/settings/subscription/invoices`)
  sub-tabs. Copy the pattern when the parent tab needs its own bar.

`apps/admin`'s bar is fleetflow's seven `PlatformSettings` tabs, in its order
and with its labels, kept as routes: My Profile (`/settings`), Platform Profile
(`/settings/platform-profile`), Platform Features (`/settings/features`),
Display Defaults (`/settings/display`), Team & Access (`/settings/team`),
Notifications (`/settings/notifications`), Support Preferences
(`/settings/support`). A route can stay off the bar on purpose: Telephony
(`/settings/telephony/*`) is reachable by URL only, and the old
`/settings/security` redirects to My Profile, which now holds two-factor.

`?tab=` survives on `/fleet` and `/integrations`. Those are the next ones to
convert; nothing new should use a query param for a tab. `/messages` is already
converted — its `/ivr-dashboard` alias now redirects to the real child path.

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

### Every table is paginated

Every table renders through `DataTable`
(`packages/reusables/src/components/shadcn/data-table.tsx`) — it already carries
the three states (skeleton loading row, error row with retry, two empty states),
sortable columns, and a pagination footer with a `Rows per page` selector.
Don't hand-roll `<Table>` + `useReactTable` in a page. That includes static
tables — API docs, upload previews, print-styled statements — which use
`DataTable` with `enableSorting: false`. The only exception is HTML template
strings written into a `window.open` print window, which aren't React.

`DataTable` body cells are `whitespace-nowrap` — the wrapper already scrolls
horizontally, so cells never squash. The pagination footer renders *below* that
scrolling wrapper, not as a `<tfoot>` inside it, so a wide table never carries
the Prev/Next controls off-screen. A column holding long free text opts out
with `meta: { className: "min-w-[240px] whitespace-normal" }` (or truncates with
`max-w-[…] truncate`).

**Every `DataTable` pages.** Which kind depends on the endpoint:

| Endpoint | What the page does |
|---|---|
| Takes `page` + `limit`, returns `total` | `useServerPagination` — send `page` / `pageSize` to the query, pass `pagination(total)` |
| Takes `offset` + `limit`, returns `{ total, items }` | `useBatchedQuery` (below) |
| Returns everything, or only a capped `limit` | nothing — omit `pagination` and `DataTable` pages the rows client-side |

Client paging is the default: with no `pagination` prop the table shows 10 rows a
page and hides the footer when everything fits on one page. Filtering that shrinks
the rows moves the user back to the last page that still exists; a new `data`
array (a re-render, a refetch) does not reset the page. Don't `.slice()` the rows
you pass in — that hides data the pager could show. `pagination={false}` turns
paging off, and is only for rows that are already paged elsewhere (the cursor-paged
WhatsApp templates panel) or must all render at once (the print-only P&L
statement).

For a `page` + `limit` endpoint, use `useServerPagination`
(`packages/reusables/src/hooks/useServerPagination.ts`). Pass the filters as its
argument and it returns to page 1 when one changes, in the same render, so the
stale page is never requested. Keep `page`/`limit` out of any export payload — an
export takes every matching row. `keepPreviousData` stops the skeleton flashing
between pages:

```tsx
import { useServerPagination } from "@truckmoov/reusables/hooks/useServerPagination";

const { page, pageSize, pagination } = useServerPagination([search, status]);
const query = useQuery({
  ...getFooQueryOptions({ params: { search, status, page, limit: pageSize } }),
  placeholderData: keepPreviousData,
});

<DataTable columns={columns} data={query.data?.data.items ?? []} pagination={pagination(query.data?.data.total ?? 0)} />
```

For a list backed by an `offset` + `limit` endpoint (server returns `{ total, items }`),
pair `DataTable` with `useBatchedQuery`
(`packages/reusables/src/hooks/useBatchedQuery.ts`):

```tsx
import { useBatchedQuery } from "@truckmoov/reusables/hooks/useBatchedQuery";

const listQueryOptions = useCallback(
  ({ offset, limit }: { offset: number; limit: number }) =>
    getFooQueryOptions({ params: { ...filters, offset, limit } }),
  [filters],
);

const { items, pagination, isLoading, setPage } = useBatchedQuery({
  queryOptions: listQueryOptions,
});

useEffect(() => { setPage(1); }, [filters, setPage]);

<DataTable columns={columns} data={items} isLoading={isLoading} pagination={pagination} />
```

The hook fetches in server batches of 500 by default and slices client-side into
10-row table pages, so one round-trip covers 50 clicks. Always `useCallback` the
`queryOptions` factory (deps = filter inputs) — react-query keys off its identity.
Reset the page when filters change; the hook can't watch external state.

Do **not** hand-write `useState({ page, pageSize })` + `useQuery({ offset, limit })`
in a new page. (`apps/admin` no longer has a Security section — its
LoginHistory / SecurityEvents pages are gone. Sign-ins, security events and SIM
activity are saved views of the one Audit & Compliance log at
`/audit-compliance`, a fleetflow parity port with a hand-rolled table; the old
`/security/*` and `/compliance-audit` URLs redirect there. There is no Blocked
IPs tab either: IP blocks are automatic server-side, expire on their own, and
engineering clears them when needed.)

Non-table data (cards, lists, dialogs) gets the same three states from
`QueryState` (`apps/installer/src/components/QueryState.tsx`): skeleton while
loading, the error message + **Try again** on failure, empty copy when there is
nothing to show. Every component that calls an endpoint renders one of the two.

`DataTable` turns sorting off by itself whenever `pagination` is an object
(server-paged): sorting one page of a server-paged list is misleading. Older
pages that build the `pagination` object by hand (installer jobs) are fine as
they are. The `/subscription` billing tabs are a parity port and hand-roll the
design app's `<Table>` instead (row states via `TableStateRows` in
`features/billing/utils/billingShared.tsx`, server-paged with
`FleetTablePager`, which stays hidden until a list outgrows one page).

### Card grids step at `sm` / `xl`, not `md`

Tailwind breakpoints are **viewport** media queries, but the content column is
inset by the fixed sidebar — `ml-64` plus `<main>`'s `p-6` means the page's
usable width is ~304px less than the viewport `md:` measures. A KPI row written
`grid-cols-2 md:grid-cols-4` therefore packs four cards into ~460px at a 768px
viewport, and the labels overflow the card.

So dense card grids step later than they look like they should:

- 4 cards — `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`
- 5 or 6 cards — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5` (or `-6`)

The rule of thumb is **never let a stat card get narrower than ~240px**.

Two companion rules for the card internals, because the breakpoint alone is not
enough:

- The text wrapper beside the icon gets `min-w-0`. It is a flex child, so its
  default `min-width: auto` refuses to shrink below its content and the text
  spills past the card's rounded clip instead of wrapping.
- The icon chip gets `shrink-0`, so a long label squashes nothing.

Prefer wrapping over `truncate` on a stat label — `truncate` silently eats text
like "Total Maintenance Records".

Loading-skeleton grids must repeat the same column classes as the real grid, or
the layout jumps when data lands.

## Status screens

404, 403 and crash all render the same full-bleed diagnostic panel, shared by
both apps from `packages/reusables/src/components/pages/`:

| Screen | File | Code | Accent |
|---|---|---|---|
| 404 catch-all | `NotFound.tsx` | 404 | `primary` — a wrong turn, not a fault |
| No access | `NotAuthorized.tsx` | 403 | `destructive` |
| Crash fallback | `AppError.tsx` | 500 | `destructive` |
| Route failed to load | `RouteError.tsx` | UPDATE / 500 | `primary` for a stale page, else the crash screen |

They compose `StatusScreen.tsx`, which is presentational — no router, no stores,
the action is a `children` slot. That is what lets both apps import the pages
directly in `shared/lib/route.tsx` instead of keeping a copy each.

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

### Route errors and stale pages

React Router shows its own "Unexpected Application Error" developer page for anything a route throws while
loading — a customer must never see it. Every app's root route sets `ErrorBoundary: RouteError`
(`shared/lib/route.tsx`); it renders `AppError` for a real fault.

The common cause is a deploy: an open tab still points at the old hashed files, so a lazy route's `import()`
fails ("error loading dynamically imported module", "Failed to fetch dynamically imported module",
"Importing a module script failed"). `lib/chunkError.ts` in `packages/reusables` recognises those messages:

- `installChunkErrorRecovery()` runs in every app's `main.tsx` and reloads once on Vite's `vite:preloadError`.
- `RouteError` and `ErrorBoundary` do the same when the error reaches them. If the reload did not help, the
  reader gets "A new version is available" with a Reload button.
- One reload per 30 seconds (`sessionStorage`), so a file that is really missing cannot loop.

The helper lives in `lib/` rather than `utils/` because the apps import it through the package's `./lib/*`
export, which `utils/` does not have.

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

## AI features are off

No AI feature ships in `apps/main` or `apps/admin` for now. Don't add one back
without being asked. What was removed, so it can be found again in git history:

- Settings tabs: main's **AI Matching** (`/settings/ai`) and **AI Usage**
  (`/settings/ai-usage`); admin's **AI** (`/settings/ai-providers`).
- Drivers: the **Fatigue AI** tab (`/drivers/fatigue-ai`), the dispatcher's
  Fatigue AI tab, and the Fatigue tab / score in `DriverDetailsSheet`.
  Exception: `/drivers/fatigue` ("Driver Fatigue Detection") is back because the
  design app has it — it reads the recorded fatigue summary
  (`useDriverFatigueSummary`) and has no AI generate/recommend actions.
- Dispatch: `JobMatchingDialog` is manual-only (pick vehicle + driver);
  `AssignResourceDialog` lost its "AI Recommendation" ranking view.
- Waybills: no "Extract with AI" and no AI confidence badges — fields are
  filled in by hand via **Edit Fields**.
- Support chat: no AI assistant. Admin's widget no longer calls the
  `support-chat` edge function; both point "Still stuck?" at a live agent.
- The `/waybills/{id}/extract` endpoint and `waybill.extracted` webhook are out
  of the in-app API docs.

The `packages/api` services behind these (fatigue, recommend-drivers/vehicles,
AI config) are kept so the backend contract stays typed.

## Data & state

- Server data: React Query via `@truckmoov/api` (`packages/api`). Apps never
  call endpoints directly — see [api.md](api.md).
- Client state: Zustand. A store belongs to the feature that owns it —
  `features/dashboard/stores/sidebarStore.ts`. `authStore` is still in the loose
  `src/stores/`, which [file-structure.md](file-structure.md) says means "not
  placed yet"; move it when something else touches it.
- **Subscribe with a selector**, always: `useSidebarStore(s => s.collapsed)`, not
  `const { collapsed } = useSidebarStore()`. The destructuring form subscribes to
  the whole store, so any write anywhere re-renders the component.
- Realtime: `useRealtimeNotifications` reads the live `GET /auth/system/activity-log`
  feed; read and cleared state is local. `useRealtimeMessages` is not wired, and the
  old `lib/dummyNotifications.ts` demo feed is gone. The header bell
  (`features/dashboard/components/ui/NotificationCenter.tsx`) shows those live entries
  and deep-links security items to `/audit-compliance`.

## Notes

- This document was written from the repo (tokens, layout, sidebar config,
  Settings page) rather than by clicking through the running app; when the code
  and this file disagree, the code wins — fix this file.
- Local credentials for `:3001` used during review:
  `festusolaleyef@gmail.com` / `12345678` (ENTERPRISE_ADMIN, dev only).
