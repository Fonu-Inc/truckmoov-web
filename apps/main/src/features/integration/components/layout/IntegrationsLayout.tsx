import {
  NavLink, Outlet, useLocation,
} from "react-router";
import { OUTER_TABS } from "@/features/integration/utils/integrationsNav";
import { cn } from "@/lib/utils";

/**
 * Pathful layout for /integrations. Owns the page heading and the outer tab
 * bar (Developer Portal / ERP & WMS); each child route renders into <Outlet />.
 * Mirrors CommunicationsLayout's NavLink-as-tab pattern so back/forward,
 * middle-click and deep links all work.
 *
 * The outer tabs use a location-derived `isActive`: /integrations/erp-wms is
 * the only ERP branch, everything else is Developer Portal. Plain `end: false`
 * on `/integrations` would light BOTH tabs on the ERP URL because that path
 * still starts with `/integrations`.
 */
export function IntegrationsLayout() {
  const { pathname } = useLocation();
  const isErpBranch = pathname.startsWith("/integrations/erp-wms");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Manage API keys, webhooks, ERP/WMS connections, and external integrations
        </p>
      </div>

      <nav
        aria-label="Integrations sections"
        className="bg-muted/50 text-muted-foreground flex flex-wrap gap-1 h-auto rounded-md p-1 justify-center"
      >
        {OUTER_TABS.map((tab) => {
          const isActive = tab.to === "/integrations/erp-wms" ? isErpBranch : !isErpBranch;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={cn(
                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
                "hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
