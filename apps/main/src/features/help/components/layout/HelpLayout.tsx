import {
  NavLink, Outlet,
} from "react-router";
import { HELP_TABS } from "@/features/help/utils/helpNav";
import { cn } from "@/lib/utils";

export function HelpLayout() {
  return (
    <div className="space-y-6">
      {/* ponytail: label-only tabs, mirrors the fleetflow-pro reference at
          :8080/help. Icons dropped because 8080's TabsList renders text only. */}
      <nav
        aria-label="Help sections"
        className="bg-muted/50 text-muted-foreground flex flex-wrap gap-1 h-auto rounded-md p-1 justify-center"
      >
        {HELP_TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) => cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
              "hover:text-foreground/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive && "bg-background text-foreground shadow-sm",
            )}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
