import {
  NavLink, Outlet,
} from "react-router";
import { API_DOCS_TABS } from "@/features/integration/utils/integrationsNav";
import { cn } from "@/lib/utils";

/**
 * Sub-tab layout for /integrations/docs — Endpoints (index), Authentication,
 * Errors & Limits, Webhooks. Same NavLink-as-tab pattern as EmailLayout.
 */
export function ApiDocsLayout() {
  return (
    <div className="space-y-4">
      <nav
        aria-label="API Reference sections"
        className="bg-muted/50 text-muted-foreground grid grid-cols-4 gap-1 h-auto rounded-md p-1"
      >
        {API_DOCS_TABS.map(tab => (
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
