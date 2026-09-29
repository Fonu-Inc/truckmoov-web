import {
  Navigate, NavLink, Outlet, useLocation,
} from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  BILLING_TABS, canSeeTab,
} from "@/features/billing/utils/billingNav";
import { cn } from "@/lib/utils";

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
  const visibleTabs = BILLING_TABS.filter(tab => canSeeTab(
    tab,
    role,
  ));

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

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Your M2M plan, quotations, invoices and payments. Invoices are issued to you by Fleet Pro.</p>

      <div className="space-y-6">
        {visibleTabs.length > 1 && (
          <nav
            aria-label="Billing sections"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-muted/50 p-1 text-muted-foreground"
          >
            {visibleTabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end
                className={({ isActive }) => cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
                  "hover:text-foreground/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
                )}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        )}

        <Outlet />
      </div>
    </div>
  );
}
