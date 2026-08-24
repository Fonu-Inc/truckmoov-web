import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  BarChart3,
  Bell,
  Bot,
  Building2,
  CreditCard,
  FileCheck,
  HardDrive,
  Palette,
  Plug,
  Radio,
  Receipt,
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
};

/**
 * Tabs limited to the enterprise admin — the only tenant role that owns
 * org-wide configuration. Kept as a constant so route.ts can reuse the same
 * list when guarding the URL.
 */
const ENTERPRISE_ADMIN_ONLY: UserRole[] = ["ENTERPRISE_ADMIN"];

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
  {
    to: "/settings", label: "Organization", icon: Building2, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/subscription", label: "Subscription", icon: CreditCard, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/storage", label: "Storage", icon: HardDrive, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/invoicing", label: "Invoicing", icon: Receipt, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/kyc", label: "KYC", icon: FileCheck, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/fleet", label: "Fleet", icon: Wrench, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/ai", label: "AI Matching", icon: Bot, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/ai-usage", label: "AI Usage", icon: BarChart3, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/notifications", label: "Notifications", icon: Bell, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/dispatch", label: "Dispatch", icon: Radio, hasPermissions: ["DISPATCHER"],
  },
  {
    to: "/settings/communication", label: "Communication", icon: Bell, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/users", label: "Users", icon: Users, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/branding", label: "Branding", icon: Palette, hasPermissions: ENTERPRISE_ADMIN_ONLY,
  },
  {
    to: "/settings/integrations", label: "Connections", icon: Plug, hasPermissions: ENTERPRISE_ADMIN_ONLY,
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
