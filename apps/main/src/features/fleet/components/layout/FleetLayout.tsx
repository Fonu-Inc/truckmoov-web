import {
  NavLink, Outlet,
} from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { getFleetTabsForRole } from "@/features/fleet/utils/fleetNav";
import { cn } from "@/lib/utils";

// The design app's tab bar (a Radix TabsList), restyled onto route links: each
// tab is still a child route — see docs/design.md § "Tabs are routes, not query params".
const TAB_CLASS = "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150 hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2";
const ACTIVE_CLASS = "bg-background text-foreground shadow-sm border-b-2 border-primary";

/**
 * `/fleet` shell: pathful layout owning the tab bar; each tab page renders its
 * own `PageHeader` (title, description, actions) under it, as the design app does.
 */
export function FleetLayout() {
  const role = useAuthStore(s => s.user?.role);
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <nav
          aria-label="Fleet sections"
          className="inline-flex items-center justify-center rounded-xl p-1 text-muted-foreground bg-muted/50 h-auto max-w-full flex-wrap gap-1"
        >
          {getFleetTabsForRole(role).map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => cn(
                TAB_CLASS,
                isActive && ACTIVE_CLASS,
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
