# Page Parity

How to make a page in this repo look like its counterpart in **fleetflow-pro-main**.

`fleetflow-pro-main` (`http://localhost:8080`) is the **design reference** — the Figma.
It is a separate repo sitting beside this one:

```
Telconix-limited/
  fleetflow-pro-main/   ← the reference ("Figma")
  truckmoov-web/        ← this repo (the target)
```

When the request is *"make `/drivers` look like fleetflow"*, *"mirror the fleetflow
page"*, or *"port X"*, it means: **the screen must match the reference detail for
detail** — tabs, table columns, cell formatting, row actions, filters, dialogs,
empty states. Not "similar in spirit". The same page.

> **This doc overrides [file-structure.md](file-structure.md) and parts of
> [design.md](design.md) — but only for parity ports.** See
> [Override note](#override-note). Net-new pages still follow `design.md`.

## The one fact that makes this easy

`packages/reusables/src/index.css` is a fork of fleetflow's `src/index.css` with
**identical token values on identical line numbers** (`--primary: 45 100% 45%`,
`--radius: 0.875rem`, the whole `sidebar-*` set, `--chart-1..5`). Diffing the two
files turns up only trailing whitespace and one reworded comment — **not a single
differing token value**.

So: **a `className` copied from fleetflow renders identically here.**

Two consequences:

- A parity port **never edits CSS or `tailwind.config.ts`**. If a colour looks
  wrong, the markup is wrong — not the token.
- Copy `className` strings **verbatim**. Don't "improve" `bg-card/50` into
  `bg-card`, don't re-order utilities, don't swap a token for one you'd have
  picked yourself.

> **Exception — the installer portal.** `apps/installer` (:3003) follows the live
> demo at `https://appdemo.truckmoov.com/installer`, not `fleetflow-pro-main`:
> the local fleetflow copy's installer pages are older than the demo. Copy
> `className`s from the demo's rendered DOM (Playwright → `outerHTML`). To sign
> in there, pick **Quick Demo Access → Installer** on `/auth`.

## 1. Find the reference page

Fleetflow keeps every role in one app under `src/pages/<role>/`. This repo splits
them across two. Map by **role folder**:

| Fleetflow folder | Target app | Port |
|---|---|---|
| `src/pages/platform/*` | `apps/admin` | 3002 |
| `src/pages/admin/*` | `apps/main` | 3001 |
| `src/pages/dispatcher/*`, `supervisor/*`, `owner-operator/*`, `installer/*`, `enterprise/*`, `aggregator/*`, `driver/*` | `apps/main` | 3001 |
| `src/pages/Index.tsx`, marketing pages | `apps/landing-page` | 3000 |

**Match by page identity, not by URL.** Route paths differ — fleetflow namespaces
by role (`/admin/drivers`, `/platform/tenants`), this repo does not (`/drivers`).
Fleetflow's `/admin/drivers` is this repo's `/drivers`.

The reference page may also be split: fleetflow pages compose dialogs and sheets
from `src/components/<domain>/`. Read those too — they are part of the page.

## 2. Copy verbatim

Everything that is visible or interactive:

- **Structure** — the JSX tree, nesting, and every `className` on it.
- **KPI/stat row** — tile count, order, labels, icons, icon-chip tints
  (`bg-primary/10`, `bg-success/10`, …), and the grid classes.
- **Tabs** — same set, same order, same labels. Including Radix `Tabs`
  (`TabsList`/`TabsTrigger`/`TabsContent`) if that is what the reference uses.
- **Table** — every column, in order, with the same headers and the same cell
  rendering: mono chips, two-line composite cells, icon tiles, truncation,
  `title` attributes, badge colour lookup maps, thresholds (e.g. signal
  `>70` / `>40`). Including a hand-rolled `<table>` if that is what the
  reference uses.
- **Row actions** — the same `DropdownMenu` items, in the same order, with the
  same separators, icons, permission gating, and `className="text-destructive"`
  on destructive items.
- **Filters** — search placeholder, status `Select` options, filter popover
  fields and their options, the Apply / Show All footer, the active-count badge.
- **States** — loading, error, **both** empty states (the "nothing yet, here's
  the first action" one and the "nothing matches your filters" one).
- **Dialogs and sheets** mounted at the bottom of the page, and any footer panels.
- **Mock/demo data arrays** — see [§3 Data](#data).

## 3. The four mechanical edits

These are the only things that change. Everything else is a copy.

### Layout — strip the wrapper

**This is the one that breaks at runtime if you miss it.**

Fleetflow pages wrap themselves in the layout and pass a title:

```tsx
// fleetflow — src/pages/admin/DriverManagement.tsx:314
return (
  <DashboardLayout title="Driver Management">
    …
  </DashboardLayout>
);
```

Here, `DashboardLayout` is a **pathless route** in `shared/lib/route.tsx` that
mounts once and survives navigation, and the top-bar title comes from
`sidebarNav.ts`. A page returns **content only**:

```tsx
// this repo
return (
  <div className="space-y-6">
    …
  </div>
);
```

Keeping the wrapper renders a second sidebar and header inside the first.

So:

1. Delete the `<DashboardLayout>` wrapper and its import.
2. Check `features/dashboard/utils/sidebarNav.ts` for the route's entry. Its
   `label` **is** the top-bar heading — see
   [design.md → One route, one name](design.md#one-route-one-name).

   **If the existing label differs from fleetflow's title, keep the existing
   label.** It is also the sidebar link text and may have `labelByRole`
   overrides, so changing it renames the page everywhere for every role — a
   wider change than the port. Example: `/sims` is `label: "IoT SIMS"` here
   while fleetflow's page says `"IoT SIM Management"`; leave it. Flag the
   mismatch in the report-back and let it be decided separately.

   If there is genuinely **no** entry for the route, the page has no top-bar
   title by design — name it in the page body, as `/help` and the onboarding
   steps do.
3. Fleetflow's `subtitle` prop has no equivalent here. Drop it, or render it in
   the page body as `<p className="text-muted-foreground">` if it carries real
   information.

### Imports — one path rewrite

Primitives have the same names and the same APIs; only the path differs:

| Fleetflow | This repo |
|---|---|
| `@/components/ui/*` | `@/components/shadcn/*` |
| `@/lib/utils` | `@/lib/utils` (unchanged — aliased into reusables) |

`lucide-react`, `sonner`, `date-fns`, `recharts`, `@tanstack/react-table` are
unchanged. `TableToolbar`, `ExportButton`, `platform-filter-popover`,
`chart-date-filter` exist in both — same names, new path.

Anything fleetflow-only (`fonu-sdk`, `jssip`, `@supabase/supabase-js`,
`mermaid`) has **no equivalent here** and must not be added. If the page depends
on it, say so in the report-back rather than installing it.

### File placement

Feature-based, per [file-structure.md](file-structure.md):

```
apps/<main|admin>/src/features/<feature>/components/
  pages/   <Name>Page.tsx     ← the route-level screen
  ui/                         ← its dialogs, sheets, panels
```

Never add to `src/pages/` or `src/components/` — those are unmigrated legacy,
not a destination. Name the file `<Name>Page.tsx`, matching the existing pages in
that feature.

Route it in `shared/lib/route.tsx` with `lazy`, the way its siblings are routed.

### Data

Fleetflow talks to Supabase directly from the page and uses its own `src/hooks/*`.
**Neither exists here.** Never call Supabase from this repo — all HTTP lives in
`packages/api` ([api.md](api.md)).

Three cases:

1. **The page already exists here and is wired** (common — e.g. `DriversPage.tsx`
   already uses `useDrivers` from `@truckmoov/api/fleet`). **Keep the working
   data wiring.** You are reskinning: change the markup, keep the queries and
   mutations. Do not replace live data with mock arrays.
2. **The field has an API equivalent.** Wire it via `packages/api`.
3. **The field has no backing.** Keep fleetflow's mock array so the page renders
   complete, and **mark every one** so it is greppable when the endpoint lands:

```ts
// ponytail: mock data from fleetflow parity port — wire to packages/api
const driverBehaviorScores = [ … ];
```

Do not invent data beyond what the reference shows. If fleetflow displays a
column, port it with its mock values; if it doesn't, don't add one.

## 4. Report back

After a port, state plainly:

- **Mock data left in place** — file + const name for each, so they can be found.
- **Fields with no API backing** — what would need an endpoint to go live.
- **Anything deliberately skipped or changed**, and why (e.g. a fleetflow-only
  dependency).
- **Parity verified with Playwright MCP** — or why not (server down, MCP
  unavailable).

Don't quietly fake a number, and don't quietly drop a column.

## 5. Parity checklist — verify with Playwright MCP

Don't eyeball this. Drive both pages with **Playwright MCP** and compare:

1. Both dev servers must be running — reference at `http://localhost:8080` (its
   namespaced route, e.g. `/admin/drivers`), this repo at `:3001`/`:3002` (e.g.
   `/drivers`).
2. Navigate to each, screenshot each, and walk the list below against the pair.
3. **Any mismatch → fix the markup → re-navigate, re-screenshot, compare again.
   Repeat until every item matches.** The port is done when the screenshots
   agree, not when the page first renders.

If Playwright MCP won't connect or a server isn't up, say so in the report-back —
don't call parity verified when it wasn't.

- [ ] KPI tiles: count, order, labels, icons, tints
- [ ] Tabs: count, labels, order, default tab
- [ ] Table columns: count, order, header text
- [ ] Cell formatting: chips, two-line cells, badges, thresholds, date formats
- [ ] Row actions: items, order, separators, destructive styling, gating
- [ ] Filters: search placeholder, status options, popover fields, Apply/Show All
- [ ] Empty state — nothing yet (with its CTA)
- [ ] Empty state — nothing matches filters
- [ ] Loading state and error state
- [ ] Dialogs/sheets: all present and opening from the right triggers
- [ ] **Dark mode and light mode** — dark is the default here; check both

Once it all matches, **delete every screenshot the loop took**. They're scratch —
take them in the session scratchpad, not the repo, and leave none behind.

## Override note

This doc deliberately overrides two standing conventions, **for parity ports only**:

| Convention | Normally | During a parity port |
|---|---|---|
| [file-structure.md](file-structure.md) — "mock data are not part of this architecture" | No mock data | Mock data allowed, marked with a `ponytail:` comment |
| [design.md](design.md) — tables render through `DataTable` | `DataTable` + `useBatchedQuery` | A hand-rolled `<table>` is kept if the reference has one |
| [design.md](design.md) — tabs are routes, not Radix `Tabs` | Route-based tab bar | Radix `Tabs` is kept if the reference uses it |

The trade is deliberate: exact visual parity now, convergence later. The ported
page is a **faithful copy of the reference**, so don't "fix" one back to
convention as a drive-by — that reintroduces the drift this doc exists to stop.
Converting a ported page to `DataTable`/route-tabs/live data is its own task,
done on purpose.

Everything **not** listed above still applies — semantic tokens only, no
hardcoded colours, feature-based file placement, `packages/api` for all HTTP.

## Worked example

`fleetflow-pro-main/src/pages/admin/DriverManagement.tsx` (822 lines) →
`apps/main/src/features/drivers/components/pages/DriversPage.tsx`

Role folder `admin/` → `apps/main`. Page identity "Driver Management" → the
existing `/drivers` route, which already has an entry in `sidebarNav.ts:131`
(`label: "Drivers"`, with `labelByRole` overrides for `ENTERPRISE_ADMIN` and
`OWNER_OPERATOR`) and is routed lazily at `route.tsx:427`.

**Layout:**

```diff
- import { DashboardLayout } from "@/components/layout/DashboardLayout";
-
- return (
-   <DashboardLayout title="Driver Management">
-     <div className="space-y-6">…</div>
-   </DashboardLayout>
- );
+ return (
+   <div className="space-y-6">…</div>
+ );
```

The title is already covered by the nav entry, so nothing replaces it.

**Imports:**

```diff
- import { Badge } from "@/components/ui/badge";
- import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
- import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
+ import { Badge } from "@/components/shadcn/badge";
+ import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
+ import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/shadcn/tabs";
```

**Data:** `DriversPage.tsx` is already wired to `useDrivers` / `useCreateDriver` /
`useUpdateDriver` from `@truckmoov/api/fleet` — case 1. Keep all of it; port the
markup around it. Fleetflow's behaviour-score and IVR panels have no endpoint —
port them with their mock arrays, marked, and list them in the report-back.
