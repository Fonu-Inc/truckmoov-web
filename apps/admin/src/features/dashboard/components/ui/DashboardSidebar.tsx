import type { SidebarNavItem } from "@/features/dashboard/utils/sidebarNav";
import mtnLogoDark from "@truckmoov/reusables/assets/mtn-logo-dark.svg";
import {
  Headphones,
  LogOut,
  Truck,
} from "lucide-react";
import { memo } from "react";
import { NavLink } from "react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { useSidebarStore } from "@/features/dashboard/stores/sidebarStore";
import { getEntriesForRole } from "@/features/dashboard/utils/sidebarNav";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

/**
 * Row classes are module constants, not per-render `cn()` calls — the strings
 * never vary.
 *
 * The left rail is always present as `border-transparent` and only changes
 * colour when active. Toggling `border-l-2` on and off (what this used to do,
 * with `pl-[10px]` to compensate) changed the row's box metrics on every
 * navigation, so each click cost a layout pass instead of a repaint.
 * `pl-[10px]` + the 2px border is the same 12px as the old `px-3`.
 */
const ROW = "flex items-center gap-3 rounded-md border-l-2 border-transparent py-2.5 pl-[10px] pr-3 text-sm font-medium transition-colors";
const ROW_ACTIVE = "border-primary bg-primary/10 text-primary";
const ROW_IDLE = "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const ICON = "h-[18px] w-[18px] shrink-0";
const FOOTER_ROW = "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";

/** Stable empty array for the pre-auth render, so `navItems` never changes identity. */
const NO_ENTRIES: SidebarNavItem[] = [];

/**
 * One nav row.
 *
 * Active state comes from `NavLink`'s own render prop rather than a
 * `useLocation()` compare in the sidebar, so a navigation re-renders the two
 * anchors whose state changed instead of the whole sidebar tree. The icon
 * inherits the row's colour through `currentColor` — it needs no active class
 * of its own.
 */
function NavRowBase({
  item, collapsed,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const row = (
    <NavLink
      to={item.href}
      end
      className={({ isActive }) => cn(
        ROW,
        isActive ? ROW_ACTIVE : ROW_IDLE,
      )}
    >
      <Icon className={ICON} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
    </NavLink>
  );

  if (!collapsed)
    return row;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

const NavRow = memo(NavRowBase);

/**
 * `memo` with no props means the parent `DashboardLayout` re-rendering on every
 * navigation no longer re-renders the sidebar: React bails out on the empty
 * prop comparison. Combined with `NavRow` taking its active state from
 * `NavLink`, a click updates the anchors that changed and nothing else — this
 * component reads no location at all.
 */
function DashboardSidebarBase() {
  const role = useAuthStore(s => s.user?.role);
  const logout = useAuthStore(s => s.logout);
  const collapsed = useSidebarStore(s => s.collapsed);

  // No `useMemo`: `getEntriesForRole` caches per role, so this is already a
  // stable array — memoising a cache lookup buys nothing.
  const navItems = role ? getEntriesForRole(role) : NO_ENTRIES;

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar",
          collapsed ? "w-20" : "w-64",
        )}
      >
        {/* Logo Header */}
        <div className="flex min-h-16 items-center border-b border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary shadow-mtn">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold text-sidebar-foreground truncate leading-tight">
                  FleetPro
                  {" "}
                  <span className="text-primary">Enterprise</span>
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                    Powered by
                  </span>
                  <img
                    src={mtnLogoDark}
                    alt="MTN"
                    className="h-3.5 w-auto dark:brightness-0 dark:invert"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(item => (
            <NavRow
              key={item.href}
              item={item}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Footer Section (user moved to top bar) */}
        <div className="border-t border-sidebar-border p-3">
          <div className="space-y-0.5">
            <FooterRow
              collapsed={collapsed}
              label="Support & Incident"
            >
              <NavLink
                to="/support"
                className={cn(
                  FOOTER_ROW,
                  "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Headphones className={ICON} />
                {!collapsed && <span>Support & Incident</span>}
              </NavLink>
            </FooterRow>
            <FooterRow
              collapsed={collapsed}
              label="Sign Out"
            >
              <button
                onClick={logout}
                className={cn(
                  FOOTER_ROW,
                  "text-destructive/80 hover:bg-destructive/10 hover:text-destructive",
                )}
              >
                <LogOut className={ICON} />
                {!collapsed && <span>Sign Out</span>}
              </button>
            </FooterRow>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export const DashboardSidebar = memo(DashboardSidebarBase);

/**
 * Adds the collapsed-mode tooltip and nothing else, so the two footer rows
 * don't each need their own expanded/collapsed branch.
 */
function FooterRow({
  collapsed, label, children,
}: {
  collapsed: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (!collapsed)
    return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
