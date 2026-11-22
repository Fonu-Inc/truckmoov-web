import { Loader2 } from "lucide-react";
import {
  Navigate, NavLink, Outlet, useLocation,
} from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useBillingAccess } from "@/features/billing/hooks/useBillingAccess";
import {
  BILLING_TABS, canSeeTab,
} from "@/features/billing/utils/billingNav";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/layout/PageHeader";

/**
 * The billing shell, mounted as a pathful layout route at `/subscription` (see
 * `shared/lib/route.tsx`), so the tab bar stays put while each tab's chunk
 * loads into the `Outlet`. Tab pages render only their own content.
 *
 * Mirrors `AnalyticsLayout` — same NavLink-as-tab pattern — but carries
 * fleetflow's `SubscriptionPage` TabsList look (`bg-muted/50 rounded-xl`,
 * text-only triggers) for parity.
 */
export function BillingLayout() {
  const role = useAuthStore(s => s.user?.role);
  const { pathname } = useLocation();
  const access = useBillingAccess();
  const visibleTabs = BILLING_TABS.filter(tab => canSeeTab(
    tab,
    role,
  ));

  if (access.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!access.canView) {
    return (
      <Navigate
        to="/not-authorized"
        replace
      />
    );
  }

  // If the index tab (Overview) is hidden for this role, redirect to the
  // first visible tab so /subscription doesn't render an empty Outlet.
  if (pathname === "/subscription" && !canSeeTab(
    BILLING_TABS[0],
    role,
  ) && visibleTabs.length > 0) {
    return (
      <Navigate
        to={visibleTabs[0].to}
        replace
      />
    );
  }

  // The design app: centred text-only tab bar, then the active tab's page
  // heading, then the tab content in its `mt-3` panel.
  const activeTab = visibleTabs.find(tab => tab.to === pathname) ?? visibleTabs[0];
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {visibleTabs.length > 1 && (
          <nav
            aria-label="Billing sections"
            className="items-center justify-center p-1 text-muted-foreground flex w-fit mx-auto h-auto max-w-full flex-wrap bg-muted/50 rounded-xl"
          >
            {visibleTabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end
                className={({ isActive }) => cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150 hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
                )}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        )}
        {activeTab && (
          <PageHeader
            title={activeTab.label}
            description={activeTab.description}
          />
        )}
        <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
