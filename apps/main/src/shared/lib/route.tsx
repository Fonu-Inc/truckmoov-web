import type { UserRole } from "@truckmoov/api/auth";
import type React from "react";
import { RequireRole } from "@truckmoov/reusables/components/auth/RequireRole";
import NotAuthorized from "@truckmoov/reusables/components/pages/NotAuthorized";
import NotFound from "@truckmoov/reusables/components/pages/NotFound";
import {
  createBrowserRouter, redirect,
} from "react-router";
import App from "@/App";
import { AuthLayout } from "@/features/auth/components/layout/AuthLayout";
import AuthPage from "@/features/auth/components/pages/AuthPage";
import CompleteProfilePage from "@/features/auth/components/pages/CompleteProfilePage";
import ForgotPasswordPage from "@/features/auth/components/pages/ForgotPasswordPage";
import InvitePage from "@/features/auth/components/pages/InvitePage";
import ResetPasswordPage from "@/features/auth/components/pages/ResetPasswordPage";
import SignUpPage from "@/features/auth/components/pages/SignUpPage";
import VerifyEmailPage from "@/features/auth/components/pages/VerifyEmailPage";
import { RoleHomeRedirect } from "@/features/auth/components/ui/RoleHomeRedirect";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { DashboardLayout } from "@/features/dashboard/components/layout/DashboardLayout";
import { getRolesForHref } from "@/features/dashboard/utils/sidebarNav";
import { DataBundlesLayout } from "@/features/data-bundle/components/layout/DataBundlesLayout";
import { DriversLayout } from "@/features/drivers/components/layout/DriversLayout";
import { FleetLayout } from "@/features/fleet/components/layout/FleetLayout";
import { IntegrationsLayout } from "@/features/integration/components/layout/IntegrationsLayout";
import { PayoutsInvoicingLayout } from "@/features/payouts-invoicing/components/layout/PayoutsInvoicingLayout";
import { ReportsLayout } from "@/features/reports/components/layout/ReportsLayout";
import { SettingsLayout } from "@/features/settings/components/layout/SettingsLayout";
import { SETTINGS_TABS } from "@/features/settings/utils/settingsNav";
import { SustainabilityLayout } from "@/features/sustainability/components/layout/SustainabilityLayout";

const useRole = () => useAuthStore(s => s.user?.role);

/**
 * Wrap a lazy Component with a role check. URL-typing a page the current role
 * can't see lands on /not-authorized before the chunk mounts. Two variants:
 *
 *  - `guarded(href, importer)` — role list comes from the sidebar entry; a
 *    typo means the boot-time throw fires instead of the guard leaking.
 *  - `guardedBy(allow, importer)` — for routes that aren't in the sidebar
 *    (details, aliases already redirect elsewhere) or where a settings tab
 *    supplies the list.
 *
 * These return the object react-router's `lazy` expects, so the route table
 * still reads leaf-per-line: `{ path, lazy: guarded("/fleet", () => import(…)) }`.
 */
type LazyImporter = () => Promise<{ default: React.ComponentType<unknown> }>;
type NamedLazyImporter<K extends string> = () => Promise<Record<K, React.ComponentType<unknown>>>;

function withGuard(allow: UserRole[], Loaded: React.ComponentType<unknown>) {
  return function Guarded(props: Record<string, unknown>) {
    const role = useRole();
    if (!role || !allow.includes(role)) {
      return (
        <RequireRole
          allow={allow}
          useRole={useRole}
        />
      );
    }
    return <Loaded {...props} />;
  };
}

function guarded(href: string, importer: LazyImporter) {
  const allow = getRolesForHref(href);
  if (!allow)
    throw new Error(`route.tsx: no sidebar entry for ${href}`);
  return async () => ({
    Component: withGuard(
      allow,
      (await importer()).default,
    ),
  });
}

function guardedBy(allow: UserRole[], importer: LazyImporter) {
  return async () => ({
    Component: withGuard(
      allow,
      (await importer()).default,
    ),
  });
}

function guardedByNamed<K extends string>(allow: UserRole[], importer: NamedLazyImporter<K>, key: K) {
  return async () => ({
    Component: withGuard(
      allow,
      (await importer())[key],
    ),
  });
}

