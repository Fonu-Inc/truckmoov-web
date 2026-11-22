import type { UserRole } from "@truckmoov/api/auth";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Code2,
  Cpu,
  CreditCard,
  Database,
  Inbox,
  LayoutDashboard,
  Leaf,
  LineChart,
  MapPin,
  Package,
  Receipt,
  Send,
  Settings,
  Truck,
  Users,
  Wifi,
  Wrench,
} from "lucide-react";

export type SidebarNavItem = {
  /** Default nav link text (also the top-bar title). Roles in `labelByRole` override this. */
  label: string;
  /** Sparse per-role overrides. A role not listed here sees `label`. */
  labelByRole?: Partial<Record<UserRole, string>>;
  href: string;
  icon: LucideIcon;
  /** Page owns its own padding — DashboardLayout drops the `p-6` on `<main>`. */
  fullWidth?: boolean;
  /**
   * The page renders its own heading (the design app's in-page `h1` +
   * description), so the top bar shows no title. `label` stays the nav text.
   */
  manualTitle?: boolean;
  /** Roles allowed to see this entry. On a group child, omit to inherit the group's roles. */
  hasPermission?: UserRole[];
};

export type SidebarNavGroup = {
  label: string;
  labelByRole?: Partial<Record<UserRole, string>>;
  icon: LucideIcon;
  items: SidebarNavItem[];
  hasPermission?: UserRole[];
  /** ponytail: coming-soon flag — drop the `disabled: true` on the entry when the feature ships. */
  disabled?: boolean;
};

export type SidebarEntry = SidebarNavItem | SidebarNavGroup;

export function isNavGroup(entry: SidebarEntry): entry is SidebarNavGroup {
  return "items" in entry;
}

/**
 * Every sidebar entry across every role, in one list.
 *
 * `hasPermission` is what decides visibility — a role sees an entry iff its key
 * is listed. One route means one entry, but the label may vary by role via
 * `labelByRole` (e.g. `/jobs` reads as "Jobs" for an enterprise admin and
 * "Dispatch" for a dispatcher). Roles not listed in `labelByRole` see `label`.
 *
 * The resolved label is also the top-bar title (see `matchNavEntry` +
 * `resolveLabel`). A route with no entry here therefore has no top-bar title —
 * that is deliberate: this list is the nav, and pages off the nav (`/help`, the
 * onboarding steps) name themselves in their own body.
 *
 * ponytail: `hasPermission` is required here (optional on the type only so group
 * children can inherit) — a new entry that forgets it fails to compile instead
 * of silently showing up for every role.
 */
