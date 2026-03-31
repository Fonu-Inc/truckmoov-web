# Project Context

## Product Vision

Truckmoov is a **multi-tenant SaaS fleet logistics platform** that gives enterprises, fleet operators, and dispatchers a single system to manage the full lifecycle of freight operations — from job creation and driver assignment to real-time GPS tracking, compliance, and settlement.

### Core problem it solves
African logistics and fleet operations are fragmented: dispatchers work across WhatsApp chats, spreadsheets, and phone calls; GPS devices are unmanaged; compliance documents expire silently; and there is no single view of what a fleet is doing. Truckmoov replaces this chaos with a structured, role-aware operations platform.

### Who uses it (tenant roles)
- **Enterprise Admin (`ENTERPRISE_ADMIN`)** — owns the organization/tenant, manages users/roles, configures settings, views shipments and settlements.
- **Fleet Manager (`FLEET_ADMIN`)** — manages vehicles, drivers, IoT devices, SIMs, compliance documents, maintenance records, and fuel.
- **Dispatcher (`DISPATCHER`)** — creates and assigns jobs, monitors live fleet on a map, manages alerts, communicates with drivers via WhatsApp/SMS/Voice.
- **Ops Analyst (`OPERATIONS_MANAGER`)** — views dashboards, builds reports, monitors KPIs, alert statistics, route performance, and compliance coverage.
- **System/Platform Admin (`PLATFORM_ADMIN`)** — manages the SaaS platform itself: tenants, billing, KYC approvals, device/SIM inventory, global settings.

### How it works end-to-end
1. **Fleet setup** — Fleet Manager registers vehicles, drivers, and GPS devices; assigns devices to vehicles and SIMs to devices.
2. **Job lifecycle** — Dispatcher creates a job (pickup/dropoff, priority, time window), assigns it to a driver/vehicle, and monitors progress.
3. **Driver comms** — Truckmoov sends job instructions via WhatsApp (fallback SMS/voice); drivers reply with simple commands (ACK/ARRIVED/DELIVERED) that update job status in real time.
4. **Live tracking** — GPS devices push location pings; Dispatcher views live vehicle positions on a map; geofences auto-detect arrivals/departures; deviation alerts fire when drivers go off-route.
5. **Alerts & exceptions** — System raises delay, deviation, and unauthorized-usage alerts; Dispatcher acknowledges/resolves them; escalation rules push critical alerts to managers.
6. **Documents & compliance** — Fleet Manager uploads compliance documents per vehicle/driver (permits, insurance, etc.); system tracks expiry and sends renewal reminders.
7. **Maintenance** — Fleet Manager logs work orders, assigns technicians, tracks status; overdue maintenance auto-flags; vehicles under maintenance are excluded from dispatch.
8. **Reporting** — Ops Analyst builds and schedules custom reports; exports CSV/PDF; drills from KPI to individual job/vehicle/driver.
9. **Settlement & invoicing** — Finance users process waybills (AI/OCR extraction), generate invoices, track payment status, and manage wallet/communication credits.
10. **Integrations** — Enterprise Admins configure outbound webhooks, ERP/TMS sync, WhatsApp Business templates, and accounting integrations (e.g. Sage).

### Key design principles
- **Role-aware UI** — every page and sidebar entry is gated to the roles that need it; no role sees more than their function requires.
- **Driver-first comms** — drivers never need to install an app; all interaction is via WhatsApp/SMS/Voice with simple keyword commands.
- **Multi-tenant isolation** — each organization's data is strictly isolated; Platform Admin manages all tenants from a separate admin surface.
- **Offline-tolerant field ops** — GPS telemetry, job status updates, and comms all have retry/fallback paths for low-connectivity environments.
- **Audit everywhere** — auth actions, document access, job changes, comms, and invoices all produce traceable audit trails for compliance.

## User Story Convention

When given a user story to implement, follow this process:

### Role Mapping
User story role names map to `UserRole` code values as follows:

| User Story Role    | Code `UserRole`      | Notes |
|--------------------|----------------------|-------|
| Enterprise Admin   | `ENTERPRISE_ADMIN`   | |
| System Admin       | `PLATFORM_ADMIN`     | |
| Fleet Manager      | `FLEET_ADMIN`        | |
| Ops Analyst        | `OPERATIONS_MANAGER` | |
| Dispatcher         | `DISPATCHER`         | |
| Compliance Admin   | `ENTERPRISE_ADMIN`   | |
| System             | *(backend job)*      | Do NOT implement — backend concern only |
| Driver             | *(no role)*          | Do NOT implement — no driver role in the app |
| User               | All `UserRole` values | Feature/page is accessible to every role |

