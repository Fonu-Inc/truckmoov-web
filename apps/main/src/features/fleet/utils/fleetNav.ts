import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  BarChart3, Fuel, Route, Shield, TrendingUp, Truck, Wrench,
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

export const FLEET_TABS: FleetTab[] = [
  {
    to: "/fleet", label: "Vehicles", icon: Truck, end: true, hiddenFor: ["FINANCE_VIEWER"],
  },
  {
    to: "/fleet/schedules", label: "Trips", icon: Route, end: true, hiddenFor: ["FINANCE_VIEWER"],
  },
  {
    to: "/fleet/maintenance", label: "Maintenance", icon: Wrench, end: true,
  },
  {
    to: "/fleet/fuel", label: "Fuel", icon: Fuel, end: true,
  },
  {
    to: "/fleet/compliance", label: "Compliance", icon: Shield, end: true, hiddenFor: ["FINANCE_VIEWER"],
  },
  {
    to: "/fleet/financials", label: "Financials", icon: TrendingUp, end: false,
  },
  {
    to: "/fleet/analytics", label: "Analytics", icon: BarChart3, end: true,
  },
];

/** Tabs this role may see, in tab-bar order. */
export function getFleetTabsForRole(role: UserRole | undefined): FleetTab[] {
  return FLEET_TABS.filter(t => !role || !t.hiddenFor?.includes(role));
}
