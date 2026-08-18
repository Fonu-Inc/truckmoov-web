import type { AuthUser } from "@truckmoov/api/auth";
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
  MapPinned,
  Package,
  Receipt,
  Send,
  Settings,
  Telescope,
  Truck,
  User,
  Users,
  Wifi,
  Wrench,
} from "lucide-react";
import { ROLE_REDIRECT_MAP } from "./authRedirect";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeKey?: string;
};

export type SidebarNavGroup = {
  label: string;
  icon: LucideIcon;
  badgeKey?: string;
  items: SidebarNavItem[];
};

export type SidebarEntry = SidebarNavItem | SidebarNavGroup;

export type SidebarConfig = {
  homeRoute: string;
  entries: SidebarEntry[];
};

export function isNavGroup(entry: SidebarEntry): entry is SidebarNavGroup {
  return "items" in entry;
}

// ─── Enterprise ────────────────────────────────────────────────
const enterpriseEntries: SidebarEntry[] = [
  {
    label: "Logistics Overview", href: "/enterprise", icon: LayoutDashboard,
  },
  {
    label: "Shipments", href: "/admin/jobs", icon: Package,
  },
  {
    label: "Fleet Providers", href: "/admin/fleet", icon: Truck,
  },
  {
    label: "Devices", href: "/admin/devices", icon: Cpu,
  },
  {
    label: "IoT SIMs", href: "/admin/sims", icon: Wifi,
  },
  {
    label: "Data Bundles", href: "/admin/data-bundles", icon: Database,
  },
  {
    label: "Live Tracking", href: "/admin/map", icon: MapPin,
  },
  {
    label: "Communications",
    icon: Bell,
    badgeKey: "messages",
    items: [
      {
        label: "Messaging Center", href: "/admin/messages", icon: Send,
      },
      {
        label: "Omnichannel Inbox", href: "/admin/inbox", icon: Inbox,
      },
    ],
  },
  {
    label: "Reports", href: "/admin/reports", icon: BarChart3,
  },
  {
    label: "Integrations", href: "/admin/integrations", icon: Code2,
  },
  {
    label: "Organization Settings", href: "/admin/settings", icon: Settings,
  },
];

// ─── Fleet Provider ────────────────────────────────────────────
const fleetProviderEntries: SidebarEntry[] = [
  {
    label: "Fleet Operations", href: "/admin", icon: LayoutDashboard,
  },
  {
    label: "Dispatch", href: "/admin/jobs", icon: Package,
  },
  {
    label: "Vehicles", href: "/admin/fleet", icon: Truck,
  },
  {
    label: "Drivers", href: "/admin/drivers", icon: Users,
  },
  {
    label: "Devices", href: "/admin/devices", icon: Cpu,
  },
  {
    label: "Installation", href: "/admin/installation", icon: Wrench,
  },
  {
    label: "IoT SIMs", href: "/admin/sims", icon: Wifi,
  },
  {
    label: "Data Bundles", href: "/admin/data-bundles", icon: Database,
  },
  {
    label: "Live Map & Zones", href: "/admin/map", icon: MapPinned,
  },
  {
    label: "Payouts & Invoicing", href: "/admin/waybill-invoices", icon: Receipt,
  },
  {
    label: "Communications",
    icon: Bell,
    badgeKey: "messages",
    items: [
      {
        label: "Messaging Center", href: "/admin/messages", icon: Send,
      },
      {
        label: "Omnichannel Inbox", href: "/admin/inbox", icon: Inbox,
      },
    ],
  },
  {
    label: "Reports", href: "/admin/reports", icon: FileText,
  },
  {
    label: "Sustainability", href: "/admin/sustainability", icon: Leaf,
  },
  {
    label: "Integrations", href: "/admin/integrations", icon: Code2,
  },
  {
    label: "Organization Settings", href: "/admin/settings", icon: Settings,
  },
];

// ─── Aggregator ────────────────────────────────────────────────
const aggregatorEntries: SidebarEntry[] = [
  {
    label: "Network Overview", href: "/aggregator", icon: LayoutDashboard,
  },
  {
    label: "Job Coordination", href: "/admin/jobs", icon: Package,
  },
  {
    label: "Network Members", href: "/admin/drivers", icon: Users,
  },
  {
    label: "Network Fleet", href: "/admin/fleet", icon: Truck,
  },
  {
    label: "Device Setup Requests", href: "/admin/devices", icon: Cpu,
  },
  {
    label: "Data Bundles", href: "/admin/data-bundles", icon: Database,
  },
  {
    label: "Payouts & Invoicing", href: "/admin/waybill-invoices", icon: Receipt,
  },
  {
    label: "Zones", href: "/admin/map", icon: MapPinned,
  },
  {
    label: "Communications",
    icon: Bell,
    badgeKey: "messages",
    items: [
      {
        label: "Messaging Center", href: "/admin/messages", icon: Send,
      },
      {
        label: "Omnichannel Inbox", href: "/admin/inbox", icon: Inbox,
      },
    ],
  },
  {
    label: "Reports", href: "/admin/reports", icon: BarChart3,
  },
  {
    label: "Sustainability", href: "/admin/sustainability", icon: Leaf,
  },
  {
    label: "Integrations", href: "/admin/integrations", icon: Code2,
  },
  {
    label: "Organization Settings", href: "/admin/settings", icon: Settings,
  },
];

