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
 * (see `shared/lib/route.ts`), so the tab bar stays put while each tab's chunk
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
          className="bg-secondary/60 text-muted-foreground flex h-auto w-full flex-wrap justify-center gap-1 rounded-md p-1"
        >
          {SETTINGS_TABS.filter(tab => canSeeTab(
            tab,
            role,
          )).map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              // Every settings route is a leaf, so nothing wants prefix
              // matching: without `end`, /settings would stay lit everywhere.
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
