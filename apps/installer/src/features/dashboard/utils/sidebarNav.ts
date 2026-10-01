import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  Bell,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Wrench,
} from "lucide-react";

/**
 * The installer nav is flat — no collapsible groups. The group machinery in
 * `apps/admin` / `apps/main` stayed behind rather than arriving with no caller.
 */
export type SidebarNavItem = {
  /** Nav link text. Doubles as the top-bar title — a route is called one thing. */
  label: string;
  href: string;
  icon: ElementType;
  /** Page owns its own padding — DashboardLayout drops the `p-6` on `<main>`. */
  fullWidth?: boolean;
  /** Roles allowed to see this entry. */
  hasPermission?: UserRole[];
};

export type SidebarEntry = SidebarNavItem;

/**
 * The roles that can sign in to the installer portal. Exported so route.tsx
 * gates the whole dashboard shell with the same list the sidebar uses.
 *
 * ponytail: INSTALLER only. Add SUPER_ADMIN here if support staff ever need to
 * open the portal as a tenant installer — deliberately left out until asked,
 * so a platform admin cannot wander in by typing the URL.
 */
export const INSTALLER_ROLES: UserRole[] = ["INSTALLER"];

/**
 * Every sidebar entry, in one list. `hasPermission` decides visibility — a role
 * sees an entry iff its key is listed.
 *
 * The label is also the top-bar title (see `matchNavEntry`). `/jobs/:jobId` has
 * no entry here on purpose: it is reached by drill-down, so it has no top-bar
 * title and names itself in its own body.
 */
export const SIDEBAR_ENTRIES: (SidebarNavItem & { hasPermission: UserRole[] })[] = [
  {
    label: "Dashboard", href: "/", icon: LayoutDashboard, hasPermission: INSTALLER_ROLES,
  },
  {
    label: "Installation Jobs", href: "/jobs", icon: Wrench, hasPermission: INSTALLER_ROLES,
  },
  {
    label: "Support", href: "/support", icon: LifeBuoy, hasPermission: INSTALLER_ROLES,
  },
  {
    label: "Settings", href: "/settings", icon: Settings, hasPermission: INSTALLER_ROLES,
  },
];

/**
 * Routes that need a top-bar title but no sidebar link — `/notifications` is
 * reached from the header bell's "View all", as on appdemo.
 */
const TITLE_ONLY_ENTRIES: SidebarNavItem[] = [
  {
    label: "Notifications", href: "/notifications", icon: Bell,
  },
];

const entriesByRole = new Map<UserRole, SidebarEntry[]>();

/**
 * The entries this role may see, in `SIDEBAR_ENTRIES` order.
 *
 * Cached per role and never invalidated — `SIDEBAR_ENTRIES` is a module
 * constant, so the answer for a role cannot change while the tab is open. The
 * payoff is referential stability: the sidebar's `memo`'d rows never see a new
 * prop object, so navigating re-renders no part of the nav tree.
 */
export function getEntriesForRole(role: UserRole): SidebarEntry[] {
  const cached = entriesByRole.get(role);
  if (cached)
    return cached;

  const visible = SIDEBAR_ENTRIES.filter(entry => entry.hasPermission.includes(role));
  entriesByRole.set(
    role,
    visible,
  );
  return visible;
}

/**
 * Deepest entry whose href matches this pathname — exact match wins, else the
 * longest href prefix.
 *
 * Permissions are deliberately ignored: this names the page you are on, and
 * whether you may be there is AuthGuard's call, not the top bar's.
 */
export function matchNavEntry(pathname: string): SidebarNavItem | undefined {
  let best: SidebarNavItem | undefined;

  for (const item of [
    ...SIDEBAR_ENTRIES,
    ...TITLE_ONLY_ENTRIES,
  ]) {
    // "/" would prefix-match everything, so the home entry needs an exact hit.
    const matches = item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

    if (matches && (!best || item.href.length > best.href.length))
      best = item;
  }
  return best;
}
