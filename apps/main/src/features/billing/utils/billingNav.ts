import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";

export type BillingTab = {
  /** Absolute path, matching the child route in `shared/lib/route.tsx`. */
  to: string;
  /** Tab text. */
  label: string;
  /** Optional: fleetflow's billing tabs are text-only. */
  icon?: ElementType;
  /** Roles that may see this tab. Empty means every role reaching /subscription. */
  hasPermissions: UserRole[];
};

/**
 * The billing tab bar, in order. One entry per child route of `/subscription` —
 * add a route here and in `shared/lib/route.tsx`, same as `analyticsNav.ts`.
 *
 * Empty `hasPermissions` means every role that can already reach `/subscription`
 * (the sidebar entry's list is the outer gate).
 */
export const BILLING_TABS: BillingTab[] = [
  {
    to: "/subscription", label: "Overview", hasPermissions: [],
  },
  {
    to: "/subscription/quotations", label: "Quotations", hasPermissions: [],
  },
  {
    to: "/subscription/invoices", label: "Invoices", hasPermissions: [],
  },
  {
    to: "/subscription/payments", label: "Payments", hasPermissions: [],
  },
];

export function canSeeTab(tab: BillingTab, role?: UserRole): boolean {
  return tab.hasPermissions.length === 0 || (!!role && tab.hasPermissions.includes(role));
}
