import type { UserRole } from "@truckmoov/api/auth";
import { getTwoFactorQueryOptions } from "@truckmoov/api/auth";
import { queryClient } from "@truckmoov/api/lib/query-client";

export const ROLE_REDIRECT_MAP: Partial<Record<UserRole, string>> = {
  ENTERPRISE_ADMIN: "/",
  AGGREGATOR_ADMIN: "/aggregator",
  OWNER_OPERATOR: "/",
  FLEET_ADMIN: "/overview",
  OPERATIONS_MANAGER: "/overview",
  DISPATCHER: "/jobs",
  FINANCE_VIEWER: "/fleet/analytics",
};

const FALLBACK_PATH = "/not-authorized";

export function getPostLoginRedirectPath(role: UserRole): string {
  return ROLE_REDIRECT_MAP[role] ?? FALLBACK_PATH;
}

/**
 * Where a completed sign-in lands — after the password step, or after the two-factor code step.
 * TRU-FE-7 § C/§ D — if the platform requires 2FA and this account isn't enrolled, land on
 * Security to nudge enrolment. Fail-open on any error so login can't wedge.
 */
export async function resolvePostLoginPath(role: UserRole): Promise<string> {
  try {
    const state = await queryClient.fetchQuery(getTwoFactorQueryOptions());
    if (state.data.requiredByPlatform && !state.data.enrolled)
      return "/settings/security?enrol=required";
  }
  catch { /* fail open */ }
  return getPostLoginRedirectPath(role);
}
