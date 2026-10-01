export type SecurityTab = {
  /** Absolute path, matching the child route in `shared/lib/route.tsx`. */
  to: string;
  label: string;
};

/**
 * The platform security tab bar, in order. One entry per child route of
 * `/security` — add a route here and in `shared/lib/route.tsx`. Text only,
 * no icons, mirroring `settingsNav.ts`.
 *
 * ponytail: no per-tab role filtering. Every `/security` route sits under
 * `ADMIN_ROLES` via `GuardedDashboardLayout`; add a `hasPermissions` field
 * the day a tab needs finer gating.
 */
export const SECURITY_TABS: SecurityTab[] = [
  {
    to: "/security", label: "Overview",
  },
  {
    to: "/security/login-history", label: "Login History",
  },
  {
    to: "/security/failed-attempts", label: "Failed Attempts",
  },
  {
    to: "/security/notifications", label: "Notifications",
  },
  {
    to: "/security/events", label: "Security Events",
  },
  {
    to: "/security/sim-audit", label: "SIM Audit",
  },
];
