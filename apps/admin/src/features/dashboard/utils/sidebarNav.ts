import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  Building2,
  Cpu,
  CreditCard,
  Database,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ShieldHalf,
  Wifi,
} from "lucide-react";

/**
 * ponytail: the admin nav is flat. `apps/main` has collapsible groups and the
 * `SidebarNavGroup` / `isNavGroup` machinery to render them; this app has never
 * used one, so the type does not permit one. Adding a group here means copying
 * that machinery back from main — and until then, a stray `items` array fails to
 * compile instead of silently rendering nothing.
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

/**
 * The three roles that can sign in to the admin app. Exported so route.tsx
 * can gate the whole dashboard shell (and the settings tabs) with the same
 * list the sidebar uses.
 */
export const ADMIN_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "SYSTEM_ADMIN",
  "PLATFORM_ADMIN",
];

/**
 * Every sidebar entry, in one list. `hasPermission` decides visibility — a role
 * sees an entry iff its key is listed.
 *
 * Today every entry lists all three admin roles, so the filter is a no-op; the
 * mechanism is here so narrowing one page to one role is a one-line edit rather
 * than new plumbing.
 *
 * The label is also the top-bar title (see `matchNavEntry`). A route with no
 * entry here has no top-bar title — this list is the nav, and pages off the nav
 * name themselves in their own body.
 *
 * ponytail: `hasPermission` is required here (optional on the type only so group
 * children can inherit) — a new entry that forgets it fails to compile instead
 * of silently showing up for every role.
 */
export const SIDEBAR_ENTRIES: (SidebarNavItem & { hasPermission: UserRole[] })[] = [
  {
    label: "Dashboard", href: "/", icon: LayoutDashboard, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Tenants", href: "/tenants", icon: Building2, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Devices", href: "/devices", icon: Cpu, hasPermission: ADMIN_ROLES,
  },
  {
    label: "IoT SIMs", href: "/sims", icon: Wifi, hasPermission: ADMIN_ROLES,
  },
  {
    label: "M2M IoT Bundles", href: "/data-bundles", icon: Database, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Billing", href: "/subscription", icon: CreditCard, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Security", href: "/security", icon: ShieldHalf, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Compliance & Audit", href: "/compliance-audit", icon: ShieldCheck, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Settings", href: "/settings", icon: Settings, hasPermission: ADMIN_ROLES,
  },
];

const entriesByRole = new Map<UserRole, SidebarNavItem[]>();

/**
 * The entries this role may see, in `SIDEBAR_ENTRIES` order.
 *
 * ponytail: cached per role and never invalidated — `SIDEBAR_ENTRIES` is a
 * module constant, so the answer for a role cannot change while the tab is
 * open. The payoff is referential stability: the sidebar's `memo`'d rows never
 * see a new prop object, so navigating re-renders no part of the nav tree.
 */
export function getEntriesForRole(role: UserRole): SidebarNavItem[] {
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
  for (const item of SIDEBAR_ENTRIES) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.href.length)
        best = item;
    }
  }
  return best;
}
