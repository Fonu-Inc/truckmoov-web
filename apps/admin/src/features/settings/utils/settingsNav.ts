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
 * sidebar. Text only: this bar has never had icons. Labels and order are
 * fleetflow's `PlatformSettings` tabs.
 *
 * Telephony (`/settings/telephony/*`) is deliberately off the bar — its routes
 * and components stay, reachable by URL, as in fleetflow. `/settings/security`
 * redirects to My Profile, where two-factor now lives.
 *
 * ponytail: `hasPermissions` is empty on every tab today. The list is the seam;
 * fill a row in the day a tab needs locking down, and nothing else changes.
 * Empty means "everyone" — deliberately unlike `sidebarNav.ts`, where a missing
 * role list is a type error so a new nav entry can't default to visible-to-all.
 */
export const SETTINGS_TABS: SettingsTab[] = [
  {
    to: "/settings", label: "My Profile", hasPermissions: [],
  },
  {
    to: "/settings/platform-profile", label: "Platform Profile", hasPermissions: [],
  },
  {
    to: "/settings/features", label: "Platform Features", hasPermissions: [],
  },
  {
    to: "/settings/display", label: "Display Defaults", hasPermissions: [],
  },
  {
    to: "/settings/team", label: "Team & Access", hasPermissions: [],
  },
  {
    to: "/settings/notifications", label: "Notifications", hasPermissions: [],
  },
  {
    to: "/settings/support", label: "Support Preferences", hasPermissions: [],
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
