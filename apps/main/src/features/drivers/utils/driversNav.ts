import type { ElementType } from "react";
import {
  Activity, Brain, Users,
} from "lucide-react";

export type DriversTab = {
  to: string;
  label: string;
  icon: ElementType;
  end: boolean;
};

export const DRIVERS_TABS: DriversTab[] = [
  {
    to: "/drivers", label: "Drivers", icon: Users, end: true,
  },
  {
    to: "/drivers/behaviour", label: "Behaviour", icon: Activity, end: true,
  },
  {
    to: "/drivers/fatigue-ai", label: "Fatigue AI", icon: Brain, end: true,
  },
];
