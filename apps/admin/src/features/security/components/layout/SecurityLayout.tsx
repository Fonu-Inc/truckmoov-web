import { NavLink, Outlet } from "react-router";
import { SECURITY_TABS } from "@/features/security/utils/securityNav";
import { cn } from "@/lib/utils";

/**
 * The platform security shell, mounted as a pathful layout route at `/security`
 * (see `shared/lib/route.tsx`). Tab pages render their own content into the
 * `Outlet`; the bar stays put while each tab's chunk loads.
 *
 * Copy of `SettingsLayout` without role filtering — every `/security` route
 * already sits under `ADMIN_ROLES` at the shell. Same NavLink-not-Radix
 * reasoning: tabs are routes, so anchors, back/forward, middle-click and
 * reload all work; the classes are `TabsTrigger`'s with `data-[state=active]`
 * swapped for `isActive`.
 */
export function SecurityLayout() {
  return (
    <div className="space-y-6">
      <div className="w-full">
        <nav
          aria-label="Security sections"
          // ponytail: horizontal scroll on mobile, wrap on desktop — see
          // SettingsLayout for the same reasoning.
          className="bg-secondary/60 text-muted-foreground flex h-auto w-full gap-1 overflow-x-auto rounded-md p-1 md:flex-wrap md:justify-center md:overflow-visible"
        >
          {SECURITY_TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) => cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ring-offset-background transition-all duration-150",
                "hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
              )}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
