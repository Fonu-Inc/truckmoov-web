import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  DollarSign, Download, FileText, Settings2,
} from "lucide-react";

export type PayoutsInvoicingTab = {
  /** Absolute path, matching the child route in `shared/lib/route.tsx`. */
  to: string;
  /** Tab text. Hidden below `sm`, where only the icon shows. */
  label: string;
  icon: ElementType;
  /** Roles that may see this tab. Empty means every role that reaches the section. */
  hasPermissions: UserRole[];
};

/**
 * The payouts-and-invoicing tab bar, in order. One entry per child route of
 * `/waybill-invoices` — add a route here and in `shared/lib/route.tsx`, same as
 * the sidebar. Empty `hasPermissions` inherits the section-level guard from
 * `sidebarNav`'s `/waybill-invoices` entry.
 */
export const PAYOUTS_INVOICING_TABS: PayoutsInvoicingTab[] = [
  {
    to: "/waybill-invoices", label: "Waybills", icon: FileText, hasPermissions: [],
  },
  {
    to: "/waybill-invoices/invoices", label: "Invoices", icon: Download, hasPermissions: [],
  },
  {
    to: "/waybill-invoices/pricing", label: "Pricing Rules", icon: DollarSign, hasPermissions: [],
  },
  {
    to: "/waybill-invoices/settings", label: "Settings", icon: Settings2, hasPermissions: [],
  },
];

export function canSeeTab(tab: PayoutsInvoicingTab, role?: UserRole): boolean {
  return tab.hasPermissions.length === 0 || (!!role && tab.hasPermissions.includes(role));
}