/**
 * Role list for a `/settings/*` child — reads straight from SETTINGS_TABS
 * so the tab bar and the URL guard cannot disagree. Returns `undefined` when
 * the tab is visible to every role, so the caller skips the wrapper.
 */
function settingsTabRoles(to: string): UserRole[] | undefined {
  const tab = SETTINGS_TABS.find(t => t.to === to);
  if (!tab)
    throw new Error(`route.tsx: no SETTINGS_TABS entry for ${to}`);
  return tab.hasPermissions.length === 0 ? undefined : tab.hasPermissions;
}

/**
 * SettingsLayout, wrapped in the sidebar's /settings role list so URL-typing
 * `/settings/*` from a role that isn't in that list (DISPATCHER, FINANCE_VIEWER)
 * lands on /not-authorized before any child tab loads. Built once at import so
 * the wrapper identity is stable across renders.
 */
const GuardedSettingsLayout = withGuard(
  getRolesForHref("/settings") ?? [],
  SettingsLayout,
);

/**
 * PayoutsInvoicingLayout wrapped in the sidebar's `/waybill-invoices` role
 * list. Same pattern as GuardedSettingsLayout: the pathful layout owns the tab
 * bar, child routes render the Waybills / Invoices / Pricing / Settings panels
 * into its Outlet.
 */
const GuardedPayoutsInvoicingLayout = withGuard(
  getRolesForHref("/waybill-invoices") ?? [],
  PayoutsInvoicingLayout,
);

/**
 * SustainabilityLayout wrapped in the sidebar's `/sustainability` role list.
 * Same pattern as GuardedPayoutsInvoicingLayout — the pathful layout owns the
 * page header, KPI strip and tab bar; children render into its Outlet.
 */
const GuardedSustainabilityLayout = withGuard(
  getRolesForHref("/sustainability") ?? [],
  SustainabilityLayout,
);

/**
 * FleetLayout wrapped in the sidebar's `/fleet` role list. Same reason as
 * GuardedSettingsLayout: sub-routes (`/fleet/schedules`, `/fleet/financials/*`,
 * …) inherit the layout guard, so they don't each need to look up a permissions
 * list, and typing a sub-URL from a role that can't see /fleet lands on
 * /not-authorized before any child chunk loads.
 */
const GuardedFleetLayout = withGuard(
  getRolesForHref("/fleet") ?? [],
  FleetLayout,
);

/**
 * DriversLayout wrapped in the sidebar's `/drivers` role list. Same pattern as
 * GuardedFleetLayout: the pathful layout owns the tab bar, child routes render
 * the Drivers / Behaviour / Fatigue AI panels into its Outlet.
 */
const GuardedDriversLayout = withGuard(
  getRolesForHref("/drivers") ?? [],
  DriversLayout,
);

/**
 * DataBundlesLayout wrapped in the sidebar's `/data-bundles` role list. Same
 * pattern as GuardedFleetLayout: the pathful layout owns the header, KPIs,
 * shared dialogs and tab bar; child routes render into its Outlet.
 */
const GuardedDataBundlesLayout = withGuard(
  getRolesForHref("/data-bundles") ?? [],
  DataBundlesLayout,
);

/**
 * ReportsLayout wrapped in the sidebar's `/reports` role list. Pathful layout:
 * the tab bar lives here, `/reports` renders Profit & Loss, and each other
 * tab (`compliance-audit`, `fuel-consumption`, `fleet-utilization`) is its
 * own child route with its own lazy chunk.
 */
const GuardedReportsLayout = withGuard(
  getRolesForHref("/reports") ?? [],
  ReportsLayout,
);

/**
 * IntegrationsLayout wrapped in the sidebar's `/integrations` role list.
 * Pathful layout: outer tab bar (Developer Portal / ERP & WMS) lives here;
 * DeveloperPortalLayout nests inside as a pathless layout so its inner tab
 * bar and shared overview cards mount once for every dev-portal sub-route.
 */
const GuardedIntegrationsLayout = withGuard(
  getRolesForHref("/integrations") ?? [],
  IntegrationsLayout,
);

