import {
  Navigate, NavLink, Outlet, useLocation,
} from "react-router";
import {
  canSeeTab, SETTINGS_TABS,
} from "@/features/settings/utils/settingsNav";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

/**
 * The settings shell, mounted as a pathful layout route at `/settings` (see
 * `shared/lib/route.tsx`), so the tab bar stays put while each tab's chunk
 * loads into the `Outlet`. Tab pages render only their own content.
 *
 * Links, not Radix `Tabs`: every tab is its own route, so the bar is navigation
 * — real anchors, back/forward, middle-click, and no `aria-controls` pointing
 * at panels that no longer exist. The classes are `TabsTrigger`'s, with
 * `data-[state=active]` swapped for `NavLink`'s `isActive`, so the bar looks
 * exactly as it did when these were tabs.
 */
export function SettingsLayout() {
  const role = useAuthStore(s => s.user?.role);
  const { pathname } = useLocation();
  const visibleTabs = SETTINGS_TABS.filter(tab => canSeeTab(
    tab,
    role,
  ));

  // Organization is enterprise-admin-only, but the sidebar routes several
  // other roles to /settings. Send them to their first visible tab instead
  // of the empty Outlet the index route would render. `visibleTabs` is
  // non-empty in practice — sidebar gating keeps roles with no settings at
  // all off /settings — but if it ever is, RequireRole above catches it.
  if (pathname === "/settings" && !canSeeTab(
    SETTINGS_TABS[0],
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
          aria-label="Settings sections"
          className="bg-muted/50 text-muted-foreground flex flex-wrap gap-1 h-auto rounded-md p-1"
        >
          {visibleTabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              // Every settings route is a leaf, so nothing wants prefix matching:
              // without `end`, /settings and /settings/subscription would both
              // stay lit on their children.
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
