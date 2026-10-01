import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  Bell,
  Building2,
  Cpu,
  CreditCard,
  Database,
  Inbox,
  LayoutDashboard,
  Send,
  Settings,
  ShieldCheck,
  ShieldHalf,
  Wifi,
  Wrench,
} from "lucide-react";

/**
 * The nav is mostly flat, with one collapsible group ("Communications"). The
 * group machinery — `SidebarNavGroup` / `isNavGroup` here, `NavGroup` in
 * `DashboardSidebar` — was copied from `apps/main` when that group landed.
 *
 * ponytail: only the group branch came across. Main also carries
 * `labelByRole` / `resolveLabel` for per-role naming; admin has no per-role
 * labels, so that stayed behind rather than arriving with no caller.
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
  /** Permission key the signed-in user must hold, on top of the role check. */
  requiredPermission?: string;
};

/** A collapsible parent row. Has no href of its own — it opens onto `items`. */
export type SidebarNavGroup = {
  label: string;
  icon: ElementType;
  items: SidebarNavItem[];
  /** Roles allowed to see this group. A child may omit its own and inherit. */
  hasPermission?: UserRole[];
};

export type SidebarEntry = SidebarNavItem | SidebarNavGroup;

export function isNavGroup(entry: SidebarEntry): entry is SidebarNavGroup {
  return "items" in entry;
}

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
export const SIDEBAR_ENTRIES: (SidebarEntry & { hasPermission: UserRole[] })[] = [
  {
    label: "Dashboard", href: "/", icon: LayoutDashboard, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Tenants", href: "/tenants", icon: Building2, hasPermission: ADMIN_ROLES,
  },
  {
    label: "Installers", href: "/installers", icon: Wrench, hasPermission: ADMIN_ROLES,
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
    label: "Communications",
    icon: Bell,
    items: [
      {
        label: "WhatsApp Setup", href: "/whatsapp", icon: Send,
      },
      {
        label: "Messaging Center", href: "/inbox", icon: Inbox, requiredPermission: "admin.messaging.read",
      },
    ],
    hasPermission: ADMIN_ROLES,
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

export function filterByPermission(entries: SidebarEntry[], permissions: string[]): SidebarEntry[] {
  const allowed = (item: SidebarNavItem) =>
    !item.requiredPermission || permissions.includes(item.requiredPermission);
  const visible: SidebarEntry[] = [];
  for (const entry of entries) {
    if (!isNavGroup(entry)) {
      if (allowed(entry))
        visible.push(entry);
      continue;
    }
    const items = entry.items.filter(allowed);
    if (items.length === entry.items.length)
      visible.push(entry);
    else if (items.length)
      visible.push({ ...entry, items });
  }
  return visible;
}

const entriesByRole = new Map<UserRole, SidebarEntry[]>();

/**
 * The entries this role may see, in `SIDEBAR_ENTRIES` order.
 *
 * ponytail: cached per role and never invalidated — `SIDEBAR_ENTRIES` is a
 * module constant, so the answer for a role cannot change while the tab is
 * open. The payoff is referential stability: the sidebar's `memo`'d rows never
 * see a new prop object, so navigating re-renders no part of the nav tree.
 */
export function getEntriesForRole(role: UserRole): SidebarEntry[] {
  const cached = entriesByRole.get(role);
  if (cached)
    return cached;

  const visible: SidebarEntry[] = [];
  for (const entry of SIDEBAR_ENTRIES) {
    if (!entry.hasPermission.includes(role))
      continue;

    if (isNavGroup(entry)) {
      // A child omitting `hasPermission` inherits the group's, which already
      // passed above. A group whose children all filter out is dropped.
      const items = entry.items.filter(i => i.hasPermission?.includes(role) ?? true);
      if (items.length) {
        visible.push(items.length === entry.items.length
          ? entry
          : {
              ...entry, items,
            });
      }
      continue;
    }

    visible.push(entry);
  }

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

  // Only leaves carry an href, so a group contributes its children, not itself.
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
