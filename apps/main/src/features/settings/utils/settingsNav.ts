import type { UserRole } from "@truckmoov/api/auth";
import type { ElementType } from "react";
import {
  BarChart3,
  Bell,
  Bot,
  Building2,
  CreditCard,
  FileCheck,
  FileText,
  HardDrive,
  Palette,
  Plug,
  Receipt,
  Users,
  Wrench,
} from "lucide-react";

export type SettingsTab = {
  /** Absolute path, matching the child route in `shared/lib/route.ts`. */
  to: string;
  /** Tab text. Hidden below `sm`, where only the icon shows. */
  label: string;
  icon: ElementType;
  /** Roles that may see this tab. Empty means every role. */
  hasPermissions: UserRole[];
};

/**
 * The settings tab bar, in order. One entry per child route of `/settings` —
 * add a route here and in `shared/lib/route.ts`, same as the sidebar.
 *
 * ponytail: `hasPermissions` is empty on every tab today. The list is the seam;
 * fill a row in the day a tab needs locking down, and nothing else changes.
 * Empty means "everyone" — deliberately unlike `sidebarNav.ts`, where a missing
 * role list is a type error so a new nav entry can't default to visible-to-all.
 */
export const SETTINGS_TABS: SettingsTab[] = [
  {
    to: "/settings", label: "Organization", icon: Building2, hasPermissions: [],
  },
  {
    to: "/settings/subscription", label: "Subscription", icon: CreditCard, hasPermissions: [],
  },
  {
    to: "/settings/subscription/invoices", label: "Invoices", icon: FileText, hasPermissions: [],
  },
  {
    to: "/settings/storage", label: "Storage", icon: HardDrive, hasPermissions: [],
  },
  {
    to: "/settings/invoicing", label: "Invoicing", icon: Receipt, hasPermissions: [],
  },
  {
    to: "/settings/kyc", label: "KYC", icon: FileCheck, hasPermissions: [],
  },
  {
    to: "/settings/fleet", label: "Fleet", icon: Wrench, hasPermissions: [],
  },
  {
    to: "/settings/ai", label: "AI Matching", icon: Bot, hasPermissions: [],
  },
  {
    to: "/settings/ai-usage", label: "AI Usage", icon: BarChart3, hasPermissions: [],
  },
  {
    to: "/settings/notifications", label: "Notifications", icon: Bell, hasPermissions: [],
  },
  {
    to: "/settings/communication", label: "Communication", icon: Bell, hasPermissions: [],
  },
  {
    to: "/settings/users", label: "Users", icon: Users, hasPermissions: [],
  },
  {
    to: "/settings/branding", label: "Branding", icon: Palette, hasPermissions: [],
  },
  {
    to: "/settings/integrations", label: "Connections", icon: Plug, hasPermissions: [],
  },
];

/**
 * Tab-bar visibility only — not authorization. Typing a hidden tab's URL still
 * renders it, exactly like the sidebar's `hasPermission` (see docs/design.md).
 * Gate anything that matters at the action or query level.
 */
export function canSeeTab(tab: SettingsTab, role?: UserRole): boolean {
  return tab.hasPermissions.length === 0 || (!!role && tab.hasPermissions.includes(role));
}
