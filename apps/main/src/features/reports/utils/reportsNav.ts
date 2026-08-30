import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  DollarSign, Fuel, Shield, Truck,
} from "lucide-react";

export type ReportsTab = {
  /** Absolute path, matching the child route in `shared/lib/route.tsx`. */
  to: string;
  /** Tab text. Hidden below `sm`, where only the icon shows. */
  label: string;
  icon: ElementType;
  /** Roles that may see this tab. Empty means every role reaching /reports. */
  hasPermissions: UserRole[];
};

/**
 * The reports tab bar, in order. One entry per child route of `/reports` —
 * add a route here and in `shared/lib/route.tsx`, same as `settingsNav.ts`.
 *
 * Empty `hasPermissions` means every role that can already reach `/reports`
 * (the sidebar entry's list is the outer gate), matching how Settings tabs
 * default to "all of Settings' roles".
 */
export const REPORTS_TABS: ReportsTab[] = [
  {
    to: "/reports", label: "Profit & Loss", icon: DollarSign, hasPermissions: [],
  },
  {
    to: "/reports/compliance-audit", label: "Compliance Audit", icon: Shield, hasPermissions: [],
  },
  {
    to: "/reports/fuel-consumption", label: "Fuel Consumption", icon: Fuel, hasPermissions: [],
  },
  {
    to: "/reports/fleet-utilization", label: "Fleet Utilization", icon: Truck, hasPermissions: [],
  },
];

export function canSeeTab(tab: ReportsTab, role?: UserRole): boolean {
  return tab.hasPermissions.length === 0 || (!!role && tab.hasPermissions.includes(role));
}
