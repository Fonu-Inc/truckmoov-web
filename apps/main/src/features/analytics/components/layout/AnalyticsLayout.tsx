import {
  Navigate, NavLink, Outlet, useLocation,
} from "react-router";
import {
  ANALYTICS_TABS, canSeeTab,
} from "@/features/analytics/utils/analyticsNav";
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
  const { pathname } = useLocation();
  const visibleTabs = ANALYTICS_TABS.filter(tab => canSeeTab(
    tab,
    role,
  ));

  // If the index tab (Profit & Loss) is hidden for this role, redirect to
  // the first visible tab so /analytics doesn't render an empty Outlet.
  if (pathname === "/analytics" && !canSeeTab(
    ANALYTICS_TABS[0],
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
      {visibleTabs.length > 1 && (
        <nav
          aria-label="Analytics sections"
          className="bg-muted/50 text-muted-foreground flex flex-wrap gap-1 h-auto rounded-md p-1 justify-center"
        >
          {visibleTabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) => cn(
                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
                "hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <Outlet />
    </div>
  );
}
