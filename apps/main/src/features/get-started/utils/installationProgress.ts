import type {
  InstallationStatus, UserRole,
} from "@truckmoov/api/auth";

export const GET_STARTED_PATH = "/get-started";

export const GET_STARTED_ROLES: UserRole[] = [
  "ENTERPRISE_ADMIN",
  "OWNER_OPERATOR",
];

/** Onboarding under way (booked or not yet) and not fleet_ready: the customer belongs on Get Started. */
export function isInstallationPending(status: InstallationStatus | undefined): boolean {
  const current = status?.progress.find(step => step.current);
  return Boolean(current && current.stage !== "fleet_ready");
}

export const INSTALLATION_PENDING_HINT = "Available once your installation is complete.";

/** The server's message when it refused an action with 409 onboarding_in_progress. */
export function onboardingInProgressMessage(error: unknown): string | undefined {
  const body = error as {
    code?: unknown; message?: unknown;
  } | null;
  return body?.code === "onboarding_in_progress" && typeof body.message === "string" ? body.message : undefined;
}
