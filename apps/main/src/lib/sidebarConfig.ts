import type {
  AuthUser, UserRole,
} from "@truckmoov/api/auth";
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
import { ROLE_REDIRECT_MAP } from "@/features/auth/utils/authRedirect";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeKey?: string;
  /** Roles allowed to see this entry. On a group child, omit to inherit the group's roles. */
  hasPermission?: UserRole[];
};

export type SidebarNavGroup = {
  label: string;
  icon: LucideIcon;
  badgeKey?: string;
  items: SidebarNavItem[];
  hasPermission?: UserRole[];
};

export type SidebarEntry = SidebarNavItem | SidebarNavGroup;

export type SidebarConfig = {
  homeRoute: string;
  entries: SidebarEntry[];
};

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
 * ponytail: `hasPermission` is required here (optional on the type only so group
 * children can inherit) — a new entry that forgets it fails to compile instead
 * of silently showing up for every role.
 */
const SIDEBAR_ENTRIES: (SidebarEntry & { hasPermission: UserRole[] })[] = [
  // ─── Overview ──────────────────────────────────────────────────
  {
    label: "Logistics Overview", href: "/enterprise", icon: LayoutDashboard, hasPermission: ["ENTERPRISE_ADMIN"],
  },
  {
    label: "Dashboard", href: "/overview", icon: LayoutDashboard, hasPermission: [
      "FLEET_ADMIN",
      "OPERATIONS_MANAGER",
    ],
  },
  {
    label: "Network Overview", href: "/aggregator", icon: LayoutDashboard, hasPermission: ["AGGREGATOR_ADMIN"],
  },
  {
    label: "My Overview", href: "/owner-operator", icon: LayoutDashboard, hasPermission: ["OWNER_OPERATOR"],
  },
  {
    label: "Operations Center", href: "/dispatcher", icon: LayoutDashboard, hasPermission: ["DISPATCHER"],
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
    label: "Job Offers", href: "/job-offers", icon: Inbox, badgeKey: "jobOffers", hasPermission: ["OWNER_OPERATOR"],
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
    label: "Live Map", href: "/map", icon: MapPin,
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
    label: "Alerts", href: "/dispatcher/alerts", icon: Bell, badge: 3, hasPermission: ["DISPATCHER"],
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
    badgeKey: "messages",
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
    badgeKey: "messages",
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

/** Entries this role may see. Groups whose children are all hidden drop out. */
export function getEntriesForRole(role: UserRole): SidebarEntry[] {
  const visible: SidebarEntry[] = [];
  for (const entry of SIDEBAR_ENTRIES) {
    if (!entry.hasPermission.includes(role))
      continue;
    if (!isNavGroup(entry)) {
      visible.push(entry);
      continue;
    }
    const items = entry.items.filter(i => i.hasPermission?.includes(role) ?? true);
    if (items.length > 0) {
      visible.push({
        ...entry, items,
      });
    }
  }
  return visible;
}

export function getSidebarConfig(user: AuthUser | null): SidebarConfig | null {
  const homeRoute = user ? ROLE_REDIRECT_MAP[user.role] : undefined;
  if (!homeRoute)
    return null;
  return {
    homeRoute, entries: getEntriesForRole(user!.role),
  };
}

export function getAllowedRoutes(config: SidebarConfig): string[] {
  const routes: string[] = [config.homeRoute];
  for (const entry of config.entries) {
    if (isNavGroup(entry)) {
      routes.push(...entry.items.map(i => i.href));
    }
    else {
      routes.push(entry.href);
    }
  }
  return routes;
}
