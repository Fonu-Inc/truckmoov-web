import type { UserRole } from "@truckmoov/api/auth";

export type SettingsTab = {
  /** Absolute path, matching the child route in `shared/lib/route.tsx`. */
  to: string;
  label: string;
  /** Roles that may see this tab. Empty means every role. */
  hasPermissions: UserRole[];
};

/**
 * The platform settings tab bar, in order. One entry per child route of
 * `/settings` — add a route here and in `shared/lib/route.tsx`, same as the
 * sidebar. Text only: this bar has never had icons.
 *
 * ponytail: `hasPermissions` is empty on every tab today. The list is the seam;
 * fill a row in the day a tab needs locking down, and nothing else changes.
 * Empty means "everyone" — deliberately unlike `sidebarNav.ts`, where a missing
 * role list is a type error so a new nav entry can't default to visible-to-all.
 */
export const SETTINGS_TABS: SettingsTab[] = [
  {
    to: "/settings", label: "General", hasPermissions: [],
  },
  {
    to: "/settings/team", label: "Team", hasPermissions: [],
  },
  {
    to: "/settings/telephony", label: "Telephony", hasPermissions: [],
  },
  {
    to: "/settings/notifications", label: "Notifications", hasPermissions: [],
  },
  {
    to: "/settings/security", label: "Security", hasPermissions: [],
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
