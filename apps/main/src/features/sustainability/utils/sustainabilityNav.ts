import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  BarChart3, Target, Users, Zap,
} from "lucide-react";

export type SustainabilityTab = {
  /** Absolute path, matching the child route in `shared/lib/route.tsx`. */
  to: string;
  /** Tab text. Hidden below `sm`, where only the icon shows. */
  label: string;
  icon: ElementType;
  /** Roles that may see this tab. Empty means every role that reaches the section. */
  hasPermissions: UserRole[];
};

/**
 * The sustainability tab bar, in order. One entry per child route of
 * `/sustainability`. Empty `hasPermissions` inherits the section-level guard.
 */
export const SUSTAINABILITY_TABS: SustainabilityTab[] = [
  {
    to: "/sustainability", label: "CO₂ Overview", icon: BarChart3, hasPermissions: [],
  },
  {
    to: "/sustainability/eco-scores", label: "Eco-Driving", icon: Users, hasPermissions: [],
  },
  {
    to: "/sustainability/ev-fleet", label: "EV Fleet", icon: Zap, hasPermissions: [],
  },
  {
    to: "/sustainability/targets", label: "Targets", icon: Target, hasPermissions: [],
  },
];

export function canSeeTab(tab: SustainabilityTab, role?: UserRole): boolean {
  return tab.hasPermissions.length === 0 || (!!role && tab.hasPermissions.includes(role));
}
