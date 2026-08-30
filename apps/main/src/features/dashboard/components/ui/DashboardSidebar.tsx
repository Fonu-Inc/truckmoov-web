import type {
  SidebarEntry, SidebarNavGroup, SidebarNavItem,
} from "@/features/dashboard/utils/sidebarNav";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationSettingsQueryOptions } from "@truckmoov/api/auth";
import mtnLogoDark from "@truckmoov/reusables/assets/mtn-logo-dark.svg";
import {
  Avatar, AvatarFallback, AvatarImage,
} from "@truckmoov/reusables/components/shadcn/avatar";
import {
  Building2,
  ChevronDown,
  LogOut,
  Ticket,
  Truck,
} from "lucide-react";
import {
  memo, useState,
} from "react";
import {
  NavLink, useLocation,
} from "react-router";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { getRoleShortLabel } from "@/features/auth/utils/role-label";
import { useSidebarStore } from "@/features/dashboard/stores/sidebarStore";
import {
  getEntriesForRole,
  isNavGroup,
} from "@/features/dashboard/utils/sidebarNav";
import { cn } from "@/lib/utils";

/**
 * Row classes are module constants, not per-render `cn()` calls — a sidebar is
 * ~25 rows and the strings never vary.
 *
 * The left rail is always present as `border-transparent` and only changes
 * colour when active. Toggling `border-l-2` on and off (what this used to do,
 * with `pl-[10px]` / `pl-[38px]` to compensate) changed the row's box metrics
 * on every navigation, so each click cost a layout pass instead of a repaint.
 * `pl-[10px]` + the 2px border is the same 12px as the old `px-3`.
 */
const ROW = "flex items-center gap-3 rounded-md border-l-2 border-transparent py-2.5 pl-[10px] pr-3 text-sm font-medium transition-colors";
const ROW_NESTED = "pl-[38px]";
const ROW_ACTIVE = "border-primary bg-primary/10 text-primary";
const ROW_IDLE = "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const ROW_GROUP = "w-full text-left";
const ICON = "h-[18px] w-[18px] shrink-0";
const FOOTER_ROW = "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";

