import {
  NavLink, Outlet,
} from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { getFleetTabsForRole } from "@/features/fleet/utils/fleetNav";
import { cn } from "@/lib/utils";

/**
 * `/fleet` shell: pathful layout owning the tab bar, children fill the Outlet.
 * Mirrors SettingsLayout — see docs/design.md § "Tabs are routes, not query params".
 */
export function FleetLayout() {
  const role = useAuthStore(s => s.user?.role);
  return (
    <div className="space-y-6">
      <div className="flex w-full justify-center">
        <nav
          aria-label="Fleet sections"
          className="bg-muted/50 text-muted-foreground flex flex-wrap justify-center gap-1 h-auto rounded-md p-1"
        >
          {getFleetTabsForRole(role).map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
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
      </div>

      <Outlet />
    </div>
  );
}
