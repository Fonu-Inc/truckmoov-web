import type { UserRole } from "@truckmoov/api/auth";

export type SettingsTab = {
  /** Absolute path, matching the child route in `shared/lib/route.tsx`. */
  to: string;
  label: string;
  /** Heading rendered under the tab bar — fleetflow's `TAB_HEADINGS`. */
  title: string;
  description: string;
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
    to: "/settings", label: "My Profile",
    title: "My Profile",
    description: "View and manage your personal account information and profile details.",
    hasPermissions: [],
  },
  {
    to: "/settings/platform-profile", label: "Platform Profile",
    title: "Platform Profile",
    description: "Manage the platform's general information, business details, and organisational identity.",
    hasPermissions: [],
  },
  {
    to: "/settings/features", label: "Platform Features",
    title: "Platform Features",
    description: "Configure and manage the features and capabilities available across the FleetPro platform.",
    hasPermissions: [],
  },
  {
    to: "/settings/display", label: "Display Defaults",
    title: "Display Default",
    description: "Manage the platform's default display settings and interface preferences.",
    hasPermissions: [],
  },
  {
    to: "/settings/team", label: "Team & Access",
    title: "Team and Access",
    description: "Manage platform team members, user roles, permissions, and access privileges.",
    hasPermissions: [],
  },
  {
    to: "/settings/notifications", label: "Notifications",
    title: "Notifications",
    description: "Configure notification preferences and manage how platform updates and alerts are delivered.",
    hasPermissions: [],
  },
  {
    to: "/settings/support", label: "Support Preferences",
    title: "Support Preferences",
    description: "Manage support options, communication preferences, and customer assistance settings.",
    hasPermissions: [],
  },
];

/**
 * Heading for the Telephony routes, which sit off the bar (fleetflow has no
 * heading for them — they're hidden there).
 */
export const TELEPHONY_HEADING = {
  title: "Telephony",
  description: "Manage voice calling, phone numbers, sender IDs and telephony spend.",
};

/**
 * The heading for the current settings route: the matching tab (longest
 * prefix, so `/settings` only matches exactly), Telephony, or My Profile.
 */
export function settingsHeading(pathname: string): {
  title: string; description: string;
} {
  if (pathname.startsWith("/settings/telephony"))
    return TELEPHONY_HEADING;
  const tab = SETTINGS_TABS.filter(t => t.to !== "/settings" && pathname.startsWith(t.to))[0] ?? SETTINGS_TABS[0];
  return {
    title: tab.title, description: tab.description,
  };
}

/**
 * Tab-bar visibility only — not authorization. Typing a hidden tab's URL still
 * renders it, exactly like the sidebar's `hasPermission` (see docs/design.md).
 * Gate anything that matters at the action or query level.
 */
export function canSeeTab(tab: SettingsTab, role?: UserRole): boolean {
  return tab.hasPermissions.length === 0 || (!!role && tab.hasPermissions.includes(role));
}
