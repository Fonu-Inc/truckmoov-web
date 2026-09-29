import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  CalendarDays, CalendarRange, Route,
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
 * add a route here and in `shared/lib/route.tsx`, same as `analyticsNav.ts`.
 *
 * Empty `hasPermissions` means every role that can already reach `/reports`
 * (the sidebar entry's list is the outer gate).
 */
export const REPORTS_TABS: ReportsTab[] = [
  {
    to: "/reports", label: "Daily Summary", icon: CalendarDays, hasPermissions: [],
  },
  {
    to: "/reports/weekly", label: "Weekly Summary", icon: CalendarRange, hasPermissions: [],
  },
  {
    to: "/reports/vehicle-activity", label: "Vehicle Activity", icon: Route, hasPermissions: [],
  },
];

export function canSeeTab(tab: ReportsTab, role?: UserRole): boolean {
  return tab.hasPermissions.length === 0 || (!!role && tab.hasPermissions.includes(role));
}
