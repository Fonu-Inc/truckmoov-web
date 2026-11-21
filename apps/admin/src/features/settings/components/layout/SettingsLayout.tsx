import {
  NavLink, Outlet,
} from "react-router";
import {
  canSeeTab, SETTINGS_TABS,
} from "@/features/settings/utils/settingsNav";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

/**
 * The platform settings shell, mounted as a pathful layout route at `/settings`
 * (see `shared/lib/route.tsx`), so the tab bar stays put while each tab's chunk
 * loads into the `Outlet`. Tab pages render only their own content.
 *
 * Links, not Radix `Tabs`: every tab is its own route, so the bar is navigation
 * — real anchors, back/forward, middle-click, and a reload no longer throws you
 * back to General, which is what the uncontrolled `Tabs` used to do. The
 * classes are `TabsTrigger`'s, with `data-[state=active]` swapped for
 * `NavLink`'s `isActive`, so the bar looks exactly as it did.
 */
export function SettingsLayout() {
  const role = useAuthStore(s => s.user?.role);

  return (
    <div className="space-y-6">
      <div className="w-full">
        <nav
          aria-label="Settings sections"
          // ponytail: horizontal scroll on mobile is the standard tab-bar
          // pattern (keeps every tab visible, no hidden overflow menu). Desktop
          // still wraps and centers so long tab lists don't horizontal-scroll
          // when they fit.
          className="bg-secondary/60 text-muted-foreground flex h-auto w-full gap-1 overflow-x-auto rounded-md p-1 md:flex-wrap md:justify-center md:overflow-visible"
        >
          {SETTINGS_TABS.filter(tab => canSeeTab(
            tab,
            role,
          )).map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              // `end` on the index tab only ("/settings"), otherwise it'd stay
              // lit on every child route. Non-index tabs prefix-match so parent
              // tabs stay active on any sub-routes they grow.
              end={tab.to === "/settings"}
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
