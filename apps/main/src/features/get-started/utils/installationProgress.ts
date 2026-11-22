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
