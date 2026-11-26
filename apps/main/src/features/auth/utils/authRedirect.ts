import type { UserRole } from "@truckmoov/api/auth";
import {
  getInstallationStatusQueryOptions, getTwoFactorQueryOptions,
} from "@truckmoov/api/auth";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { safeReturnPath } from "@truckmoov/app-core/utils/general-utils";
import {
  GET_STARTED_PATH, GET_STARTED_ROLES, isInstallationPending,
} from "@/features/get-started/utils/installationProgress";

export const ROLE_REDIRECT_MAP: Partial<Record<UserRole, string>> = {
  ENTERPRISE_ADMIN: "/",
  AGGREGATOR_ADMIN: "/aggregator",
  OWNER_OPERATOR: "/",
  OPERATIONS_MANAGER: "/overview",
  DISPATCHER: "/jobs",
  FINANCE_VIEWER: "/fleet/analytics",
};

const FALLBACK_PATH = "/not-authorized";

export function getPostLoginRedirectPath(role: UserRole): string {
  return ROLE_REDIRECT_MAP[role] ?? FALLBACK_PATH;
}

/** The page AuthGuard bounced the visitor from, if it is safe to return to. */
export function getReturnPath(state: unknown): string | null {
  const from = (state as {
    from?: {
      pathname?: string; search?: string; hash?: string;
    };
  } | null)?.from;
  return from?.pathname ? safeReturnPath(`${from.pathname}${from.search ?? ""}${from.hash ?? ""}`) : null;
}

/**
 * Where a completed sign-in lands — after the password step, or after the two-factor code step.
 * TRU-FE-7 § C/§ D — if the platform requires 2FA and this account isn't enrolled, land on
 * Security to nudge enrolment. Fail-open on any error so login can't wedge.
 */
export async function resolvePostLoginPath(role: UserRole, returnTo?: string | null): Promise<string> {
  try {
    const state = await queryClient.fetchQuery(getTwoFactorQueryOptions());
    if (state.data.requiredByPlatform && !state.data.enrolled)
      return "/settings/security?enrol=required";
  }
  catch { /* fail open */ }
  if (GET_STARTED_ROLES.includes(role)) {
    try {
      const status = await queryClient.fetchQuery(getInstallationStatusQueryOptions());
      if (isInstallationPending(status.data))
        return GET_STARTED_PATH;
    }
    catch { /* fail open */ }
  }
  return returnTo ?? getPostLoginRedirectPath(role);
}
