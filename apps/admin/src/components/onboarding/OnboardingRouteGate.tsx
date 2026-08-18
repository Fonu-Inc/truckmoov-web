import type { ReactNode } from "react";

type OnboardingRouteGateProps = { children: ReactNode };

/**
 * Compatibility wrapper for routes that still use the tenant onboarding layout.
 * The admin app does not gate navigation or actions for internal staff.
 */
export function OnboardingRouteGate({ children }: OnboardingRouteGateProps) {
  return <>{children}</>;
}
