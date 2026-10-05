/**
 * Admin SPA route → catalog permission keys (same keys the APIs use via
 * @Requires / @OnResource). Deep links fail closed when the signed-in user
 * lacks the key — see route.tsx guardedByPermission.
 *
 * Server remains the real gate; this only stops chrome/chunks for callers
 * who already hold an admin role but not the fine-grained permission.
 */
export type RoutePermission = {
  /** Path pattern as registered in route.tsx (no trailing slash except "/"). */
  path: string;
  /** Permission the user must hold to open this route. */
  permission: string;
};

/**
 * Longest-prefix match wins. Keep in sync with APIs:
 * admin.onboarding_review, admin.messaging, admin.tenants, etc.
 */
export const ROUTE_PERMISSIONS: readonly RoutePermission[] = [
  {
    path: "/", permission: "admin.dashboard.read",
  },
  {
    path: "/tenants/onboarding", permission: "admin.onboarding_review.read",
  },
  {
    path: "/tenants", permission: "admin.tenants.read",
  },
  {
    path: "/installers", permission: "admin.installers.read",
  },
  {
    path: "/devices", permission: "admin.devices.read",
  },
  {
    path: "/sims", permission: "admin.sims.read",
  },
  {
    path: "/data-bundles", permission: "admin.billing.read",
  },
  {
    path: "/simulator", permission: "admin.devices.manage",
  },
  {
    path: "/messaging", permission: "admin.messaging.read",
  },
  {
    path: "/whatsapp", permission: "admin.messaging.read",
  },
  {
    path: "/inbox", permission: "admin.messaging.read",
  },
  {
    path: "/sms-templates", permission: "admin.messaging.read",
  },
  {
    path: "/voice", permission: "admin.messaging.read",
  },
  {
    path: "/campaigns", permission: "admin.messaging.read",
  },
  {
    path: "/subscription", permission: "admin.billing.read",
  },
  {
    path: "/security", permission: "admin.security.read",
  },
  {
    path: "/compliance-audit", permission: "admin.audit.read",
  },
  {
    path: "/settings/team", permission: "admin.staff.read",
  },
  {
    path: "/settings/ai-providers", permission: "admin.ai.read",
  },
  {
    path: "/settings/telephony", permission: "admin.settings.read",
  },
  {
    path: "/settings/notifications", permission: "admin.settings.read",
  },
  // Own 2FA setup — any signed-in admin; no catalog permission.
  {
    path: "/settings/security", permission: "",
  },
  {
    path: "/settings", permission: "admin.settings.read",
  },
  {
    path: "/support", permission: "admin.support.read",
  },
];

/** Permission required for this pathname, or null when the path is ungated. */
export function permissionForPath(pathname: string): string | null {
  const normalized = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(
        0,
        -1,
      )
    : pathname;
  let best: RoutePermission | undefined;
  for (const entry of ROUTE_PERMISSIONS) {
    if (entry.path === "/") {
      if (normalized === "/")
        best = entry;
      continue;
    }
    if (normalized === entry.path || normalized.startsWith(`${entry.path}/`)) {
      if (!best || entry.path.length > best.path.length)
        best = entry;
    }
  }
  if (!best)
    return null;
  // Empty string = explicitly ungated (e.g. own 2FA).
  return best.permission === "" ? null : best.permission;
}

export function holdsPermission(permissions: readonly string[] | undefined, required: string | null): boolean {
  if (!required)
    return true;
  return Boolean(permissions?.includes(required));
}
