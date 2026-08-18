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
  label: string;
  href: string;
  icon: ElementType;
  badge?: number;
  badgeKey?: string;
};

export type SidebarNavGroup = {
  label: string;
  icon: ElementType;
  badgeKey?: string;
  items: SidebarNavItem[];
};

export type SidebarEntry = SidebarNavItem | SidebarNavGroup;

export type SidebarConfig = {
  orgTypeLabel: string;
  homeRoute: string;
  entries: SidebarEntry[];
};

export function isNavGroup(entry: SidebarEntry): entry is SidebarNavGroup {
  return "items" in entry;
}

const platformAdminSidebar: SidebarConfig = {
  orgTypeLabel: "Platform Admin",
  homeRoute: "/",
  entries: [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Tenants",
      href: "/tenants",
      icon: Building2,
    },
    {
      label: "Devices",
      href: "/devices",
      icon: Cpu,
    },
    {
      label: "IoT SIMs",
      href: "/sims",
      icon: Wifi,
    },
    {
      label: "Data Bundles",
      href: "/data-bundles",
      icon: Database,
    },
    {
      label: "Simulator",
      href: "/simulator",
      icon: Radio,
    },
    {
      label: "Channel Providers",
      href: "/communications",
      icon: Bell,
    },
    {
      label: "Messaging Center",
      href: "/messaging",
      icon: Send,
    },
    {
      label: "Billing",
      href: "/billing",
      icon: CreditCard,
    },
    {
      label: "Security",
      href: "/security",
      icon: ShieldHalf,
    },
    {
      label: "Compliance & Audit",
      href: "/compliance-audit",
      icon: ShieldCheck,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ],
};

export function getSidebarConfig(): SidebarConfig {
  return platformAdminSidebar;
}
