import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  ArrowUpCircle,
  Bell,
  Building2,
  CreditCard,
  FileCheck,
  FileText,
  HardDrive,
  Palette,
  Plug,
  Radio,
  Receipt,
  ScrollText,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

export type SettingsTab = {
  /** Absolute path, matching the child route in `shared/lib/route.tsx`. */
  to: string;
  /** Tab text. Hidden below `sm`, where only the icon shows. */
  label: string;
  icon: ElementType;
  /** Roles that may see this tab. Empty means every role. */
  hasPermissions: UserRole[];
  /** Routed and guarded, but left off the tab bar. */
  hidden?: boolean;
  /** The design app's page-heading description (the label is the title). */
  description?: string;
};

/**
 * Tabs for the tenant roles that own org-wide configuration — enterprise admin
 * and owner-operator share the same tab set. Kept as a constant so route.ts can
 * reuse the same list when guarding the URL.
 */
const ORG_SETTINGS_ROLES: UserRole[] = [
  "ENTERPRISE_ADMIN",
  "OWNER_OPERATOR",
];

/**
 * The settings tab bar, in order. One entry per child route of `/settings` —
 * add a route here and in `shared/lib/route.tsx`, same as the sidebar.
 *
 * `hasPermissions` is now both the tab-bar filter and the input to the route
 * guard in `shared/lib/route.tsx`: an empty array still means "every role that
 * reaches this app", but a filled one locks the URL too. Invoices is no
 * longer a top-level tab — it lives inside Subscription as a sub-tab.
 */
export const SETTINGS_TABS: SettingsTab[] = [
  // The bar matches the design app: Organization, Storage, Invoicing, Fleet,
  // Notifications, Users, Audit Log. `description` is each tab's page heading.
  {
    to: "/settings", label: "Organization", icon: Building2, hasPermissions: ORG_SETTINGS_ROLES, description: "Manage your organization details and business information.",
  },
  {
    to: "/settings/storage", label: "Storage", icon: HardDrive, hasPermissions: ORG_SETTINGS_ROLES, description: "Review storage usage and manage your stored files.",
  },
  {
    to: "/settings/invoicing", label: "Invoicing", icon: Receipt, hasPermissions: ORG_SETTINGS_ROLES, description: "Configure invoice details, payment terms and billing preferences.",
  },
  {
    to: "/settings/fleet", label: "Fleet", icon: Wrench, hasPermissions: ORG_SETTINGS_ROLES, description: "Configure vehicle maintenance and fleet monitoring preferences.",
  },
  {
    to: "/settings/notifications", label: "Notifications", icon: Bell, hasPermissions: ORG_SETTINGS_ROLES, description: "Manage notification channels and the events you receive alerts for.",
  },
  {
    to: "/settings/users", label: "Users", icon: Users, hasPermissions: ORG_SETTINGS_ROLES, description: "Manage your team members, roles and access permissions.",
  },
  {
    to: "/settings/audit-log", label: "Audit Log", icon: ScrollText, hasPermissions: ORG_SETTINGS_ROLES, description: "Review recorded account activity and changes made by your team.",
  },
  // Routed but off the bar, to match the design app's tab set. Still reached by
  // links (TrialBanner, StoragePanel, authRedirect) and the /settings redirect.
  {
    to: "/settings/documents", label: "Documents", icon: FileText, hasPermissions: ORG_SETTINGS_ROLES, hidden: true,
  },
  {
    to: "/settings/branding", label: "Branding", icon: Palette, hasPermissions: ORG_SETTINGS_ROLES, hidden: true,
  },
  {
    to: "/settings/integrations", label: "Connections", icon: Plug, hasPermissions: ORG_SETTINGS_ROLES, hidden: true,
  },
  {
    to: "/settings/subscription", label: "Subscription", icon: CreditCard, hasPermissions: ORG_SETTINGS_ROLES, hidden: true,
  },
  {
    to: "/settings/kyc", label: "KYC", icon: FileCheck, hasPermissions: ORG_SETTINGS_ROLES, hidden: true,
  },
  {
    to: "/settings/dispatch", label: "Dispatch", icon: Radio, hasPermissions: ["DISPATCHER"], hidden: true,
  },
  {
    to: "/settings/communication", label: "Communication", icon: Bell, hasPermissions: ORG_SETTINGS_ROLES, hidden: true,
  },
  {
    to: "/settings/upgrade", label: "Upgrade", icon: ArrowUpCircle, hasPermissions: ["OWNER_OPERATOR"], hidden: true,
  },
  {
    // TRU-FE-7 § D — per-account 2FA. Empty array = visible to every role.
    to: "/settings/security", label: "Security", icon: ShieldCheck, hasPermissions: [], hidden: true,
  },
];

/**
 * Tab-bar visibility. The same predicate feeds the URL guard in
 * `shared/lib/route.tsx`, so a tab hidden here can't be reached by typing its
 * URL — both are UI/URL gating; backend actions still enforce authorization.
 */
export function canSeeTab(tab: SettingsTab, role?: UserRole): boolean {
  return tab.hasPermissions.length === 0 || (!!role && tab.hasPermissions.includes(role));
}
