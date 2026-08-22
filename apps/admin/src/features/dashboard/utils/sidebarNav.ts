import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  Bell,
  Building2,
  Cpu,
  CreditCard,
  Database,
  LayoutDashboard,
  Radio,
  Send,
  Settings,
  ShieldCheck,
  ShieldHalf,
  Wifi,
} from "lucide-react";

export type SidebarNavItem = {
  /** Nav link text. Doubles as the top-bar title — a route is called one thing. */
  label: string;
  href: string;
  icon: ElementType;
  badge?: number;
  badgeKey?: string;
  /** Page owns its own padding — DashboardLayout drops the `p-6` on `<main>`. */
  fullWidth?: boolean;
  /** Roles allowed to see this entry. On a group child, omit to inherit the group's roles. */
  hasPermission?: UserRole[];
};

export type SidebarNavGroup = {
  label: string;
  icon: ElementType;
  badgeKey?: string;
  items: SidebarNavItem[];
  hasPermission?: UserRole[];
};

export type SidebarEntry = SidebarNavItem | SidebarNavGroup;

export function isNavGroup(entry: SidebarEntry): entry is SidebarNavGroup {
  return "items" in entry;
}

/** Badge text under the org name in the sidebar. */
export const ORG_TYPE_LABEL = "Platform Admin";

/** The three roles that can sign in to the admin app. */
const ADMIN_ROLES: UserRole[] = [
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
export const SIDEBAR_ENTRIES: (SidebarEntry & { hasPermission: UserRole[] })[] = [
  {
    label: "Overview", href: "/", icon: LayoutDashboard, hasPermission: ADMIN_ROLES,
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
    label: "Data Bundles", href: "/data-bundles", icon: Database, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Simulator", href: "/simulator", icon: Radio, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Channel Providers", href: "/communications", icon: Bell, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Messaging Center", href: "/messaging", icon: Send, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Billing", href: "/billing", icon: CreditCard, hasPermission: ADMIN_ROLES,
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

/**
 * Deepest entry whose href matches this pathname — exact match wins, else the
 * longest href prefix. Group children are matched, groups themselves are not
 * (a group has no route of its own).
 *
 * Permissions are deliberately ignored: this names the page you are on, and
 * whether you may be there is AuthGuard's call, not the top bar's.
 */
export function matchNavEntry(pathname: string): SidebarNavItem | undefined {
  let best: SidebarNavItem | undefined;
  const consider = (item: SidebarNavItem) => {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.href.length)
        best = item;
    }
  };
  for (const entry of SIDEBAR_ENTRIES) {
    if (isNavGroup(entry))
      entry.items.forEach(consider);
    else
      consider(entry);
  }
  return best;
}