export const SIDEBAR_ENTRIES: (SidebarEntry & { hasPermission: UserRole[] })[] = [
  // ─── Overview ──────────────────────────────────────────────────
  {
    label: "Overview", href: "/", icon: LayoutDashboard, manualTitle: true, hasPermission: [
      "ENTERPRISE_ADMIN",
      "OWNER_OPERATOR",
    ],
  },
  {
    label: "Overview", href: "/overview", icon: LayoutDashboard,
    labelByRole: { OPERATIONS_MANAGER: "Fleet Operations" },
    hasPermission: ["OPERATIONS_MANAGER"],
  },
  {
    label: "Logistic Overview", href: "/aggregator", icon: LayoutDashboard, hasPermission: ["AGGREGATOR_ADMIN"],
  },
  // ─── Jobs & dispatch ───────────────────────────────────────────
  {
    label: "Shipments", href: "/jobs", icon: Package, manualTitle: true,
    labelByRole: {
      ENTERPRISE_ADMIN: "Jobs",
      OWNER_OPERATOR: "Jobs",
      DISPATCHER: "Dispatch",
      OPERATIONS_MANAGER: "Dispatch",
    },
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "OWNER_OPERATOR",
      "AGGREGATOR_ADMIN",
      "OPERATIONS_MANAGER",
      "DISPATCHER",
    ],
  },

  // ─── Fleet ─────────────────────────────────────────────────────
  {
    label: "Fleets", href: "/fleet", icon: Truck, manualTitle: true,
    labelByRole: {
      ENTERPRISE_ADMIN: "My Vehicles",
      OWNER_OPERATOR: "My Vehicles",
      OPERATIONS_MANAGER: "Vehicles",
    },
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "AGGREGATOR_ADMIN",
      "OPERATIONS_MANAGER",
      "FINANCE_VIEWER",
      "OWNER_OPERATOR",
    ],
  },

  // ─── Drivers ───────────────────────────────────────────────────
  {
    label: "Drivers", href: "/drivers", icon: Users, manualTitle: true,
    labelByRole: {
      ENTERPRISE_ADMIN: "My Drivers",
      OWNER_OPERATOR: "My Drivers",
    },
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "OWNER_OPERATOR",
      "AGGREGATOR_ADMIN",
      "DISPATCHER",
      "OPERATIONS_MANAGER",
    ],
  },

  // ─── Devices & connectivity ────────────────────────────────────
  {
    label: "Devices", href: "/devices", icon: Cpu,
    labelByRole: {
      ENTERPRISE_ADMIN: "My Devices",
      OWNER_OPERATOR: "My Devices",
    },
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "AGGREGATOR_ADMIN",
      "OWNER_OPERATOR",
      "FINANCE_VIEWER",
      "OPERATIONS_MANAGER",
    ],
  },

  // ─── Map ───────────────────────────────────────────────────────
  {
    label: "Live Tracking", href: "/map", icon: MapPin, fullWidth: true,
    labelByRole: {
      DISPATCHER: "Live Map & Zones",
      OPERATIONS_MANAGER: "Live Map & Zones",
    },
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "AGGREGATOR_ADMIN",
      "DISPATCHER",
      "OWNER_OPERATOR",
    ],
  },

  // ─── Install & bundles ─────────────────────────────────────────
  {
    label: "Installation", href: "/installation", icon: Wrench,
    hasPermission: ["OPERATIONS_MANAGER"],
  },
  {
    label: "IoT SIMS", href: "/sims", icon: Wifi,
    hasPermission: [
      "FINANCE_VIEWER",
      "OPERATIONS_MANAGER",
    ],
  },
  {
    label: "M2M IoT Bundles", href: "/data-bundles", icon: Database,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "AGGREGATOR_ADMIN",
      "OWNER_OPERATOR",
      "OPERATIONS_MANAGER",
    ],
  },
  {
    // ponytail: second /map entry so OPERATIONS_MANAGER gets the map after
    // bundles (demo order) while enterprise/owner-operator keep it before.
    // Same trick as the DISPATCHER Communications group below.
    label: "Live Map & Zones", href: "/map", icon: MapPin, fullWidth: true,
    hasPermission: ["OPERATIONS_MANAGER"],
  },

  // ─── Communications ────────────────────────────────────────────
  {
    label: "Communications",
    icon: Bell,
    items: [
      {
        label: "WhatsApp Setup", href: "/whatsapp", icon: Send,
      },
      {
        label: "Messaging Center", href: "/inbox", icon: Inbox,
      },
    ],
    // Not ENTERPRISE_ADMIN or OWNER_OPERATOR: the design app's sidebars for
    // those roles have no Communications.
    hasPermission: [
      "AGGREGATOR_ADMIN",
      "OPERATIONS_MANAGER",
    ],
  },
  {
    label: "Communications",
    icon: Bell,
    items: [
      {
        label: "Messaging Center", href: "/dispatcher/messages", icon: Send,
      },
      {
        label: "Omnichannel Inbox", href: "/dispatcher/inbox", icon: Inbox,
      },
    ],
    hasPermission: ["DISPATCHER"],
  },

  // ─── Money ─────────────────────────────────────────────────────
  {
    label: "Payouts & Invoicing", href: "/waybill-invoices", icon: Receipt,
    hasPermission: ["AGGREGATOR_ADMIN"],
  },
  {
    label: "Wallet & Billing", href: "/wallet", icon: CreditCard, hasPermission: ["FINANCE_VIEWER"],
  },

  // ─── Reports & analytics ───────────────────────────────────────
  {
    label: "Reports", href: "/reports", icon: BarChart3, manualTitle: true,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "AGGREGATOR_ADMIN",
      "OWNER_OPERATOR",
      "OPERATIONS_MANAGER",
    ],
  },
  {
    label: "Analytics", href: "/analytics", icon: LineChart, manualTitle: true, hasPermission: [
      "ENTERPRISE_ADMIN",
      "AGGREGATOR_ADMIN",
      "OPERATIONS_MANAGER",
      "FINANCE_VIEWER",
      "OWNER_OPERATOR",
    ],
  },
  {
    label: "Billing", href: "/subscription", icon: CreditCard, manualTitle: true,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "OWNER_OPERATOR",
    ],
  },
  {
    label: "Sustainability", href: "/sustainability", icon: Leaf, hasPermission: ["AGGREGATOR_ADMIN"],
  },
  {
    label: "Integrations", href: "/integrations", icon: Code2, hasPermission: ["AGGREGATOR_ADMIN"],
  },
  {
    // TRU-FE-7 § D — Settings is now visible to every tenant role so anyone can
    // manage their own 2FA at /settings/security. Non-admin tabs stay narrow via
    // per-tab `hasPermissions` in settingsNav.ts.
    label: "Organization Settings", href: "/settings", icon: Settings, manualTitle: true,
    labelByRole: {
      ENTERPRISE_ADMIN: "Settings",
      DISPATCHER: "Profile",
      OWNER_OPERATOR: "Settings",
      OPERATIONS_MANAGER: "Profile",
      FINANCE_VIEWER: "Profile",
      AGGREGATOR_ADMIN: "Profile",
    },
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "DISPATCHER",
      "OWNER_OPERATOR",
      "OPERATIONS_MANAGER",
      "FINANCE_VIEWER",
      "AGGREGATOR_ADMIN",
    ],
  },
];