/**
 * App is a pathless layout route: it owns the provider tower, the AuthGuard
 * and the Outlet. Children therefore keep absolute paths.
 *
 * Which of these need a session is decided by AuthGuard from PUBLIC_ROUTES
 * (features/auth/utils/publicRoutes.ts), not by nesting here.
 *
 * DashboardLayout is a second pathless layout route holding everything that
 * renders the dashboard shell, so the sidebar and top bar mount once instead
 * of per page. Routes outside it — auth, the redirects, the print preview,
 * 404/403 — own their own chrome.
 *
 * `/settings` is the one pathful layout route: SettingsLayout owns the tab bar,
 * each tab is a child route. Tabs are routes, not query params — see the block
 * further down and features/settings/utils/settingsNav.ts.
 *
 * Pages are loaded through react-router's `lazy`, not imported at the top: each
 * becomes its own chunk that arrives when the route is first visited. Eagerly
 * importing all fifty-odd of them put every dashboard, table, chart and map into
 * the initial bundle, so the first paint waited on code for pages nobody had
 * opened. `DashboardLayout` renders the router's pending state while a chunk
 * loads. No `Suspense` boundary is involved — the router owns the wait.
 *
 * `App`, the two layouts, the auth pages, `RoleHomeRedirect` and the status
 * screens stay eager: they are small and on the critical path, and a spinner in
 * place of the login form would be worse than the bytes.
 */
