# Admin changes checklist — fleetflow sync (20 Nov 2026)

Tracks the platform-admin changes listed in *Fleet Pro — Documented Changes* (20 Nov 2026)
against `apps/admin`. The reference implementation is `fleetflow-pro-main_vercel`
(`src/pages/platform/*`). See [page-parity.md](page-parity.md) for how a port is done.

Legend: `[x]` done · `[ ]` to do · `[~]` partial / differs on purpose · **⚠ decision** needs a call
· **🔌 no API** has no `packages/api` backing.

## 1. Audit & Compliance — one page

Reference: `PlatformAuditCompliance.tsx`, `LegacyAuditRedirect.tsx`, `lib/audit/unifiedAudit.ts`,
`lib/security/auditEvents.ts`. Target: `/audit-compliance` — `features/audit/components/pages/AuditCompliancePage.tsx` (replaced the
`/security` layout and `pages/platform/PlatformComplianceAudit.tsx`, both deleted).

- [x] Sidebar: replace **Security** + **Compliance & Audit** with one **Audit & Compliance** entry (`ShieldCheck`) — `features/dashboard/utils/sidebarNav.ts`
- [x] Route the new page; old URLs redirect instead of 404 (`legacyAuditRedirect` loader in `route.tsx`, also covers `/security/*`) — `/security?tab=events` → `view=security`, `tab=sim-audit` → `view=sim`, `/compliance-audit?tenant=X` keeps `tenant`
- [x] **⚠ decision** — `/security/payments-access` and `/security/devices-sims` are enforcement tools with no fleetflow counterpart; decide where they live once the Security entry goes — **decided: followed fleetflow — Security section removed, URLs redirect.** `SuspendAccessDialog` (still used by Tenants) moved to `features/tenants/components/ui/`
- [x] Three summary cards: Total Entries (`Archive`), Immutability "Enforced" (`Lock`), Retention (NCC) "7 years" (`ShieldCheck`) — `grid gap-3 sm:grid-cols-3`
- [x] No Overview tab — cards go straight into the audit log card
- [x] Saved views in `?view=`: All activity · Security Events (`security` + `api_key`) · SIM Audit (`sim`) — now Radix `Tabs` (`TabsList aria-label="Audit views"`) around the audit card, per the fork (§8); were pills
- [x] Combined entry type covering sign-ins, security events, SIM, KYC, invoices, webhooks, API keys, tenants, users, devices (category derived from `action` / `resourceType`)
- [x] **⚠ decision / 🔌** — data source: `SystemAuditLogEntry` has no severity, outcome, location or device. Merge `getSystemAuthEvents` / `getSystemFailedLogins` / `getSystemSecurityEvents`, derive the rest client-side. Live rows from `getSystemAuditLogQueryOptions` (limit 500) via `fromSystemAuditEntry`; an empty or failed log renders the page's own empty/error state. Severity is always "info" for live rows until the API carries it
- [x] Columns: Timestamp · Actor · Event (+category) · Outcome / Severity · Resource · Tenant · IP & Location · Source · Actions (View)
- [x] Row click / View opens a detail `Dialog` (device, failure reason, attempts, all details); `?event=<id>` deep-links to it, cleared on close
- [x] Search ("Search actor, event, resource, tenant, IP or location...") + filters: tenant, user, event type, category, outcome, severity, source, date range; `?tenant=` pre-applies
- [x] Only the table scrolls horizontally on mobile/tablet (`min-w-0` card, `overflow-x-auto` wrapper, `min-w-[1180px]` table)
- [x] Scroll hint shown whenever the table overflows — **including wide desktop** (fleetflow's outstanding item; it only shows below `xl`) — `useHorizontalOverflow` (ResizeObserver), plus a right-edge fade while columns remain
- [x] Footer: "{n} of {total} entries · {view}" + "Entries are immutable. Retained for 7 years per NCC regulatory requirement."
- [x] Dashboard Quick Actions "Security" card → Audit & Compliance ("Open audit log") — `features/dashboard/components/overview/QuickActions.tsx`
- [x] `auditEventHref(id)` links the bell's security entries to the audit page
- [x] Security alert preferences live under Settings → Notifications (see §2.6)
- [x] Notifications bell reads the live system activity log; read/clear state is local

## 2. Settings — seven tabs

Reference: `PlatformSettings.tsx` (Radix tabs, mostly localStorage). Target today: General · Team ·
Telephony · Notifications · Security. Target keeps route-based tabs (`SettingsLayout` already
renders fleetflow's tab-list look).

- [x] **1. My Profile** — name, email (read-only), phone, photo (2MB cap); wired to `getProfileQueryOptions`/`getMeQueryOptions`, `useUploadMedia` + `useUpdateProfile` — `MyProfileCard.tsx`; Change Password row wired to `useSystemChangePassword` — `AccountSecurityCard.tsx`
- [x] **2. Platform Profile** — platform name + support email (wired via system settings); 🔌 logo, contact phone, business address
- [x] **3. Platform Features** — Allow New Tenant Registration + Maintenance Mode are *saved* here (better than fleetflow's display-only). Enable Beta Features **left out — placebo** (`enableBetaFeatures` type comment)
- [x] **4. Display Defaults** — default timezone + default reporting range (wired via `defaults`); fleetflow's date/time format skipped (no API, not in the document)
- [x] **5. Team & Access** — admins + invites panels (wired); note pointing audit view/export to Audit & Compliance. 🔌 roles card, matrix, role editor and per-user permissions **ported with local mock store (ponytail)** — `features/settings/stores/platformRolesStore.ts`
- [x] **6. Notifications** — existing alert settings + security alert email prefs (master switch, recipient email, channels, critical-security / suspicious-activity) mapped onto `PlatformAlertSetting`; 🔌 In-app channel, Suspicious Activity and the Test button stay local (ponytail)
- [x] **7. Support Preferences** — support email (shared, wired); 🔌 support phone, response-time commitment
- [x] Remove Data Retention + Backup Frequency card
- [x] Telephony off the settings tab bar (routes + components kept)
- [x] AI — already absent from admin settings
- [x] Block IP Addresses — already absent
- [x] Tenant Onboarding Rules — already absent from global settings
- [x] Security tab off the bar (`/settings/security` redirects to `/settings`); personal 2FA (`TwoFactorSetupCard`) moves into My Profile
- [x] Outstanding (from the document): Platform Features switches persist — **already true here** for the two wired switches

## 3. Applications by Tenants table

Reference: `components/platform/KYCReviewPanel.tsx`. Target: `features/tenants/components/ui/TenantOnboardingPanel.tsx`.

**Superseded by the full replica (§8, 21 Nov 2026):** the panel is now a line-for-line copy of `KYCReviewPanel`; the earlier 9-column truckmoov variant (Stage column, decision dropdown, own search/selects) is gone.

- [x] Hand-rolled `Table` exactly as the fork: `w-full min-w-[1240px] table-fixed …`, `<colgroup>` 17/13/13/9/9/16/10/13 % with the fork's min widths — **8 columns**: Tenant Name · Contact Person · Tenant Type · Number of⏎Vehicles · Devices⏎Requested · Status · Date⏎Submitted · Actions
- [x] Horizontal scroll inside the table on small screens + "Scroll sideways to see all columns →" hint (`xl:hidden`, as fleetflow)
- [x] Type / status badges wrap (`h-auto whitespace-normal break-words leading-tight`, status `max-w-[150px] line-clamp-2`, `title` = the label)
- [x] Status shows the fork's decision labels — live status mapped by `toDecision` (`utils/onboarding.ts`): draft / submitted / under_review → "Pending review", changes_requested → "More information needed", approved → "Approved", rejected → "Rejected"
- [x] **View Application** (outline, `Eye`) is the only row action; approve / request changes / reject live on the application review page
- [x] Card "Applications by Tenants" (no `bg-card/50`), **Export Data** button (fork CSV: Organization Name, Email, Contact Person, Tenant Type, Application Type, Status, Date Submitted → `tenant-onboarding.csv`), `TableToolbar` with "Search tenants…", the four decision statuses, filter popover Organization Type / Date Applied / Device Quantity / Vehicle Quantity
- [x] Data: one live page (`page 1, limit 100`) of `getSystemOnboardingApplicationsQueryOptions`, filtered client-side like the fork; a "Showing the latest 100 of N" note appears only when there are more
- [x] Sidebar collapsed on smaller screens — below 768px the admin sidebar is an off-canvas drawer, closed by default
- [x] Dashboard summary cards single column on narrow mobile — now the fork's `grid gap-4 md:grid-cols-2 lg:grid-cols-5` (single column below `md`), see §8

## 4. Tenants & Onboarding summary cards — original design

Reference: `components/dashboard/StatCard.tsx`. Target: `apps/admin/src/components/dashboard/StatCard.tsx`.

- [x] StatCard back to the original: `p-5`, `gap-4`, `text-2xl` value, `overflow-hidden` (shared — applies to every admin StatCard)
- [x] Total Tenants monthly growth indicator ("this month") — derived from `getSystemTenantGrowthQueryOptions(2)`; no pill is shown until there is a previous month to compare
- [x] Tenants cards: Total / Active / Suspended / Terminated / Inactive Tenants (`Building2`, `CheckCircle` success, `Ban` warning, `AlertTriangle` danger, `Clock`), `grid gap-4 md:grid-cols-3 lg:grid-cols-5` — live from the tenants summary
- [x] Onboarding cards: Total Applications (`FileText`) / Pending Review (`Clock`) / Approved (`CheckCircle` success) / More Information Needed (`AlertTriangle` warning) / Rejected (`XCircle` danger), `grid gap-4 md:grid-cols-3 xl:grid-cols-5` — live from the onboarding summary (`changesRequested` → More Information Needed)
- [x] Icon top-left, label beside, value underneath — already the layout

## 5. Platform Dashboard — no date filter

- [x] No page-level date filter; cards and lists are all-time (parameterless queries)
- [x] Charts keep their own range controls (`RangeFilter`)
- [x] Header supports page actions — `shared/components/layout/PageHeaderActions.tsx` (see design.md → Layout anatomy)
- [x] **Superseded by §8 (fork sync):** the fork brought back a page-level period selector — This Week / Last Week / Overall, default Overall — in the dashboard's `<PageTitle>` action slot (`PeriodSelect`). "Date filter removed" above no longer holds

## 6. WhatsApp Setup hidden from Platform Admin

- [x] Removed from the Communications group — `sidebarNav.ts`
- [x] `/whatsapp` redirects to `/inbox` — `shared/lib/route.tsx`; orphaned `PlatformWhatsAppSetup.tsx` deleted
- [x] `apps/main` keeps its WhatsApp Setup entry

## 7. Smaller improvements

- [x] Installer pool description under the table header — `DataTable` `headerNote` prop, used by `InstallersPage.tsx`
- [x] SIM Activation cards — admin never had the auto-added descriptions; nothing to remove
- [x] Enterprise Admin walkthrough in roadmap — fleetflow QA note, not applicable here

## 8. Fork sync (fleetflow-pro-fork-main, 21 Nov 2026)

Reference moved to `fleetflow-pro-fork-main` (`src/pages/platform/*`). Ported from `diff -u` of old vs fork.

### Tenants, Application review, IoT SIMs, Devices

- [x] Tenants — centred wrapping `TabsList`, third tab **Telecom Master** (`?tab=tm-numbers`), per-tab `<PageTitle>` under the tab bar ("Tenants" / "Tenants Onboarding" / "Telecom Master") — `TenantsPage.tsx`
- [x] **🔌** Telecom Master panel — `features/tenants/components/ui/TmNumbersPanel.tsx` + `features/tenants/utils/tmNumber.ts` (with fork's `tmNumber.test.ts`). Live from `GET /auth/system/telecom-master` (list), `/:id` (detail + events) and `POST /:id/retry`; the retry endpoint re-queues failed verification/allocation requests and records the event. MTN provider processing behind the queue is still pending.
- [x] **All Tenants — full replica** of `PlatformTenants` (`TenantsPage.tsx`): fork card copy ("…plan, lifecycle status, and quota usage."), fork `ExportButton` columns, hand-rolled search ("Search by name or email...") + status `Select` + `PlatformFilterPopover` (Organization Type / Billing Model / Plan / Status / Last Active), hand-rolled sortable `Table` (Tenant · Primary Contact · Tenant Type · Status · Vehicles · Drivers · Devices · Last Active · Date Added · menu). Plan and SIMs columns dropped. Status via the fork's `normalizeStatus` (pending/trial → Inactive); tenant type folds to Enterprise / Owner-Operator (`utils/tenants.ts`). Dates use the fork's `toLocaleString` shape via `formatWithPattern("M/d/yyyy, h:mm:ss a")`. Rows: View Details · Reinstate/Suspend · Terminate
- [~] Suspend (row menu and sheet) still opens `SuspendAccessDialog` — the status endpoint requires a reason for anything but `active`; the fork suspends in one click
- [x] **Tenant details — full replica** of the fork's `TenantDetailsSheet`: Overview (Basic Details dl) · Vehicles · Drivers · Devices · Documents · Audit Log, `grid-cols-7`, "View … details" record dialog, Activate for suspended/inactive. Vehicles/Drivers/Devices/Documents/Audit are live (tenant resources, documents, audit-log endpoints). Removed with the fork: SIMs, KYC & Docs verification badges, Billing (trial card, billing facts/model), Data Export, Plan Usage + quota editor, Enabled Features — `TenantQuotaEditor.tsx`, `TenantTrialCard.tsx`, `TenantDataExportPanel.tsx` (and `OnboardingStageStepper.tsx`) are now unused
- [x] **Application review — full replica** of `ApplicationReview` (`OnboardingApplicationPage.tsx`): `<PageTitle>` org name + "Enterprise · Customer", Back + Approve / Request More Information / Reject (shown while the application is in review), Returning-customer + decision badge + "Submitted …", Business Details (`applicationFormSections`), Fleet Requirements (`FleetRequirementsReview`), Submitted Documents card (View Documents opens the fresh signed link), Rejection Reason / Information Requested, Review Notes, Device & SIM Allocation on approved apps (`TenantHardwareAllocation`), "Decision recorded …". The fork's decision dialog (Area + Reason) calls the live hook (`reject` / `requestChanges` / `approve`); the area prefixes the reason
- [~] Truckmoov-only, kept because the live workflow needs them: Mark provisioned / Resend changes-requested / payment / setup link in a `MoreHorizontal` menu beside Back; Approve / Reject per document on the Submitted Documents rows (approval is refused while a document is rejected or missing); payment-mismatch notices; the provisioning hint. Dropped (not in the fork): registry verifications card, onboarding progress stepper, applicant card, activity timeline, application reference
- [x] **Dashboard/tenant mock values removed:** Total Tenants growth is live; overdue-row tint uses `SystemTenant.overdueInvoices`; `getBillingModel` uses `SystemTenant.billingModel`; the returning-customer/application-kind placeholders, sheet `demoAudit`, KYC demo documents, notification demo feed and audit demo fallback are gone. Remaining non-mock placeholders: "Business location" / "State" read "—" (one address line); missing vehicle fields "—" (`FleetRequirementsReview.tsx`); `TenantHardwareAllocation` shows requested devices only; vehicle VIN/year/type/load and device firmware/protocol "—"; document View/Download only toast (no tenant-document download link)
- [x] IoT SIMs — controlled tabs, `<PageTitle>` "SIM Inventory" / "SIMs Activation"; Import SIM / Register New SIM moved into `<PageActions>` — `PlatformSIMs.tsx`, `SimInventoryTab.tsx`. Fork's mock `deviceId` edits skipped (SIMs are live)
- [x] Devices — `TAB_HEADINGS` + `<PageTitle>` under the tabs, wrapping `TabsList`; tabs renamed to the fork's Assigned Devices / Device Request / Device Inventory (card titles too); Add Device Model in `<PageActions>` — `PlatformDevices.tsx`, `PlatformDeviceManagement.tsx`, `DeviceCatalogManager.tsx`
- [x] Devices — fork's **Record Assignment** dialog in `<PageActions>` (`management/RecordDeviceAssignmentDialog.tsx`) wired to `POST /auth/system/devices/assign`; the platform moves stock devices to a tenant and records the assigned date
- [x] Devices — **Edit Device Details** dialog (`management/EditDeviceDialog.tsx`) from the row menu, wired to `PATCH /auth/system/devices/:deviceId` for manufacturer, model, firmware, protocol and service state
- [~] Devices — the fork's **Current Location** block in the details sheet is not shown: the system device detail endpoint carries no coordinates or speed

### Settings, Audit & Compliance, Billing, M2M IoT Bundles, Support

- [x] Settings — each tab's heading (fork `TAB_HEADINGS`) as `title`/`description` on `SETTINGS_TABS`; `SettingsLayout` renders `<PageTitle>` under the tab bar via `settingsHeading(pathname)`; off-bar Telephony routes get "Telephony" — `settingsNav.ts`, `SettingsLayout.tsx`
- [x] Settings — Save Profile (My Profile, Platform Profile) and Save Support Preferences moved into `<PageActions>` (submit buttons keep `form={…_FORM_ID}`, so they still submit from the portal) — `MyProfileCard.tsx`, `PlatformProfilePanel.tsx`, `SupportPreferencesPanel.tsx`
- [x] Telephony — fork dropped transcription: Transcriptions cost tile removed — `TelephonySettings.tsx`
- [x] Audit & Compliance — saved views are Radix `Tabs` (`TabsList aria-label="Audit views" className="h-auto flex-wrap"`, `TabsContent value={view}`); in-body subtitle removed (automatic heading shows it); overflow-aware scroll hint kept — `AuditCompliancePage.tsx`
- [x] Billing — own h1/intro removed; centred `TabsList` (`flex w-max mx-auto`) moved above the KPI cards with `<PageTitle {...TAB_HEADINGS[tab]}>` under it; Add M2M License Plan in `<PageActions>` — `PlatformCommercialBilling.tsx`, `LicensePlansTab.tsx`. First tab and heading now match the design app: "Chargeable Items"; each plan lists as a `_Yr1` and a `_RENEW` product row
- [x] M2M IoT Bundles — controlled top-level tabs above the KPI strip (`flex w-fit mx-auto …`), `<PageTitle>` "M2M Data Bundles" / "Tenant Adoption", Add Bundle in `<PageActions>`, `p-6` dropped; Tenant Adoption loses the Carrier filter, column, search term and CSV column — `PlatformDataBundles.tsx`
- [x] Support — `TAB_HEADINGS` (Support Dashboard / All Tickets / Escalated Tickets) + `<PageTitle>` under the wrapping `TabsList` — `PlatformSupport.tsx`
- [x] All Tickets — **Tenant Type** column (Owner-Operator / Enterprise / —) from each tenant's organisation types (`getSystemTenantsQueryOptions`) — `AllTickets.tsx`. Not in the CSV: export is server-side
- [~] Ticket thread `<PageTitle>` — admin has no ticket-thread page (tickets open in `AdminTicketSheet`); nothing to port
- [~] Fork `lib/bundleRenewalOutlook.ts` / `bundleTransactionReceipt.ts` — used only by the tenant `admin/DataBundles` page, not the platform one; not ported here

### Installation & Platform Dashboard

- [x] Installation — Installers / Installations Radix tabs (`?tab=installations`), centred wrapping `TabsList`, `<PageTitle>` under it ("Installer" / "Installations" + fork descriptions); Add Installer moved from the card header to `primaryActions` (installers tab only) — `InstallersPage.tsx`
- [x] Installer stat titles: Active Installers · Invitations Sent · Suspended Installers
- [x] Installer availability badge: "Assigned to a job" (warning) vs "Available" (success) — assigned when the API's `activeJobs > 0` or a live installation order names the installer and is not completed/cancelled (fork `installerHasActiveAssignment`)
- [x] `PlatformFilterPopover` with Availability / Date Added (`createdAt`) / Last Activity (`lastActivityAt`). No API params for these: with a filter on, the page loads one 100-row page and filters + pages it client-side; otherwise it stays server-paged
- [x] Installations tab — fork `PlatformInstallationsTab` / `PlatformInstallationDetails` / `InstallationStatusBadge` + `lib/platformInstallations` (with its tests) in `features/installers/{components/ui,utils,hooks}`, **live** from `getSystemInstallationJobsQueryOptions` (`/auth/system/installation-orders`, one 100-row page, refetched every 30s) — the fork's own live branch, not its demo stores
- [x] Installations — Tenant Type, Customer email, Date Created and Date Started now come from `SystemInstallationJob` (`applicantType`, `customerEmail`, `createdAt`, `startedAt`); the tenant-type and date filters match live rows
- [x] Installation details — the dialog reads `GET /auth/system/installation-orders/:id` and renders the live Vehicles / Devices / SIMs tabs, checklist progress and completion evidence; the vehicles/devices/sims tabs fall back to "not recorded" when the booking has no units
- [x] Installation Assignment — `InstallerAssignmentList` + the details dialog's assign action now persist through `POST /auth/system/installation-orders/:id/assign`. An unassigned booking moves straight to Scheduled; reassigning a scheduled or overdue booking keeps its status; work that has started is refused. `assigned` now renders as **Awaiting Acceptance** instead of being folded into "Awaiting Assignment"
- [x] Badge variants `installationScheduled/Awaiting/Completed/Cancelled/Progress/Attention` — `packages/reusables/.../badge.tsx`; `--installation-scheduled` token on the fork's line numbers in `packages/reusables/src/index.css`; colour mapped in both apps' `tailwind.config.ts`
- [x] Dashboard is now a **full replica** of the fork's `PlatformDashboard` (user override of page-parity.md's "keep the existing label" rule): `<PageTitle>` with the This Week / Last Week / Overall `PeriodSelect` → Quick Actions (Manage Tenants · Manage Devices · Manage IoT SIMs · Assign Installer to Job · Audit & Compliance, fork copy and CTAs) → five fork KPI `StatCard`s (Total Tenants · Active Tenants (success) · Total Vehicles by Tenant · Total Drivers by Tenant · Total Devices by Tenant, each `changeLabel="vs last month"`) → tabs **System Overview** (Revenue & Tenant Growth area chart + Platform Totals bar chart, Recent Platform Activity) / **Tenants** (`StakeholderOverviewTab`: Enterprises / Owner-Operators cards, Tenant Distribution pie, Assets by Tenants, Top Organizations by Assets; then Vehicles per Tenant bar chart) / **Devices & SIMs** (Device Distribution by Manufacturer, Weekly Data Usage (GB)) — `PlatformDashboard.tsx`, `features/dashboard/components/overview/*`, `features/dashboard/hooks/useDashboardTotals.ts`
- [x] Removed truckmoov-only pieces the fork doesn't have: GPS Messages/hr and Collected This Month KPIs, the IoT stats row (Total IoT SIMs / Devices, Data Usage Today, Total Data Bought), System Health, SIM carrier, Top Tenants This Month, Tenants by Plan, the tenant-growth line and the `RangeFilter` controls. Deleted `IotStats`, `MetricCard`, `SimCarrierCard`, `SystemHealthCard`, `TenantsByPlanCard`, `TopTenantsCard`, `RangeFilter` and the unused stub `components/platform/StakeholderOverviewTab.tsx` (rebuilt live under `overview/`)
- [x] Live data: KPIs + Platform Totals (overall → `getSystemDashboard` / `getSystemTenantsSummary` (active) / `getSystemDevicesSummary`; This/Last Week → tenants onboarded in the period from `getSystemTenants`, summed, as the fork), revenue (`getSystemRevenueByMonth(12)`, NGN/USD via `useCurrency`), Recent Activity (`getSystemActivityLog`, period filters a 100-entry window by `occurredAt`; icon bucketed from service/entity/action; tenant name from the tenant list, else "System"), Tenants tab (`getSystemTenants`; tenant type = fork rule — owner-operator wins, else Enterprise), Vehicles per Tenant (period tenants), manufacturers (`getSystemDeviceManufacturers`, wired to the chart's range control), data usage (`getSystemSimDataUsage(7)`)
- [x] The five KPI `change` percentages are live from `GET /auth/system/dashboard` (`changes.totalTenants`, `activeTenants`, `totalVehicles`, `totalDrivers`, `totalDevices`); no fallback constants. No demo chart series remain
- [~] As the fork, the Revenue & Tenant Growth and Tenant Distribution range controls are presentational (chart always shows 12 months / all tenants). The manufacturers control offers 7 / 30 / 90 days only (fork: Today / Yesterday / 7 / 30) because the endpoint takes no shorter window. Period selector doesn't apply to the revenue, manufacturer, data-usage or Tenants-tab stakeholder figures (fork doesn't either)

## 9. Backend wiring — IoT SIMs and M2M IoT Bundles (22 Nov 2026)

The fleetflow screens are unchanged; this wires the fields the reference showed as mock or "—" to the
`apps/auth` routes behind them (`/auth/system/sims/*`, `/auth/system/bundle-catalog/*`,
`/auth/system/bundle-adoption`). Types are hand-written in `packages/api/src/auth/types.ts` (see [api.md](api.md)).

### IoT SIMs

- [x] SIM Inventory cards — Assigned and Suspended read `summary.assigned` / `summary.suspended` (`SystemSimsSummary`); they were picked out of `byStatus`
- [x] Activation cards — Completed reads `summary.completed` from `GET /auth/system/sims/batches/summary`. The extra all-batches query that counted it is gone; the all-batches list still feeds the Operator filter options
- [x] Bulk Import — Download Template fetches `GET /auth/system/sims/import/template` (`getSystemSimImportTemplateQueryOptions`). The file's header is `ICCID,Phone Number,IMSI,Carrier`, which is what `parseSimCsv` reads; the inline template text is gone
- [x] An approved SIM request is recorded as a completed batch (SIMs reach the tenant already activated on the bundle it paid for), so Activation no longer shows approved requests as pending forever. No admin code change

### M2M IoT Bundles

- [x] Data Bundles — the catalogue is the platform's own `GET /auth/system/bundle-catalog` (`status=all`), not the tenant `data-bundles/rates` route, which hid inactive bundles. The carrier label is `carrierName`. `BundleCatalogItem` in `packages/api` now matches the server (`carrier`, `carrierName`, `price`, `active`)
- [x] KPI strip — Total Active Bundles, Expiring in 7 Days, SIMs Across Tenants and Monthly Bundle Spend come from `GET /auth/system/bundle-catalog/summary` (`getBundleSummaryQueryOptions`); three of them were "—"
- [x] Add Bundle — the Active switch is sent on create (`active`); the follow-up update that switched a new bundle off is gone. A duplicate code answers 409 and shows as the error toast
- [x] Export Data (catalogue) — server-side `GET /auth/system/bundle-catalog/export` with the table's search, carrier and status, instead of a browser-built CSV
- [x] Tenant Adoption — live from `GET /auth/system/bundle-adoption` (`getBundleAdoptionQueryOptions`). Each tenant's live bundles are grouped per mobile number into the table's existing shape (`toTenantAdoption`); the tab no longer renders an empty constant. Monthly spend is the server's `monthlySpendNgn` (live bundles only, yearly divided by 12)
- [x] Tenant Adoption search and Bundle Type filter run on the server (`search` and `bundleType` on `GET /auth/system/bundle-adoption`), by SIM: a mobile number stays when it has a bundle of that kind and the search finds the tenant name, the number, its ICCID, its plate or a bundle name. The table queries with them (the search waits 400 ms) instead of filtering rows in the browser
- [x] Tenant Adoption Export Data — `GET /auth/system/bundle-adoption/export` with the same search and bundle type: one row per live bundle (Tenant · Mobile Number · ICCID · Vehicle · Bundle · Type · Price · Expires), the columns of the fork's CSV. It is no longer built in the browser
- [x] Tenant Adoption Vehicle — the registration plate, named by fleet (`GET /fleet/internal/tenants/:id/vehicle-labels`, asked once per tenant). Blank when the SIM has no vehicle or fleet cannot be reached
- [~] Subscription vs Top-up is derived by decision, not stored: the first live bundle on a mobile number is its Subscription and each one added on top is a Top-up (`kind` on the adoption line)
