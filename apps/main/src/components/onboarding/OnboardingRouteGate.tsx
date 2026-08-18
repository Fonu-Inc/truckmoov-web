import type { ReactNode } from "react";

type OnboardingRouteGateProps = { children: ReactNode };

/**
 * Soft gate: never blocks navigation. Until KYC + Subscription are complete
 * the user can browse every screen in read-only mode. Write actions remain
 * gated at the action/button level (and the persistent KycBanner +
 * onboarding modals keep nudging the user toward completion).
 *
 * Bypassed for demo users and platform admins.
 */
export function OnboardingRouteGate({ children }: OnboardingRouteGateProps) {
  return <>{children}</>;
}
