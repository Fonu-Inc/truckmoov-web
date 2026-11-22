import type { ElementType } from "react";
import {
  Activity, Brain, ShieldAlert, ShieldCheck, Users, UsersRound,
} from "lucide-react";

export type DriversTab = {
  to: string;
  label: string;
  icon: ElementType;
  end: boolean;
};

// Order, labels and icons follow the design app's tab bar.
export const DRIVERS_TABS: DriversTab[] = [
  {
    to: "/drivers", label: "Drivers", icon: Users, end: true,
  },
  {
    to: "/drivers/violations", label: "Violations", icon: ShieldAlert, end: true,
  },
  {
    to: "/drivers/behaviour", label: "Behavior", icon: Activity, end: true,
  },
  {
    to: "/drivers/fatigue", label: "Fatigue", icon: Brain, end: true,
  },
  {
    to: "/drivers/groups", label: "Driver Groups", icon: UsersRound, end: true,
  },
  {
    to: "/drivers/compliance", label: "Compliance", icon: ShieldCheck, end: true,
  },
];
