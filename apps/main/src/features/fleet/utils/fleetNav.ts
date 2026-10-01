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
};

export const FLEET_TABS: FleetTab[] = [
  {
    to: "/fleet", label: "Vehicles", icon: Truck, end: true,
  },
  {
    to: "/fleet/schedules", label: "Trips", icon: Route, end: true,
  },
  {
    to: "/fleet/maintenance", label: "Maintenance", icon: Wrench, end: true,
  },
  {
    to: "/fleet/fuel", label: "Fuel", icon: Fuel, end: true,
  },
  {
    to: "/fleet/compliance", label: "Compliance", icon: Shield, end: true,
  },
  {
    to: "/fleet/financials", label: "Financials", icon: TrendingUp, end: false,
  },
  {
    to: "/fleet/analytics", label: "Analytics", icon: BarChart3, end: true,
  },
];
