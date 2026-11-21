import {
  NavLink, Outlet, useLocation,
} from "react-router";
import {
  canSeeTab, SETTINGS_TABS, settingsHeading,
} from "@/features/settings/utils/settingsNav";
import { cn } from "@/lib/utils";
import { PageTitle } from "@/shared/components/layout/PageTitle";
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
 *
 * The active tab's heading renders under the bar (fleetflow's `TAB_HEADINGS`;
 * `/settings` is `manualTitle` in sidebarNav). Tab pages put their Save button
 * in `<PageActions>`, which portals it into this heading's action slot — only
 * where fleetflow has one (Platform Features and Display Defaults save on change).
 */
export function SettingsLayout() {
  const role = useAuthStore(s => s.user?.role);
  const { pathname } = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex w-full justify-center">
        <nav
          aria-label="Settings sections"
          // Fleetflow's `TabsList` (`inline-flex h-10 … rounded-xl bg-secondary/60
          // p-1 text-muted-foreground` merged with the page's `flex h-auto w-fit
          // max-w-full flex-wrap justify-center gap-1 p-1`).
          className="flex h-auto w-fit max-w-full flex-wrap items-center justify-center gap-1 rounded-xl bg-secondary/60 p-1 text-muted-foreground"
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
              // Fleetflow's `TabsTrigger` with the page's `px-2.5 py-1 text-xs`.
              className={({ isActive }) => cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium ring-offset-background transition-all duration-150",
                isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
                "hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <PageTitle {...settingsHeading(pathname)} />

      <Outlet />
    </div>
  );
}
