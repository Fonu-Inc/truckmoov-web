import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  BarChart3, Boxes, Fuel, Route, Shield, TrendingUp, Truck, Wrench,
} from "lucide-react";

export type FleetTab = {
  to: string;
  label: string;
  icon: ElementType;
  /** Passed to NavLink. Financials matches its children too, so it's not `end`. */
  end: boolean;
  /**
   * Roles that can't see/open this tab. ponytail: deny-list, since every other
   * `/fleet` role sees every tab; switch to an allow-list if that stops holding.
   */
  hiddenFor?: UserRole[];
};

/** Every /fleet role except FINANCE_VIEWER — the design app has no Analytics tab. */
const ANALYTICS_HIDDEN_FOR: UserRole[] = [
  "ENTERPRISE_ADMIN",
  "AGGREGATOR_ADMIN",
  "OPERATIONS_MANAGER",
  "OWNER_OPERATOR",
];

// Order and icons follow the design app's tab bar: Vehicles, Fleets, Trips,
// Violations, Maintenance, Fuel, Compliance, Financials.
export const FLEET_TABS: FleetTab[] = [
  {
    to: "/fleet", label: "Vehicles", icon: Truck, end: true, hiddenFor: ["FINANCE_VIEWER"],
  },
  {
    to: "/fleet/fleets", label: "Fleets", icon: Boxes, end: true, hiddenFor: ["FINANCE_VIEWER"],
  },
  {
    to: "/fleet/schedules", label: "Trips", icon: Route, end: true, hiddenFor: ["FINANCE_VIEWER"],
  },
  {
    to: "/fleet/violations", label: "Violations", icon: Shield, end: true, hiddenFor: ["FINANCE_VIEWER"],
  },
  {
    to: "/fleet/maintenance", label: "Maintenance", icon: Wrench, end: true,
  },
  {
    // Hidden for Owner-Operators as in the design app; fuel is manual records only (TD-1).
    to: "/fleet/fuel", label: "Fuel", icon: Fuel, end: true, hiddenFor: ["OWNER_OPERATOR"],
  },
  {
    to: "/fleet/compliance", label: "Compliance", icon: Shield, end: true, hiddenFor: ["FINANCE_VIEWER"],
  },
  {
    to: "/fleet/financials", label: "Financials", icon: TrendingUp, end: false,
  },
  {
    // Kept for FINANCE_VIEWER, whose default fleet tab it is.
    to: "/fleet/analytics", label: "Analytics", icon: BarChart3, end: true, hiddenFor: ANALYTICS_HIDDEN_FOR,
  },
];

/** Tabs this role may see, in tab-bar order. */
export function getFleetTabsForRole(role: UserRole | undefined): FleetTab[] {
  return FLEET_TABS.filter(t => !role || !t.hiddenFor?.includes(role));
}