/** Stable empty array for the pre-auth render, so `navItems` never changes identity. */
const NO_ENTRIES: SidebarEntry[] = [];

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
  item, collapsed, nested = false,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
  nested?: boolean;
}) {
  const Icon = item.icon;

  // ponytail: NavLink matches on pathname only, so an href carrying a query
  // (`/fleet?tab=maintenance`) would light up on plain `/fleet` alongside the
  // real Fleet row. Those rows just never highlight — same as before.
  const idleOnly = item.href.includes("?");

  // ponytail: only "/" needs `end`; every other entry should light up on its
  // sub-routes too (`/security/login-history` → highlights "Security").
  const row = (
    <NavLink
      to={item.href}
      end={item.href === "/"}
      className={idleOnly
        ? cn(
            ROW,
            nested && ROW_NESTED,
            ROW_IDLE,
          )
        : ({ isActive }) => cn(
            ROW,
            nested && ROW_NESTED,
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
 * A collapsible group. The only part of the sidebar that reads the location,
 * and there are one or two of them per role.
 *
 * Open state is derived, not synced: a group whose child route is active opens
 * itself, and a manual toggle takes over from then on. The effect this replaces
 * cost an extra render per navigation and read `expandedGroups` outside its own
 * dependency list.
 */
function NavGroupBase({
  group, collapsed,
}: {
  group: SidebarNavGroup;
  collapsed: boolean;
}) {
  const { pathname } = useLocation();
  const [
    manual,
    setManual,
  ] = useState<boolean | null>(null);
  const Icon = group.icon;

  if (group.disabled) {
    const row = (
      <div
        aria-disabled="true"
        className={cn(
          ROW,
          ROW_GROUP,
          "cursor-not-allowed text-sidebar-foreground/40",
        )}
      >
        <Icon className={ICON} />
        {!collapsed && <span className="flex-1 truncate">{group.label}</span>}
      </div>
    );
    return (
      <Tooltip>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent side="right">
          {collapsed ? `${group.label} — Coming soon` : "Coming soon"}
        </TooltipContent>
      </Tooltip>
    );
  }

  const childActive = group.items.some(
    item => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={group.items[0]?.href ?? "#"}
            className={cn(
              ROW,
              childActive ? ROW_ACTIVE : ROW_IDLE,
            )}
          >
            <Icon className={ICON} />
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">{group.label}</TooltipContent>
      </Tooltip>
    );
  }

  const open = manual ?? childActive;

  return (
    <Collapsible
      open={open}
      onOpenChange={setManual}
    >
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            ROW,
            ROW_GROUP,
            childActive
              ? "bg-primary/10 text-primary"
              : ROW_IDLE,
          )}
        >
          <Icon className={ICON} />
          <span className="flex-1 truncate">{group.label}</span>
          <ChevronDown className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pt-1">
        {group.items.map(item => (
          <NavRow
            key={item.href}
            item={item}
            collapsed={false}
            nested
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

const NavGroup = memo(NavGroupBase);

/**
 * `memo` with no props means the parent `DashboardLayout` re-rendering on every
 * navigation no longer re-renders the sidebar: React bails out on the empty
 * prop comparison. Combined with `NavRow` taking its active state from
 * `NavLink`, a click updates the anchors that changed and nothing else.
 */
function DashboardSidebarBase() {
  const role = useAuthStore(s => s.user?.role);
  const logout = useAuthStore(s => s.logout);
  const collapsed = useSidebarStore(s => s.collapsed);

  // Branding is effectively static for a session — without a staleTime this
  // refetches on every window focus and re-renders the sidebar for nothing.
  const { data: orgSettings } = useQuery({
    ...getOrganizationSettingsQueryOptions(),
    staleTime: 5 * 60 * 1000,
  });
  const branding = orgSettings?.data?.branding;
  const orgName = branding?.organizationName;
  const orgAvatarUrl = branding?.logoUrl ?? "";

  const roleLabel = role ? getRoleShortLabel(role) : null;

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
            <Avatar className="h-10 w-10 rounded-lg">
              <AvatarFallback className="bg-primary shadow-mtn rounded-lg">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold text-sidebar-foreground truncate leading-tight">
                  FleetPro
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                    Powered by
                  </span>
                  <img
                    src={mtnLogoDark}
                    alt="MTN"
                    className="h-3.5 w-auto opacity-70 dark:opacity-100 dark:brightness-0 dark:invert"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Org Info Card */}
        <div className="border-b border-sidebar-border p-3">
          {collapsed
            ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center py-1">
                      <Avatar className="h-9 w-9 rounded-lg">
                        <AvatarImage
                          src={orgAvatarUrl}
                          alt={orgName}
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-lg bg-sidebar-accent">
                          <Building2 className="h-4 w-4 text-sidebar-foreground/60" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {`${orgName ?? "Organization"} · ${roleLabel ?? ""}`}
                  </TooltipContent>
                </Tooltip>
              )
            : (
                <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2.5">
                  <Avatar className="h-9 w-9 shrink-0 rounded-lg">
                    <AvatarImage
                      src={orgAvatarUrl}
                      alt={orgName}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg bg-sidebar-accent">
                      <Building2 className="h-4 w-4 text-sidebar-foreground/60" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-sidebar-foreground leading-tight">
                      {orgName ?? "Organization"}
                    </p>
                    {roleLabel && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary mt-0.5">
                        {roleLabel}
                      </p>
                    )}
                  </div>
                </div>
              )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(entry => (isNavGroup(entry)
            ? (
                <NavGroup
                  key={entry.label}
                  group={entry}
                  collapsed={collapsed}
                />
              )
            : (
                <NavRow
                  key={entry.href}
                  item={entry}
                  collapsed={collapsed}
                />
              )))}
        </nav>

        {/* Footer Section (user moved to top bar) */}
        <div className="border-t border-sidebar-border p-3">
          <div className="space-y-0.5">
            <FooterRow
              collapsed={collapsed}
              label="Ticketing & Support"
            >
              <NavLink
                to="/help"
                className={cn(
                  FOOTER_ROW,
                  "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Ticket className={ICON} />
                {!collapsed && <span>Ticketing & Support</span>}
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
