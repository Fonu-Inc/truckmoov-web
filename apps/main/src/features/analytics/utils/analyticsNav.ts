import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  DollarSign, Fuel, Shield, Truck,
} from "lucide-react";

export type AnalyticsTab = {
  /** Absolute path, matching the child route in `shared/lib/route.tsx`. */
  to: string;
  /** Tab text. Hidden below `sm`, where only the icon shows. */
  label: string;
  icon: ElementType;
  /** Roles that may see this tab. Empty means every role reaching /analytics. */
  hasPermissions: UserRole[];
};

const FLEET_OPERATORS: UserRole[] = [
  "ENTERPRISE_ADMIN",
  "OWNER_OPERATOR",
  "OPERATIONS_MANAGER",
];
const FINANCE_READERS: UserRole[] = [
  "ENTERPRISE_ADMIN",
  "OWNER_OPERATOR",
  "FINANCE_VIEWER",
];

/**
 * The analytics tab bar, in order. One entry per child route of `/analytics` —
 * add a route here and in `shared/lib/route.tsx`, same as `settingsNav.ts`.
 *
 * `hasPermissions` mirrors the roles the report endpoints accept, so a role
 * never sees a tab that would answer 403. Empty means every role that can
 * already reach `/analytics`.
 */
export const ANALYTICS_TABS: AnalyticsTab[] = [
  {
    to: "/analytics", label: "Profit & Loss", icon: DollarSign, hasPermissions: FINANCE_READERS,
  },
  {
    to: "/analytics/compliance-audit", label: "Compliance Audit", icon: Shield, hasPermissions: FLEET_OPERATORS,
  },
  {
    to: "/analytics/fuel-consumption", label: "Fuel Consumption", icon: Fuel, hasPermissions: [
      ...FLEET_OPERATORS,
      "FINANCE_VIEWER",
    ],
  },
  {
    to: "/analytics/fleet-utilization", label: "Fleet Utilization", icon: Truck, hasPermissions: FLEET_OPERATORS,
  },
];

export function canSeeTab(tab: AnalyticsTab, role?: UserRole): boolean {
  return tab.hasPermissions.length === 0 || (!!role && tab.hasPermissions.includes(role));
}
