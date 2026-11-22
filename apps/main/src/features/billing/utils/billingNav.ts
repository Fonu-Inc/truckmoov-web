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
  /** The design app's page-heading description for this tab (the tab label is the title). */
  description: string;
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
    to: "/subscription", label: "Overview", hasPermissions: [], description: "An overview of your billing, active license plan, and related analytics.",
  },
  {
    to: "/subscription/quotations", label: "Quotations", hasPermissions: [], description: "View and manage your quotations.",
  },
  {
    to: "/subscription/invoices", label: "Invoices", hasPermissions: [], description: "View and manage your billing invoices and payment status.",
  },
  {
    to: "/subscription/payments", label: "Payments", hasPermissions: [], description: "Track and review your payment history and transactions.",
  },
];

export function canSeeTab(tab: BillingTab, role?: UserRole): boolean {
  return tab.hasPermissions.length === 0 || (!!role && tab.hasPermissions.includes(role));
}
