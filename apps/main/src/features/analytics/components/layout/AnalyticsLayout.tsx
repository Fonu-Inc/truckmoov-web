import {
  Navigate, NavLink, Outlet, useLocation,
} from "react-router";
import {
  ANALYTICS_TABS, canSeeTab,
} from "@/features/analytics/utils/analyticsNav";
import { useIsOwnerOperatorAccount } from "@/features/auth/hooks/useOrganizationType";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { cn } from "@/lib/utils";

/**
 * The analytics shell, mounted as a pathful layout route at `/analytics` (see
 * `shared/lib/route.tsx`), so the tab bar stays put while each tab's chunk
 * loads into the `Outlet`. Tab pages render only their own content.
 *
 * Mirrors `SettingsLayout` exactly — same NavLink-as-tab pattern, so URLs
 * are shareable and back/forward works.
 */
export function AnalyticsLayout() {
  const role = useAuthStore(s => s.user?.role);
  const ownerOperatorAccount = useIsOwnerOperatorAccount();
  const { pathname } = useLocation();
  const visibleTabs = ANALYTICS_TABS.filter(tab => canSeeTab(
    tab,
    role,
    ownerOperatorAccount,
  ));
  const fuelTab = ANALYTICS_TABS.find(tab => tab.to === "/analytics/fuel-consumption");
  // A direct link to a tab this account can't see lands on the first one it can.
  if (fuelTab && pathname === fuelTab.to && !canSeeTab(
    fuelTab,
    role,
    ownerOperatorAccount,
  ) && visibleTabs.length > 0) {
    return (
      <Navigate
        to={visibleTabs[0].to}
        replace
      />
    );
  }

  // If the index tab (Profit & Loss) is hidden for this role, redirect to
  // the first visible tab so /analytics doesn't render an empty Outlet.
  if (pathname === "/analytics" && !canSeeTab(
    ANALYTICS_TABS[0],
    role,
    ownerOperatorAccount,
  ) && visibleTabs.length > 0) {
    return (
      <Navigate
        to={visibleTabs[0].to}
        replace
      />
    );
  }

  // The design app's markup: space-y-4 > space-y-4 > [tab bar, mt-3 content].
  // Each tab page renders its own heading inside the content (they differ per tab).
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {visibleTabs.length > 1 && (
          <div className="flex justify-center">
            <nav
              aria-label="Analytics sections"
              className="inline-flex items-center justify-center rounded-xl text-muted-foreground bg-muted/50 p-1 flex-wrap h-auto gap-1"
            >
              {visibleTabs.map(tab => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end
                  className={({ isActive }) => cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150 hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2",
                    isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
