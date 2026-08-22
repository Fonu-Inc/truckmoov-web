import type { UserRole } from "@truckmoov/api/auth";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Code2,
  Cpu,
  CreditCard,
  Database,
  FileText,
  Gauge,
  Inbox,
  LayoutDashboard,
  Leaf,
  MapPin,
  Package,
  Receipt,
  Send,
  Settings,
  Telescope,
  Truck,
  Users,
  Wifi,
  Wrench,
} from "lucide-react";

export type SidebarNavItem = {
  /** Nav link text. Doubles as the top-bar title — a route is called one thing. */
  label: string;
  href: string;
  icon: LucideIcon;
  /** Page owns its own padding — DashboardLayout drops the `p-6` on `<main>`. */
  fullWidth?: boolean;
  /** Roles allowed to see this entry. On a group child, omit to inherit the group's roles. */
  hasPermission?: UserRole[];
};

export type SidebarNavGroup = {
  label: string;
  icon: LucideIcon;
  items: SidebarNavItem[];
  hasPermission?: UserRole[];
};

export type SidebarEntry = SidebarNavItem | SidebarNavGroup;

export function isNavGroup(entry: SidebarEntry): entry is SidebarNavGroup {
  return "items" in entry;
}

/**
 * Every sidebar entry across every role, in one list.
 *
 * `hasPermission` is what decides visibility — a role sees an entry iff its key
 * is listed. One route means one entry with one label: a page is called the same
 * thing for everybody who can reach it, so `/fleet` is "Fleet" whether you
 * are a fleet provider or an aggregator.
 *
 * The label is also the top-bar title (see `matchNavEntry`). A route with no
 * entry here therefore has no top-bar title — that is deliberate: this list is
 * the nav, and pages off the nav (`/help`, `/architecture`, the onboarding
 * steps, the legacy `/supervisor/*` portal) name themselves in their own body.
 *
 * ponytail: `hasPermission` is required here (optional on the type only so group
 * children can inherit) — a new entry that forgets it fails to compile instead
 * of silently showing up for every role.
 */