// ─── Owner-Operator ────────────────────────────────────────────
const ownerOperatorEntries: SidebarEntry[] = [
  {
    label: "My Overview", href: "/owner-operator", icon: LayoutDashboard,
  },
  {
    label: "My Jobs", href: "/owner-operator/jobs", icon: Package,
  },
  {
    label: "Job Offers", href: "/admin/job-offers", icon: Inbox, badgeKey: "jobOffers",
  },
  {
    label: "My Vehicles", href: "/owner-operator/vehicles", icon: Truck,
  },
  {
    label: "Devices", href: "/admin/devices", icon: Cpu,
  },
  {
    label: "IoT SIMs", href: "/admin/sims", icon: Wifi,
  },
  {
    label: "Data Bundles", href: "/admin/data-bundles", icon: Database,
  },
  {
    label: "Payouts & Invoicing", href: "/admin/waybill-invoices", icon: Receipt,
  },
  {
    label: "Documents", href: "/owner-operator/documents", icon: FileText,
  },
  {
    label: "Communications",
    icon: Bell,
    badgeKey: "messages",
    items: [
      {
        label: "Messaging Center", href: "/admin/messages", icon: Send,
      },
      {
        label: "Omnichannel Inbox", href: "/admin/inbox", icon: Inbox,
      },
    ],
  },
  {
    label: "Profile", href: "/admin/settings", icon: User,
  },
];

// ─── Operations Manager ────────────────────────────────────────
const operationsManagerSidebar: SidebarConfig = {
  homeRoute: ROLE_REDIRECT_MAP.OPERATIONS_MANAGER!,
  entries: [
    {
      label: "Dashboard", href: "/admin", icon: LayoutDashboard,
    },
    {
      label: "Fleet", href: "/admin/fleet", icon: Truck,
    },
    {
      label: "Live Map", href: "/admin/map", icon: MapPin,
    },
    {
      label: "Drivers", href: "/admin/drivers", icon: Users,
    },
    {
      label: "Devices", href: "/admin/devices", icon: Cpu,
    },
    {
      label: "Installation", href: "/admin/installation", icon: Wrench,
    },
    {
      label: "IoT SIMs Request", href: "/admin/sims", icon: Wifi,
    },
    {
      label: "Jobs", href: "/admin/jobs", icon: Package,
    },
    {
      label: "Analytics", href: "/admin/analytics", icon: BarChart3,
    },
    {
      label: "Communications",
      icon: Bell,
      badgeKey: "messages",
      items: [
        {
          label: "Messaging Center", href: "/admin/messages", icon: Send,
        },
        {
          label: "Omnichannel Inbox", href: "/admin/inbox", icon: Inbox,
        },
      ],
    },
  ],
};

// ─── Dispatcher ────────────────────────────────────────────────
const dispatcherSidebar: SidebarConfig = {
  homeRoute: ROLE_REDIRECT_MAP.DISPATCHER!,
  entries: [
    {
      label: "Operations Center", href: "/dispatcher", icon: LayoutDashboard,
    },
    {
      label: "Dispatch", href: "/dispatcher/dispatch", icon: Telescope,
    },
    {
      label: "Live Map", href: "/dispatcher/map", icon: MapPin,
    },
    {
      label: "Drivers", href: "/dispatcher/drivers", icon: Users,
    },
    {
      label: "Devices", href: "/dispatcher/devices", icon: Cpu,
    },
    {
      label: "SIM Cards", href: "/dispatcher/sims", icon: Wifi,
    },
    {
      label: "Alerts", href: "/dispatcher/alerts", icon: Bell, badge: 3,
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
    },
    {
      label: "Reports", href: "/dispatcher/reports", icon: BarChart3,
    },
  ],
};

// ─── Finance Viewer ────────────────────────────────────────────
const financeViewerSidebar: SidebarConfig = {
  homeRoute: ROLE_REDIRECT_MAP.FINANCE_VIEWER!,
  entries: [
    {
      label: "Dashboard", href: "/admin/analytics", icon: LayoutDashboard,
    },
    {
      label: "Fleet", href: "/admin/fleet", icon: Truck,
    },
    {
      label: "Devices", href: "/admin/devices", icon: Cpu,
    },
    {
      label: "SIM Cards", href: "/admin/sims", icon: Wifi,
    },
    {
      label: "Fuel Costs", href: "/admin/fuel", icon: Gauge,
    },
    {
      label: "Maintenance", href: "/admin/fleet?tab=maintenance", icon: Settings,
    },
    {
      label: "Analytics", href: "/admin/analytics", icon: BarChart3,
    },
    {
      label: "Wallet & Billing", href: "/admin/wallet", icon: CreditCard,
    },
  ],
};

export function getSidebarConfig(user: AuthUser | null): SidebarConfig | null {
  switch (user?.role) {
    case "FLEET_ADMIN":
      return {
        homeRoute: ROLE_REDIRECT_MAP.FLEET_ADMIN!, entries: fleetProviderEntries,
      };
    case "ENTERPRISE_ADMIN":
      return {
        homeRoute: ROLE_REDIRECT_MAP.ENTERPRISE_ADMIN!, entries: enterpriseEntries,
      };
    case "AGGREGATOR_ADMIN":
      return {
        homeRoute: ROLE_REDIRECT_MAP.AGGREGATOR_ADMIN!, entries: aggregatorEntries,
      };
    case "OWNER_OPERATOR":
      return {
        homeRoute: ROLE_REDIRECT_MAP.OWNER_OPERATOR!, entries: ownerOperatorEntries,
      };
    case "OPERATIONS_MANAGER":
      return operationsManagerSidebar;
    case "DISPATCHER":
      return dispatcherSidebar;
    case "FINANCE_VIEWER":
      return financeViewerSidebar;
    default:
      return null;
  }
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
