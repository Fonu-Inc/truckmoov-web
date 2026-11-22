import {
  Navigate, NavLink, Outlet, useLocation,
} from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  canSeeTab, REPORTS_TABS,
} from "@/features/reports/utils/reportsNav";
import { cn } from "@/lib/utils";

/**
 * The reports shell, mounted as a pathful layout route at `/reports` (see
 * `shared/lib/route.tsx`), so the tab bar stays put while each tab's chunk
 * loads into the `Outlet`. Tab pages render only their own content.
 *
 * Mirrors `AnalyticsLayout` — same NavLink-as-tab pattern, so URLs are
 * shareable and back/forward works. Fleetflow's Reports page has nothing
 * shared above its tabs (each tab owns its own trend range), so there is no
 * Outlet context.
 */
export function ReportsLayout() {
  const role = useAuthStore(s => s.user?.role);
  const { pathname } = useLocation();
  const visibleTabs = REPORTS_TABS.filter(tab => canSeeTab(
    tab,
    role,
  ));

  // If the index tab (Daily Summary) is hidden for this role, redirect to
  // the first visible tab so /reports doesn't render an empty Outlet.
  if (pathname === "/reports" && !canSeeTab(
    REPORTS_TABS[0],
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
    <div className="space-y-4">
      {visibleTabs.length > 1 && (
        <div className="flex justify-center">
          <nav
            aria-label="Reports sections"
            className="inline-flex items-center justify-center rounded-xl text-muted-foreground bg-muted/50 p-1 flex-wrap h-auto gap-1"
          >
            {visibleTabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end
                className={({ isActive }) => cn(
                  // fleetflow TabsTrigger base (its ui/tabs.tsx) + the Reports page "gap-2".
                  "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
                  isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
                  "hover:text-foreground/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "gap-2",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Each tab renders its PageHeader then its own `mt-3` content, as the design app does. */}
      <Outlet />
    </div>
  );
}