export const SIDEBAR_ENTRIES: (SidebarEntry & { hasPermission: UserRole[] })[] = [
  // ─── Overview ──────────────────────────────────────────────────
  {
    label: "Overview", href: "/enterprise", icon: LayoutDashboard, hasPermission: ["ENTERPRISE_ADMIN"],
  },
  {
    label: "Overview", href: "/overview", icon: LayoutDashboard, hasPermission: [
      "FLEET_ADMIN",
      "OPERATIONS_MANAGER",
    ],
  },
  {
    label: "Overview", href: "/aggregator", icon: LayoutDashboard, hasPermission: ["AGGREGATOR_ADMIN"],
  },
  {
    label: "Overview", href: "/owner-operator", icon: LayoutDashboard, hasPermission: ["OWNER_OPERATOR"],
  },
  {
    label: "Overview", href: "/dispatcher", icon: LayoutDashboard, hasPermission: ["DISPATCHER"],
  },

  // ─── Jobs & dispatch ───────────────────────────────────────────
  {
    label: "Jobs", href: "/jobs", icon: Package,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
      "OPERATIONS_MANAGER",
    ],
  },
  {
    label: "My Jobs", href: "/owner-operator/jobs", icon: Package, hasPermission: ["OWNER_OPERATOR"],
  },
  {
    label: "Job Offers", href: "/job-offers", icon: Inbox, hasPermission: ["OWNER_OPERATOR"],
  },
  {
    label: "Dispatch", href: "/dispatcher/dispatch", icon: Telescope, hasPermission: ["DISPATCHER"],
  },

  // ─── Fleet ─────────────────────────────────────────────────────
  {
    label: "Fleet", href: "/fleet", icon: Truck,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
      "OPERATIONS_MANAGER",
      "FINANCE_VIEWER",
    ],
  },
  {
    label: "My Vehicles", href: "/owner-operator/vehicles", icon: Truck, hasPermission: ["OWNER_OPERATOR"],
  },

  // ─── Drivers ───────────────────────────────────────────────────
  {
    label: "Drivers", href: "/drivers", icon: Users,
    hasPermission: [
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
      "OPERATIONS_MANAGER",
    ],
  },
  {
    label: "Drivers", href: "/dispatcher/drivers", icon: Users, hasPermission: ["DISPATCHER"],
  },

  // ─── Devices & connectivity ────────────────────────────────────
  {
    label: "Devices", href: "/devices", icon: Cpu,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
      "OWNER_OPERATOR",
      "OPERATIONS_MANAGER",
      "FINANCE_VIEWER",
    ],
  },
  {
    label: "Devices", href: "/dispatcher/devices", icon: Cpu, hasPermission: ["DISPATCHER"],
  },
  {
    label: "Installation", href: "/installation", icon: Wrench, hasPermission: [
      "FLEET_ADMIN",
      "OPERATIONS_MANAGER",
    ],
  },
  {
    label: "SIM Cards", href: "/sims", icon: Wifi,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "FLEET_ADMIN",
      "OWNER_OPERATOR",
      "OPERATIONS_MANAGER",
      "FINANCE_VIEWER",
    ],
  },
  {
    label: "SIM Cards", href: "/dispatcher/sims", icon: Wifi, hasPermission: ["DISPATCHER"],
  },
  {
    label: "Data Bundles", href: "/data-bundles", icon: Database,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
      "OWNER_OPERATOR",
    ],
  },

  // ─── Map ───────────────────────────────────────────────────────
  {
    label: "Live Map", href: "/map", icon: MapPin, fullWidth: true,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
      "OPERATIONS_MANAGER",
    ],
  },
  {
    label: "Live Map", href: "/dispatcher/map", icon: MapPin, hasPermission: ["DISPATCHER"],
  },

  // ─── Money ─────────────────────────────────────────────────────
  {
    label: "Payouts & Invoicing", href: "/waybill-invoices", icon: Receipt,
    hasPermission: [
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
      "OWNER_OPERATOR",
    ],
  },
  {
    label: "Fuel Costs", href: "/fuel", icon: Gauge, hasPermission: ["FINANCE_VIEWER"],
  },
  {
    label: "Maintenance", href: "/fleet?tab=maintenance", icon: Settings, hasPermission: ["FINANCE_VIEWER"],
  },
  {
    label: "Wallet & Billing", href: "/wallet", icon: CreditCard, hasPermission: ["FINANCE_VIEWER"],
  },

  // ─── Documents & alerts ────────────────────────────────────────
  {
    label: "Documents", href: "/owner-operator/documents", icon: FileText, hasPermission: ["OWNER_OPERATOR"],
  },
  {
    label: "Alerts", href: "/dispatcher/alerts", icon: Bell, hasPermission: ["DISPATCHER"],
  },

  // ─── Analytics ─────────────────────────────────────────────────
  {
    label: "Analytics", href: "/analytics", icon: BarChart3, hasPermission: [
      "OPERATIONS_MANAGER",
      "FINANCE_VIEWER",
    ],
  },

  // ─── Communications ────────────────────────────────────────────
  {
    label: "Communications",
    icon: Bell,
    items: [
      {
        label: "Messaging Center", href: "/messages", icon: Send,
      },
      {
        label: "Omnichannel Inbox", href: "/inbox", icon: Inbox,
      },
    ],
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
      "OWNER_OPERATOR",
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

  // ─── Reports & settings ────────────────────────────────────────
  {
    label: "Reports", href: "/reports", icon: BarChart3,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
    ],
  },
  {
    label: "Reports", href: "/dispatcher/reports", icon: BarChart3, hasPermission: ["DISPATCHER"],
  },
  {
    label: "Sustainability", href: "/sustainability", icon: Leaf, hasPermission: [
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
    ],
  },
  {
    label: "Integrations", href: "/integrations", icon: Code2,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
    ],
  },
  {
    label: "Settings", href: "/settings", icon: Settings,
    hasPermission: [
      "ENTERPRISE_ADMIN",
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
      "OWNER_OPERATOR",
    ],
  },
];

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
 * longest href prefix. Group children are matched, groups themselves are not
 * (a group has no route of its own).
 *
 * Permissions are deliberately ignored: this names the page you are on, and
 * whether you may be there is AuthGuard's call, not the top bar's.
 *
 * ponytail: raw href comparison, so the two `?tab=` entries never win and
 * `/fleet` names those pages. Same as before this list owned the title.
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