export function resolveLabel(entry: SidebarEntry, role: UserRole | undefined): string {
  return (role && entry.labelByRole?.[role]) || entry.label;
}

const entriesByRole = new Map<UserRole, SidebarEntry[]>();

/**
 * The entries this role may see, in `SIDEBAR_ENTRIES` order. A group whose
 * children are all filtered out drops away with them.
 *
 * ponytail: cached per role and never invalidated — `SIDEBAR_ENTRIES` is a
 * module constant, so the answer for a role cannot change while the tab is
 * open. Seven roles, so the map holds seven arrays at most. The payoff is
 * referential stability: the sidebar's `memo`'d rows never see a new prop
 * object, so navigating re-renders no part of the nav tree.
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
      // A group child omits `hasPermission` to inherit the group's.
      const items = entry.items
        .filter(i => i.hasPermission?.includes(role) ?? true)
        .map(i => (i.labelByRole?.[role] ? {
          ...i, label: resolveLabel(
            i,
            role,
          ),
        } : i));
      const label = resolveLabel(
        entry,
        role,
      );
      const changed = items.length !== entry.items.length
        || items.some((it, idx) => it !== entry.items[idx])
        || label !== entry.label;
      if (items.length) {
        visible.push(changed
          ? {
              ...entry, items, label,
            }
          : entry);
      }
      continue;
    }
    const label = resolveLabel(
      entry,
      role,
    );
    visible.push(label === entry.label ? entry : {
      ...entry, label,
    });
  }

  entriesByRole.set(
    role,
    visible,
  );
  return visible;
}

/**
 * Deepest entry whose href matches this pathname — exact match wins, else the
 * longest href prefix. Group children are matched, groups themselves are not
 * (a group has no route of its own).
 *
 * Permissions are deliberately ignored: this names the page you are on, and
 * whether you may be there is AuthGuard's call, not the top bar's.
 *
 * ponytail: raw href comparison, so the two `?tab=` entries never win and
 * `/fleet` names those pages. Same as before this list owned the title.
 */
/**
 * Every role listed under `href` across the sidebar — union across the
 * top-level entries and any group children that carry their own `hasPermission`
 * override, else the parent group's list. Returned as a deduped array in
 * declaration order.
 *
 * Feeds the URL guard in `shared/lib/route.tsx`: a route whose href is in the
 * sidebar shares the sidebar's role list. Returns `undefined` for hrefs the
 * sidebar doesn't own (aliases, `/`, sub-routes like `/settings/branding`),
 * so callers can decide their own policy — usually "no wrapper needed" or an
 * explicit list.
 */
export function getRolesForHref(href: string): UserRole[] | undefined {
  const roles = new Set<UserRole>();
  let matched = false;
  for (const entry of SIDEBAR_ENTRIES) {
    if (isNavGroup(entry)) {
      for (const item of entry.items) {
        if (item.href !== href)
          continue;
        matched = true;
        for (const r of item.hasPermission ?? entry.hasPermission)
          roles.add(r);
      }
      continue;
    }
    if (entry.href !== href)
      continue;
    matched = true;
    for (const r of entry.hasPermission)
      roles.add(r);
  }
  return matched ? [...roles] : undefined;
}

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