### Implementation Rules
0. **UI only, no dummy API** — when working on an epic, build the UI only. Do not create placeholder/dummy API hooks, mock requests, or fake data fetching. Use local UI state or static placeholder data directly in the component until real backend endpoints are available and explicitly handed over for integration.
1. **Check first** — before creating anything new, determine whether the user story is an enhancement to a page that already exists in an active feature (`auth`, `setting`, `dashboard`, `fleet`, `dispatch`). If it is, extend the existing feature rather than creating a new one.
2. **Access control** — access is controlled by what roles can *see*, not by route guards. If a user story names specific roles, restrict access by only adding the page's sidebar entry for those roles in `src/shared/lib/sidebarListItem.ts`. Since the sidebar is the only navigation surface, users without an entry simply never discover the route. Do not create role guard providers, wrapper components, or route-level permission checks for this purpose.
3. **Skip non-app roles** — do not implement anything for `System` (backend job) or `Driver` (no role).
4. **Feature placement** — new pages/components go inside the relevant active feature folder. If no existing active feature owns the epic's domain, create a new feature folder under `src/features/` following the feature-first architecture convention, then update the **Active main-app features** list in the App Architecture Overview section of this file to include the new feature.
5. **Route & sidebar registration** — for every new page: (a) add its path constant to `src/shared/lib/appRoutes.ts`, (b) register the `RouteObject` in `src/shared/routes/routes.tsx` under `MainLayout` children, and (c) if the page needs a sidebar link, add role-gated details to the appropriate `*_DETAILS` constant in `src/shared/lib/sidebarListItem.ts` and add the entry to the returned array.

## App Architecture Overview

- The app has two distinct zones: the **main app** and a **demo app**.
- The **demo app** lives under the `/demo` route. It is the legacy system and is a temporary compatibility path — it will be removed once the main app migration is complete. Do not add new features or expand work in the demo zone.
- The **main app** is everything under `src/features/` and `src/shared/`. All new work should target this zone.
- Active main-app features (feature-first architecture, each owning its UI, API, types, and orchestration):
  - `src/features/auth` — authentication flows
  - `src/features/setting` — organization/user settings
  - `src/features/dashboard` — role-based dashboards
  - `src/features/fleet` — fleet/vehicle management
  - `src/features/dispatch` — dispatch/job management
  - `src/features/integrations` — integrations and developer portal UI
  - `src/features/reports` — report builder UI for Ops Analyst
- Any feature folder outside the six above (e.g. `src/features/business`, `src/features/driver`, `src/features/platform`, etc.) belongs to the demo app and should not be touched for main-app work.
- **`src/shared/`** is the cross-feature infrastructure layer for the main app. It contains:
  - `components/` — reusable UI components
  - `composables/` — shared composable utilities
  - `hooks/` — shared hooks
  - `layouts/` — layout wrappers
  - `lib/` — shared libs including `sidebarListItem.ts` (sidebar config per role) and `appRoutes.ts`
  - `providers/` — shared providers
  - `routes/` — route definitions
  - `types.ts` — shared types
  - `utils/` — shared utilities
- **`src/shared/lib/sidebarListItem.ts`** is the single source of truth for what each `UserRole` sees in the sidebar. All sidebar label, route, icon, pageTitle, and pageDescription values are role-gated here.
- **`src/shared/lib/appRoutes.ts`** is the single source of truth for all main-app route path strings. When adding a new page, define its path constant here first.
- **`src/shared/routes/routes.tsx`** is where all main-app `RouteObject` definitions live (`buildAppRoutes()`). When adding a new page, register it here by importing the page component and adding it under the `MainLayout` children (or as a top-level route for auth/error pages).
- Folders such as `src/pages/`, `src/hooks/`, `src/contexts/`, `src/utils/`, `src/data/`, `src/integrations/`, `src/lib/`, `src/services/`, `src/stores/`, and `src/types/` at the `src/` root level are legacy/demo infrastructure. Prefer `src/shared/` equivalents for main-app work.

## TanStack Query Mutation Handling Convention

- Global mutation errors are handled in `queryClient` (`src/services/api/TanstackQueryProvider.tsx`) via `defaultOptions.mutations.onError`.
- The global handler reads Axios error payloads (`ServerErrorResponse`) and displays toast messages.
- Feature/page-level mutation calls should follow the `mutateAsync` pattern used in `onSignUpSubmit` in `src/features/auth/ui/pages/AuthPage.tsx`.
- For success UX, follow the existing mutation-hook pattern (for example `useRegister` in `src/features/auth/api/index.ts`) where `onSuccess` can toast with `data.message`.
- Per-call `mutateAsync` callbacks can still be used for page-specific behavior (navigation, reset, UI toggles) when needed.
- Do not duplicate generic toast error handling in each mutation call when global `onError` already covers it.

## Form Handling Convention

- Use `react-hook-form` for form state/submit handling across the project.
- Use `zod` schemas for validation rules, with `zodResolver` integration.
- Prefer schema-driven validation over manual `if`/`else` checks in submit handlers.
- Minimize `useState` for form fields when `react-hook-form` can own the state.
- Keep forms concise by colocating:
  - schema definition
  - inferred form type (`z.infer<typeof schema>`)
  - `useForm` setup with `defaultValues`
