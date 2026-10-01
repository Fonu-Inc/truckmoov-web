import type {
  SidebarEntry, SidebarNavItem,
} from "@/features/dashboard/utils/sidebarNav";
import mtnLogoDark from "@truckmoov/reusables/assets/mtn-logo-dark.svg";
import {
  Building2,
  LogOut,
  Truck,
} from "lucide-react";
import {
  memo, useEffect,
} from "react";
import {
  NavLink, useLocation,
} from "react-router";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/shadcn/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { useSidebarStore } from "@/features/dashboard/stores/sidebarStore";
import { getEntriesForRole } from "@/features/dashboard/utils/sidebarNav";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/shared/hooks/useIsMobile";
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
const NO_ENTRIES: SidebarEntry[] = [];

function NavRowBase({
  item, collapsed,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  // ponytail: only "/" needs `end`; every other entry should light up on its
  // sub-routes too (`/jobs/FL-1024` → highlights "Installation Jobs").
  const row = (
    <NavLink
      to={item.href}
      end={item.href === "/"}
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
      {/* ponytail: `asChild` composes className via string concat, so passing a
          render-prop function to NavLink through it stringifies the function
          into the DOM (breaks styling + hitboxes). Wrap the NavLink in a span
          so the Slot clones the span, and the function stays inside. */}
      <TooltipTrigger asChild><span className="block">{row}</span></TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

const NavRow = memo(NavRowBase);

/**
 * The nav content itself — logo, identity, entries, footer. Rendered inside
 * either the desktop fixed `<aside>` or the mobile `Sheet`. Kept as one
 * function so both paths render identical markup and adding a nav item is
 * still a one-file edit.
 */
function SidebarBody({
  collapsed,
  navItems,
  role,
  onLogout,
}: {
  collapsed: boolean;
  navItems: SidebarEntry[];
  role: string | undefined;
  onLogout: () => void;
}) {
  return (
    <>
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

      {!collapsed && role && (
        <div className="mx-3 mt-3 flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-transparent ring-2 ring-primary">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            {/* ponytail: static app-identity strings, not signed-in user info
                (mirrors the installer sidebar at :8080/installer). The block is a rail,
                not a profile card — the header owns the identity avatar. */}
            <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
              Installer Workspace
            </p>
            <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wide text-primary">
              Installer
            </p>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map(entry => (
          <NavRow
            key={entry.href}
            item={entry}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="space-y-0.5">
          <FooterRow
            collapsed={collapsed}
            label="Sign Out"
          >
            <button
              onClick={onLogout}
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
    </>
  );
}

/**
 * `memo` with no props means the parent `DashboardLayout` re-rendering on every
 * navigation no longer re-renders the sidebar: React bails out on the empty
 * prop comparison. Combined with `NavRow` taking its active state from
 * `NavLink`, a click updates the anchors that changed and nothing else — this
 * component reads no location at all on desktop.
 *
 * Mobile branch: renders a `Sheet` opened via `useSidebarStore.openMobile()`
 * from the header, closes on every route change (a nav click should not leave
 * the drawer covering the page it just navigated to).
 */
function DashboardSidebarBase() {
  const role = useAuthStore(s => s.user?.role);
  const logout = useAuthStore(s => s.logout);
  const collapsed = useSidebarStore(s => s.collapsed);
  const mobileOpen = useSidebarStore(s => s.mobileOpen);
  const closeMobile = useSidebarStore(s => s.closeMobile);
  const isMobile = useIsMobile();
  const { pathname } = useLocation();

  const navItems = role ? getEntriesForRole(role) : NO_ENTRIES;

  // Auto-close the drawer on navigation. Only wired when mobile — desktop
  // never opens it, so nothing to close.
  useEffect(
    () => {
      if (isMobile && mobileOpen)
        closeMobile();
    },
    [pathname],
  );

  if (isMobile) {
    return (
      <Sheet
        open={mobileOpen}
        onOpenChange={o => (o ? undefined : closeMobile())}
      >
        <SheetContent
          side="left"
          className="w-64 border-r border-sidebar-border bg-sidebar p-0 [&>button]:text-sidebar-foreground"
        >
          {/* Required by Radix Dialog for a11y — the logo header inside
              SidebarBody is decorative, so give screen readers a real title. */}
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <TooltipProvider delayDuration={300}>
            <div className="flex h-full flex-col">
              <SidebarBody
                collapsed={false}
                navItems={navItems}
                role={role}
                onLogout={logout}
              />
            </div>
          </TooltipProvider>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <SidebarBody
          collapsed={collapsed}
          navItems={navItems}
          role={role}
          onLogout={logout}
        />
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
