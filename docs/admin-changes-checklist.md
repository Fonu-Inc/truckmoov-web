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
- [x] Saved views as pills in `?view=`: All activity · Security Events (`security` + `api_key`) · SIM Audit (`sim`)
- [x] Combined entry type covering sign-ins, security events, SIM, KYC, invoices, webhooks, API keys, tenants, users, devices (category derived from `action` / `resourceType`)
- [x] **⚠ decision / 🔌** — data source: `SystemAuditLogEntry` has no severity, outcome, location or device. Merge `getSystemAuthEvents` / `getSystemFailedLogins` / `getSystemSecurityEvents`, derive the rest client-side, and/or keep fleetflow's 30 demo entries as a fallback (spec: "real records replace the sample entries") — **decided: fleetflow demo data fallback, ponytail-marked.** Live rows from `getSystemAuditLogQueryOptions` (limit 500) via `fromSystemAuditEntry`; on error or zero rows the 30 demo entries show. Severity is always "info" for live rows until the API carries it
- [x] Columns: Timestamp · Actor · Event (+category) · Outcome / Severity · Resource · Tenant · IP & Location · Source · Actions (View)
- [x] Row click / View opens a detail `Dialog` (device, failure reason, attempts, all details); `?event=<id>` deep-links to it, cleared on close
- [x] Search ("Search actor, event, resource, tenant, IP or location...") + filters: tenant, user, event type, category, outcome, severity, source, date range; `?tenant=` pre-applies
- [x] Only the table scrolls horizontally on mobile/tablet (`min-w-0` card, `overflow-x-auto` wrapper, `min-w-[1180px]` table)
- [x] Scroll hint shown whenever the table overflows — **including wide desktop** (fleetflow's outstanding item; it only shows below `xl`) — `useHorizontalOverflow` (ResizeObserver), plus a right-edge fade while columns remain
- [x] Footer: "{n} of {total} entries · {view}" + "Entries are immutable. Retained for 7 years per NCC regulatory requirement."
- [x] Dashboard Quick Actions "Security" card → Audit & Compliance ("Open audit log") — `features/dashboard/components/overview/QuickActions.tsx`
- [x] `auditEventHref(id)` helper ready for the bell (admin's bell is an empty state — nothing to link yet)
- [x] Security alert preferences live under Settings → Notifications (see §2.6)
- [x] Notifications bell unchanged

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

- [x] Fixed column widths + min widths (`table-fixed min-w-[1440px]`, per-column `w-[%]` via column `meta`) — 9 columns here: admin keeps its extra **Stage** column
- [x] Horizontal scroll inside the table on small screens + "Scroll sideways to see all columns →" hint (`xl:hidden`, as fleetflow)
- [x] Type / stage / status badges wrap (`h-auto whitespace-normal break-words leading-tight`, status `max-w-[150px] line-clamp-2`)
- [x] "Owner Operator / Individual" label — `APPLICANT_TYPE_LABELS` in `features/tenants/utils/onboarding.ts`
- [x] Tooltip (`title`) on status badges, from new `ONBOARDING_STATUS_DESCRIPTIONS`
- [x] Visible **View Application** button (outline, `Eye`) at the row end; the decision dropdown stays beside it. Card renamed "Applications by Tenants"
- [x] Sidebar collapsed on smaller screens — below 768px the admin sidebar is an off-canvas drawer, closed by default
- [x] Dashboard summary cards single column on narrow mobile (`auto-fit minmax(13rem)` grid)

## 4. Tenants & Onboarding summary cards — original design

Reference: `components/dashboard/StatCard.tsx`. Target: `apps/admin/src/components/dashboard/StatCard.tsx`.

- [x] StatCard back to the original: `p-5`, `gap-4`, `text-2xl` value, `overflow-hidden` (shared — applies to every admin StatCard)
- [x] Total Tenants monthly growth indicator ("this month") — derived from `getSystemTenantGrowthQueryOptions(2)`; hidden until there is a previous month to compare
- [x] Icon top-left, label beside, value underneath — already the layout

## 5. Platform Dashboard — no date filter

- [x] No page-level date filter; cards and lists are all-time (parameterless queries)
- [x] Charts keep their own range controls (`RangeFilter`)
- [x] Header supports page actions — `shared/components/layout/PageHeaderActions.tsx` (see design.md → Layout anatomy)

## 6. WhatsApp Setup hidden from Platform Admin

- [x] Removed from the Communications group — `sidebarNav.ts`
- [x] `/whatsapp` redirects to `/inbox` — `shared/lib/route.tsx`; orphaned `PlatformWhatsAppSetup.tsx` deleted
- [x] `apps/main` keeps its WhatsApp Setup entry

## 7. Smaller improvements

- [x] Installer pool description under the table header — `DataTable` `headerNote` prop, used by `InstallersPage.tsx`
- [x] SIM Activation cards — admin never had the auto-added descriptions; nothing to remove
- [x] Enterprise Admin walkthrough in roadmap — fleetflow QA note, not applicable here