- For submission, use `handleSubmit` + async handlers, and connect API calls through TanStack Query mutations.
- Always submit through `handleSubmit(onValidSubmit)` so Zod validation gates execution.
- If required/missing fields fail Zod validation, the submit handler (`onValidSubmit`) must not run.
- shadcn/ui is installed — always use its components (`Input`, `Button`, `Label`, `Select`, `Checkbox`, `InputOTP`, etc.) for form fields instead of raw HTML elements.
- For custom/non-native inputs (shadcn `Select`, `Checkbox`, `InputOTP`, etc.), use `Controller` from `react-hook-form` to integrate them since they don't support `register` directly.
- For standard text/email/password inputs rendered as native `<input>`, use `register` directly on the shadcn `Input` component.

## Shared Button Loading Convention

- The shared shadcn `Button` in `src/components/ui/button.tsx` supports `ButtonProps.isLoading?: boolean`.
- When using the shared `Button` for async submit/action states, pass the controlling boolean (`isPending`, `isSubmitting`, `saving`, etc.) through `isLoading`.
- `isLoading={true}` is responsible for the loading UI and also disables the shared `Button` while the async action is in progress.
- Do not manually render spinner/loading UI inside the shared `Button` for standard loading states; let the component handle that behavior.
- Do not duplicate `disabled={isLoading}` on the shared `Button`, since the component already disables itself while loading.
- Keep separate `disabled` conditions only for non-loading constraints such as invalid form state, missing required selections, or permission/role guards.
- This convention applies to the shared shadcn `Button` only, not to raw HTML `<button>` elements or non-button loading indicators.

## UI Copy Extraction Convention

- When asked to copy UI from one file to another, preserve the visual structure and interaction shape, not the source file's business logic or data layer.
- Rebuild the target inside the destination feature with feature-local components, types, constants, and orchestration instead of importing demo/mock hooks into main-app feature code.
- Make the copied UI work independently by default using local UI state or placeholders when backend/API wiring is not ready.
- Centralize state transitions and draft shaping in one feature-local orchestration layer so future API integration can replace local actions without rewriting presentational components.
- Break the copied UI into focused components and keep prop drilling shallow: one level preferred, two levels maximum.
- Prefer UI-only local types/constants when the source and target files belong to different logic layers or architectures.
- When copying table-display UI, use `src/components/ui/data-table.tsx` instead of hardcoded `<table>` markup.
- Always wire table loading and no-results UX through `DataTable` props (`isLoading`, `noResultStatement`) rather than custom conditional wrappers around table markup.
- Preserve source-table visual structure in the target feature, but keep the target independent by using placeholders for fields/actions that are not yet available in that feature's data layer.

## API Response Contract Convention

- Use the shared Axios instance from `src/shared/axios-instance.tsx`.
- Model success responses with `ServerSuccessResponse<T>`:
  - `status: true`
  - `message: string`
  - `data: T`
- Model error responses with `ServerErrorResponse`:
  - `status: false`
  - `message: string`
- Type mutation/query Axios calls with these wrappers so UI logic can rely on consistent `message` and `data` fields.
- Use server-provided `message` for user-facing toasts where applicable (especially in mutation success handlers).

## System Migration Convention (Supabase -> Backend Service)

- The project is migrating the entire app away from Supabase backend services to a separate backend service.
- Existing Supabase integrations are legacy compatibility paths and should not be expanded for new feature work.
- For new modules and refactors, prefer backend endpoints via Axios + TanStack Query.
- Data access, mutations, and validation flows should align with shared API contracts (`ServerSuccessResponse<T>`, `ServerErrorResponse`) and query/mutation conventions in this context file.
- When touching legacy Supabase code, prefer migration-safe changes that move behavior toward the backend service model.

## Feature-First Architecture Convention

- Use feature-based ownership: each feature is responsible for its own UI, API calls, domain models, orchestration, and utilities.
- Place feature-specific API hooks/types under that feature, not under global services.
- Preferred feature structure (use what is needed per feature):
  - `components/`
  - `api/`
  - `pages/`
  - `layout/`
  - `provider/`
  - `composable/`
  - `util/`
- For example, auth API hooks/types should live in `src/features/auth/api/`.
- API folder structure convention:
  - `api/index.ts`: exports TanStack Query hooks (queries/mutations) and query options.
  - `api/requests.ts`: contains pure request functions that call server endpoints via Axios.
  - `api/types.ts`: contains request/response DTO types used by requests/hooks.
- Keep `index.ts` focused on query orchestration and side-effects (for example toasts, token writes), while `requests.ts` stays transport-focused.
- Keep shared cross-feature infrastructure in shared locations (for example Axios instance, Query provider, global providers, shared libs/components).
- For new features, start from feature-local folders first; only promote to shared modules when multiple features need the same behavior.

## Auth-Specific Migration Rules

- New auth flows should use backend endpoints via Axios + TanStack Query hooks.
- Sign-in responses should store `accessToken` and `refreshToken` in `useAuthStore`.
- `useAuthStore` is the source of truth for tokens and should persist them to `localStorage` via Zustand `persist` middleware.
- `isAuthenticated` must be derived from token presence (`accessToken` + `refreshToken`), not from Supabase session existence.