export const router = createBrowserRouter([
  {
    Component: App,
    children: [
      // Auth screens that share the split branding panel. AuthLayout derives
      // the help mode from the pathname, so it wraps them rather than each
      // page rendering the panel itself.
      {
        Component: AuthLayout,
        children: [
          {
            path: "/auth",
            Component: AuthPage,
          },
          {
            path: "/auth/signup",
            Component: SignUpPage,
          },
          {
            path: "/auth/forgot-password",
            Component: ForgotPasswordPage,
          },
        ],
      },

      // These two use their own centred card shell, not the panel.
      {
        path: "/auth/reset-password",
        Component: ResetPasswordPage,
      },
      {
        path: "/auth/invite",
        Component: InvitePage,
      },
      {
        path: "/auth/verify-email",
        Component: VerifyEmailPage,
      },
      {
        path: "/auth/complete-profile",
        Component: CompleteProfilePage,
      },

      {
        path: "/",
        Component: RoleHomeRedirect,
      },
      {
        path: "/not-authorized",
        Component: NotAuthorized,
      },

      // No dashboard shell of their own: a bare redirect, a print-only
      // preview, and a scratch page.
      {
        path: "/subscription-invoices",
        lazy: async () => ({ Component: (await import("@/pages/admin/SubscriptionInvoices")).default }),
      },
      {
        path: "/fleet/pl-statement",
        lazy: async () => ({ Component: (await import("@/pages/admin/VehiclePLStatementPreview")).default }),
      },
      {
        path: "/debug/map",
        lazy: async () => ({ Component: (await import("@/pages/debug/DebugMap")).default }),
      },

      // Aliases for pages that are now a tab on another page. A loader
      // redirect resolves before render, unlike the <Navigate> these replaced.
      {
        path: "/ivr-dashboard",
        loader: () => redirect("/messages?tab=ivr-dashboard"),
      },
      {
        path: "/analytics",
        loader: () => redirect("/fleet?tab=analytics"),
      },
      {
        path: "/maintenance",
        loader: () => redirect("/fleet?tab=maintenance"),
      },
      {
        path: "/fuel",
        loader: () => redirect("/fleet?tab=fuel"),
      },
      {
        path: "/compliance",
        loader: () => redirect("/fleet?tab=compliance"),
      },

      // Everything inside the dashboard shell. Pages render their own content
      // only; the sidebar, top bar and page title come from DashboardLayout.
      //
      // Routes whose href appears in the sidebar are guarded via `guarded()` —
      // the role list is read from `getRolesForHref`, so typing a hidden URL
      // returns /not-authorized instead of rendering. Routes that aren't in
      // the sidebar (onboarding, detail pages, the supervisor tree, help and
      // architecture docs) stay open to any logged-in role, matching today.
      {
        Component: DashboardLayout,
        children: [
          // Onboarding — no sidebar entry, no guard.
          {
            path: "/onboarding",
            lazy: async () => ({ Component: (await import("@/pages/onboarding/SubscriptionOnboarding")).default }),
          },
          {
            path: "/onboarding/kyc",
            lazy: async () => ({ Component: (await import("@/pages/onboarding/KycOnboarding")).default }),
          },
          {
            path: "/onboarding/activate",
            lazy: async () => ({ Component: (await import("@/pages/onboarding/ActivationOnboarding")).default }),
          },
          {
            path: "/onboarding/quick-access",
            lazy: async () => ({ Component: (await import("@/pages/onboarding/WelcomeDashboard")).default }),
          },

          // Role dashboards (each home has a single-role sidebar entry).
          {
            path: "/enterprise",
            lazy: guarded(
              "/enterprise",
              () => import("@/features/dashboard/components/pages/EnterpriseLogisticsDashboard"),
            ),
          },
          {
            path: "/aggregator",
            lazy: guarded(
              "/aggregator",
              () => import("@/features/dashboard/components/pages/AggregatorDashboard"),
            ),
          },
          {
            path: "/owner-operator",
            lazy: guarded(
              "/owner-operator",
              () => import("@/features/dashboard/components/pages/OwnerOperatorDashboard"),
            ),
          },
          {
            // Detail page for the same feature as /owner-operator/vehicles.
            path: "/owner-operator/vehicle/:vehicleId",
            lazy: guardedBy(
              ["OWNER_OPERATOR"],
              () => import("@/pages/owner-operator/OwnerOperatorVehicleDetail"),
            ),
          },
          {
            // Owner-operator alias for FleetManagement, linked from onboarding.
            path: "/owner-operator/vehicles",
            lazy: guardedBy(
              ["OWNER_OPERATOR"],
              () => import("@/pages/owner-operator/OwnerOperatorVehicles"),
            ),
          },
          {
            path: "/owner-operator/documents",
            lazy: guarded(
              "/owner-operator/documents",
              () => import("@/pages/owner-operator/OwnerOperatorDocuments"),
            ),
          },
          {
            // Owner-operator alias for the Jobs page, linked from onboarding.
            path: "/owner-operator/jobs",
            lazy: guardedBy(
              ["OWNER_OPERATOR"],
              () => import("@/pages/owner-operator/OwnerOperatorJobs"),
            ),
          },

          // Tenant Admin / Fleet Provider
          {
            path: "/overview",
            lazy: guarded(
              "/overview",
              () => import("@/features/dashboard/components/pages/TenantAdminDashboard"),
            ),
          },
          // Fleet is a pathful layout route, mirroring /settings: FleetLayout
          // owns the tab bar, each tab is a child route. Financials nests one
          // more pathful layout — FleetFinancialsLayout owns the KPI cards,
          // inner tab bar, config dialog and statement builder; each financials
          // sub-route is one of its children (Overview / Vehicle P&L / Cost
          // Breakdown / Underperforming). See features/fleet/utils/fleetNav.ts
          // and features/fleet/utils/fleetFinancialsNav.ts.
          {
            path: "/fleet",
            Component: GuardedFleetLayout,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/features/fleet/components/pages/VehiclesPage")).default }),
              },
              {
                path: "schedules",
                lazy: async () => ({ Component: (await import("@/features/fleet/components/ui/MaintenanceProfilesTab")).MaintenanceProfilesTab }),
              },
              {
                path: "maintenance",
                lazy: async () => ({ Component: (await import("@/features/fleet/components/ui/MaintenanceTab")).MaintenanceTab }),
              },
              {
                path: "fuel",
                lazy: async () => ({ Component: (await import("@/features/fleet/components/ui/FuelTab")).FuelTab }),
              },
              {
                path: "compliance",
                lazy: async () => ({ Component: (await import("@/features/fleet/components/ui/ComplianceTab")).ComplianceTab }),
              },
              {
                path: "analytics",
                lazy: async () => ({ Component: (await import("@/features/fleet/components/ui/FleetAnalyticsTab")).FleetAnalyticsTab }),
              },
              {
                path: "financials",
                lazy: async () => ({ Component: (await import("@/features/fleet/components/layout/FleetFinancialsLayout")).FleetFinancialsLayout }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({ Component: (await import("@/features/fleet/components/pages/FinancialsOverviewPage")).default }),
                  },
                  {
                    path: "vehicle-pl",
                    lazy: async () => ({ Component: (await import("@/features/fleet/components/pages/FinancialsVehiclePLPage")).default }),
                  },
                  {
                    path: "cost-breakdown",
                    lazy: async () => ({ Component: (await import("@/features/fleet/components/pages/FinancialsCostBreakdownPage")).default }),
                  },
                  {
                    path: "underperforming",
                    lazy: async () => ({ Component: (await import("@/features/fleet/components/pages/FinancialsUnderperformingPage")).default }),
                  },
                ],
              },
            ],
          },
          // /drivers is a pathful layout route: DriversLayout owns the tab
          // bar, each tab is a child route. See design.md § "Tabs are routes,
          // not query params".
          {
            path: "/drivers",
            Component: GuardedDriversLayout,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/features/drivers/components/pages/DriversPage")).default }),
              },
              {
                path: "behaviour",
                lazy: async () => ({ Component: (await import("@/features/drivers/components/pages/BehaviourPage")).default }),
              },
              {
                path: "fatigue-ai",
                lazy: async () => ({ Component: (await import("@/features/drivers/components/pages/FatigueAIPage")).default }),
              },
            ],
          },
          {
            path: "/devices",
            lazy: guarded(
              "/devices",
              () => import("@/features/device/components/pages/DeviceManagementPage"),
            ),
          },
          {
            path: "/sims",
            lazy: guarded(
              "/sims",
              () => import("@/features/sims/components/pages/SIMManagementPage"),
            ),
          },
          // /data-bundles is a pathful layout route: DataBundlesLayout owns the header,
          // KPI cards, alerts, tab bar and shared dialogs; each tab is a child route.
          // See design.md § "Tabs are routes, not query params".
          {
            path: "/data-bundles",
            Component: GuardedDataBundlesLayout,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/features/data-bundle/components/pages/MyBundlesPage")).default }),
              },
              {
                path: "topups",
                lazy: async () => ({ Component: (await import("@/features/data-bundle/components/pages/TransactionHistoryPage")).default }),
              },
              {
                path: "analytics",
                lazy: async () => ({ Component: (await import("@/features/data-bundle/components/pages/AnalyticsPage")).default }),
              },
              {
                path: "rates",
                lazy: async () => ({ Component: (await import("@/features/data-bundle/components/pages/CurrentRatesPage")).default }),
              },
            ],
          },
          {
            path: "/jobs",
            lazy: guarded(
              "/jobs",
              () => import("@/pages/admin/JobDispatch"),
            ),
          },
          {
            path: "/map",
            lazy: guarded(
              "/map",
              () => import("@/features/map/components/pages/LiveMap"),
            ),
          },
          // Messages is a pathful layout route: CommunicationsLayout owns the
          // outer tab bar, each tab is a child route (see design.md "Tabs are
          // routes, not query params"). Email nests one more layout for its
          // Inbox / Provider Settings sub-tabs. Outer guard covers the subtree.
          {
            path: "/messages",
            lazy: guarded(
              "/messages",
              () => import("@/features/communications/components/layout/CommunicationsLayout"),
            ),
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/features/communications/components/pages/CampaignsPage")).CampaignsPage }),
              },
              {
                path: "whatsapp",
                lazy: async () => ({ Component: (await import("@/features/communications/components/ui/WhatsAppBusinessSetup")).WhatsAppBusinessSetup }),
              },
              {
                path: "email",
                lazy: async () => ({ Component: (await import("@/features/communications/components/layout/EmailLayout")).EmailLayout }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({ Component: (await import("@/features/communications/components/ui/EmailInbox")).EmailInbox }),
                  },
                  {
                    path: "settings",
                    lazy: async () => ({ Component: (await import("@/features/communications/components/ui/EmailProviderSettings")).EmailProviderSettings }),
                  },
                ],
              },
              {
                path: "templates",
                lazy: async () => ({ Component: (await import("@/features/communications/components/ui/SMSTemplatesManager")).SMSTemplatesManager }),
              },
              {
                path: "voice",
                lazy: async () => ({ Component: (await import("@/features/communications/components/ui/VoiceIVRManager")).VoiceIVRManager }),
              },
              {
                path: "recordings",
                lazy: async () => ({ Component: (await import("@/features/communications/components/ui/CallRecordingsManager")).CallRecordingsManager }),
              },
              {
                path: "ivr-dashboard",
                lazy: async () => ({ Component: (await import("@/features/communications/components/ui/IVRDashboardTab")).IVRDashboardTab }),
              },
            ],
          },
          {
            path: "/inbox",
            lazy: guarded(
              "/inbox",
              () => import("@/pages/admin/OmnichannelInbox"),
            ),
          },
          {
            path: "/wallet",
            lazy: guarded(
              "/wallet",
              () => import("@/pages/admin/TenantWallet"),
            ),
          },
          {
            path: "/installation",
            lazy: guarded(
              "/installation",
              () => import("@/pages/admin/DeviceInstallation"),
            ),
          },
          // Integrations is a pathful layout route: IntegrationsLayout owns the
          // outer tab bar (Developer Portal / ERP & WMS); DeveloperPortalLayout
          // is a pathless nested layout that owns the inner tab bar and the
          // overview cards, so every dev-portal sub-route (api keys, webhooks,
          // usage, docs, audit) keeps them mounted. `/integrations/docs` nests
          // one more sub-tab layout for the API Reference sections. See
          // features/integration/utils/integrationsNav.ts.
          {
            path: "/integrations",
            Component: GuardedIntegrationsLayout,
            children: [
              {
                lazy: async () => ({ Component: (await import("@/features/integration/components/layout/DeveloperPortalLayout")).DeveloperPortalLayout }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({ Component: (await import("@/components/integrations/ApiKeyManagement")).ApiKeyManagement }),
                  },
                  {
                    path: "webhooks",
                    lazy: async () => ({ Component: (await import("@/components/integrations/WebhookManagementPanel")).WebhookManagementPanel }),
                  },
                  {
                    path: "usage",
                    lazy: async () => ({ Component: (await import("@/components/integrations/ApiUsageAnalytics")).ApiUsageAnalytics }),
                  },
                  {
                    path: "docs",
                    lazy: async () => ({ Component: (await import("@/features/integration/components/layout/ApiDocsLayout")).ApiDocsLayout }),
                    children: [
                      {
                        index: true,
                        lazy: async () => ({ Component: (await import("@/features/integration/components/pages/EndpointsPage")).default }),
                      },
                      {
                        path: "authentication",
                        lazy: async () => ({ Component: (await import("@/features/integration/components/pages/AuthenticationPage")).default }),
                      },
                      {
                        path: "errors",
                        lazy: async () => ({ Component: (await import("@/features/integration/components/pages/ErrorsPage")).default }),
                      },
                      {
                        path: "webhooks-guide",
                        lazy: async () => ({ Component: (await import("@/features/integration/components/pages/WebhookGuidePage")).default }),
                      },
                    ],
                  },
                  {
                    path: "audit",
                    lazy: async () => ({ Component: (await import("@/features/integration/components/pages/AuditPage")).default }),
                  },
                ],
              },
              {
                path: "erp-wms",
                lazy: async () => ({ Component: (await import("@/features/integration/components/pages/ErpWmsPage")).default }),
              },
            ],
          },
          {
            path: "/job-offers",
            lazy: guarded(
              "/job-offers",
              () => import("@/pages/admin/JobOffers"),
            ),
          },
          {
            path: "/reports",
            Component: GuardedReportsLayout,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/features/reports/components/pages/ProfitLossPage")).default }),
              },
              {
                path: "compliance-audit",
                lazy: async () => ({ Component: (await import("@/features/reports/components/pages/ComplianceAuditPage")).default }),
              },
              {
                path: "fuel-consumption",
                lazy: async () => ({ Component: (await import("@/features/reports/components/pages/FuelConsumptionPage")).default }),
              },
              {
                path: "fleet-utilization",
                lazy: async () => ({ Component: (await import("@/features/reports/components/pages/FleetUtilizationPage")).default }),
              },
            ],
          },
          // Payouts & Invoicing is a pathful layout route, mirroring /settings:
          // PayoutsInvoicingLayout owns the tab bar, each tab is a child route.
          // Tab list lives in features/payouts-invoicing/utils/payoutsInvoicingNav.ts.
          //
          // All four tabs inherit the section-level guard (empty `hasPermissions`),
          // so the child routes have no extra wrapper — GuardedPayoutsInvoicingLayout
          // already keeps non-sidebar roles out.
          {
            path: "/waybill-invoices",
            Component: GuardedPayoutsInvoicingLayout,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/features/payouts-invoicing/components/pages/WaybillsPage")).default }),
              },
              {
                path: "invoices",
                lazy: async () => ({ Component: (await import("@/features/payouts-invoicing/components/pages/InvoicesPage")).default }),
              },
              {
                path: "pricing",
                lazy: async () => ({ Component: (await import("@/features/payouts-invoicing/components/pages/PricingRulesPage")).default }),
              },
              {
                path: "settings",
                lazy: async () => ({ Component: (await import("@/features/payouts-invoicing/components/pages/InvoiceSettingsPage")).default }),
              },
            ],
          },
          // Sustainability is a pathful layout route, mirroring /waybill-invoices:
          // SustainabilityLayout owns the header, KPI strip and tab bar; each tab
          // is a child route. Tab list lives in
          // features/sustainability/utils/sustainabilityNav.ts.
          {
            path: "/sustainability",
            Component: GuardedSustainabilityLayout,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/features/sustainability/components/pages/Co2OverviewPage")).default }),
              },
              {
                path: "eco-scores",
                lazy: async () => ({ Component: (await import("@/features/sustainability/components/pages/EcoDrivingPage")).default }),
              },
              {
                path: "ev-fleet",
                lazy: async () => ({ Component: (await import("@/features/sustainability/components/pages/EvFleetPage")).default }),
              },
              {
                path: "targets",
                lazy: async () => ({ Component: (await import("@/features/sustainability/components/pages/TargetsPage")).default }),
              },
            ],
          },
          // Settings is a pathful layout route: SettingsLayout owns the tab bar
          // and the Outlet, one child route per tab. The tab list it renders is
          // features/settings/utils/settingsNav.ts — keep the two in step.
          //
          // Two levels of guarding: the whole subtree is behind the sidebar
          // guard (four tenant admin roles), and each restricted tab wraps its
          // lazy Component with `settingsTabRoles(to)`. A tab with an empty
          // `hasPermissions` skips the wrapper. Subscription nests one more
          // layout — Plan (index) and Invoices — under a sub-tab bar.
          {
            path: "/settings",
            Component: GuardedSettingsLayout,
            children: [
              {
                index: true,
                lazy: guardedBy(
                  settingsTabRoles("/settings") ?? [],
                  () => import("@/features/settings/components/pages/OrganizationSettingsPage"),
                ),
              },
              {
                path: "subscription",
                lazy: guardedBy(
                  settingsTabRoles("/settings/subscription") ?? [],
                  () => import("@/features/settings/components/pages/SubscriptionSettingsPage"),
                ),
                children: [
                  {
                    index: true,
                    lazy: async () => ({ Component: (await import("@/features/settings/components/ui/TenantSubscriptionCard")).TenantSubscriptionCard }),
                  },
                  {
                    path: "invoices",
                    lazy: async () => ({ Component: (await import("@/features/settings/components/ui/SubscriptionInvoicesPanel")).SubscriptionInvoicesPanel }),
                  },
                ],
              },
              {
                path: "storage",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/storage") ?? [],
                  () => import("@/features/settings/components/ui/StoragePanel"),
                  "StoragePanel",
                ),
              },
              {
                path: "invoicing",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/invoicing") ?? [],
                  () => import("@/features/settings/components/ui/TenantInvoiceConfigPanel"),
                  "TenantInvoiceConfigPanel",
                ),
              },
              {
                path: "kyc",
                lazy: guardedBy(
                  settingsTabRoles("/settings/kyc") ?? [],
                  () => import("@/features/settings/components/pages/KycSettingsPage"),
                ),
              },
              {
                path: "fleet",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/fleet") ?? [],
                  () => import("@/features/settings/components/ui/MaintenanceConfigPanel"),
                  "MaintenanceConfigPanel",
                ),
              },
              {
                path: "ai",
                lazy: guardedBy(
                  settingsTabRoles("/settings/ai") ?? [],
                  () => import("@/features/settings/components/pages/AiSettingsPage"),
                ),
              },
              {
                path: "ai-usage",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/ai-usage") ?? [],
                  () => import("@/features/settings/components/ui/AIUsageAnalyticsPanel"),
                  "AIUsageAnalyticsPanel",
                ),
              },
              {
                path: "notifications",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/notifications") ?? [],
                  () => import("@/features/settings/components/ui/NotificationPreferencesPanel"),
                  "NotificationPreferencesPanel",
                ),
              },
              {
                path: "dispatch",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/dispatch") ?? [],
                  () => import("@/features/settings/components/ui/DispatchPreferencesPanel"),
                  "DispatchPreferencesPanel",
                ),
              },
              {
                path: "communication",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/communication") ?? [],
                  () => import("@/features/settings/components/ui/TenantCommunicationSettings"),
                  "TenantCommunicationSettings",
                ),
              },
              {
                path: "users",
                lazy: guardedBy(
                  settingsTabRoles("/settings/users") ?? [],
                  () => import("@/features/settings/components/pages/UsersSettingsPage"),
                ),
              },
              {
                path: "branding",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/branding") ?? [],
                  () => import("@/features/settings/components/ui/TenantBrandingPanel"),
                  "TenantBrandingPanel",
                ),
              },
              {
                path: "integrations",
                lazy: guardedBy(
                  settingsTabRoles("/settings/integrations") ?? [],
                  () => import("@/features/settings/components/pages/IntegrationsSettingsPage"),
                ),
              },
              {
                path: "upgrade",
                lazy: guardedByNamed(
                  settingsTabRoles("/settings/upgrade") ?? [],
                  () => import("@/features/settings/components/ui/UpgradeSettingsPanel"),
                  "UpgradeSettingsPanel",
                ),
              },
            ],
          },

          // Supervisor
          {
            path: "/supervisor",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorDashboard")).default }),
          },
          {
            path: "/supervisor/map",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorLiveMap")).default }),
          },
          {
            path: "/supervisor/dispatch",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorDispatch")).default }),
          },
          {
            path: "/supervisor/drivers",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorDrivers")).default }),
          },
          {
            path: "/supervisor/alerts",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorAlerts")).default }),
          },
          {
            path: "/supervisor/messages",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorMessages")).default }),
          },
          {
            path: "/supervisor/inbox",
            lazy: async () => ({ Component: (await import("@/pages/admin/OmnichannelInbox")).default }),
          },
          {
            path: "/supervisor/reports",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorReports")).default }),
          },
          {
            path: "/supervisor/*",
            lazy: async () => ({ Component: (await import("@/pages/supervisor/SupervisorDashboard")).default }),
          },

          // Dispatcher Portal (independent — do not share with Supervisor/Admin)
          {
            path: "/dispatcher",
            lazy: async () => ({ Component: (await import("@/features/dashboard/components/pages/DispatcherDashboard")).default }),
          },
          {
            path: "/dispatcher/dispatch",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherDispatch")).default }),
          },
          {
            path: "/dispatcher/map",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherLiveMap")).default }),
          },
          {
            path: "/dispatcher/drivers",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherDrivers")).default }),
          },
          {
            path: "/dispatcher/devices",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherDevices")).default }),
          },
          {
            path: "/dispatcher/sims",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherSIMs")).default }),
          },
          {
            path: "/dispatcher/alerts",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherAlerts")).default }),
          },
          {
            path: "/dispatcher/messages",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherMessages")).default }),
          },
          {
            path: "/dispatcher/inbox",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherInbox")).default }),
          },
          {
            path: "/dispatcher/reports",
            lazy: async () => ({ Component: (await import("@/pages/dispatcher/DispatcherReports")).default }),
          },
          {
            path: "/dispatcher/*",
            lazy: async () => ({ Component: (await import("@/features/dashboard/components/pages/DispatcherDashboard")).default }),
          },

          // Help & Support — pathful layout route: HelpLayout owns the tab
          // bar, each tab is a child route ("tabs are routes, not query
          // params", see design.md). Not in the sidebar, so no guard.
          {
            path: "/help",
            lazy: async () => ({ Component: (await import("@/features/help/components/layout/HelpLayout")).HelpLayout }),
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import("@/features/help/components/pages/TicketsPage")).default }),
              },
              {
                path: "report-issue",
                lazy: async () => ({ Component: (await import("@/features/help/components/pages/ReportIssuePage")).default }),
              },
            ],
          },
        ],
      },

      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
