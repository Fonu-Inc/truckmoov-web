import {
  NavLink, Outlet,
} from "react-router";
import { OUTER_TABS } from "@/features/communications/utils/communicationsNav";
import { cn } from "@/lib/utils";

/**
 * Pathful layout for /messages. Owns the outer tab bar; each child route
 * renders into <Outlet />. Mirrors SettingsLayout's NavLink-as-tab pattern
 * so back/forward, middle-click and deep links all work.
 */
export default function CommunicationsLayout() {
  return (
    <div className="space-y-6">
      <nav
        aria-label="Communications sections"
        className="bg-muted/50 text-muted-foreground flex flex-wrap gap-1 h-auto rounded-md p-1"
      >
        {OUTER_TABS.map(tab => (
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

      <Outlet />
    </div>
  );
}
