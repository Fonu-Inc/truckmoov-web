import { useMemo } from "react";
import { ShieldCheck, type LucideIcon } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { getOnboardingGroups, type OnboardingGroup } from "@/components/onboarding/onboardingChecklist";

export type OnboardingStepStatus = "done" | "active" | "locked";

export interface OnboardingStep {
  id: string;
  title: string;
  hint?: string;
  icon: LucideIcon;
  status: OnboardingStepStatus;
  /** Underlying group definition (for action buttons). */
  group: OnboardingGroup;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  /** Index of the first non-done step, or -1 when all done. */
  currentIndex: number;
  currentStep: OnboardingStep | null;
  allDone: boolean;
  /** True when KYC is complete (i.e. dashboard unlocked). */
  hasPlatformAccess: boolean;
  /** True for demo accounts and platform admins — gating fully bypassed. */
  bypassGating: boolean;
}

/**
 * Sequential onboarding progress for the current user.
 *
  * Steps:
  *   1. KYC Verification — completed when backend reports verified.
  *   2. Role-based first action — completed when its CTA has been clicked
 *      (and recorded via completeStep).
 *
 * Demo users and platform admins bypass all locking.
 */
export function useOnboardingProgress(): OnboardingProgress {
  const { user } = useAuthStore();
  const { completedSteps } = useOnboardingStore();

  const isPlatformAdmin = user?.role === "platform_admin";
  const bypassGating = isPlatformAdmin;

  const groups = getOnboardingGroups(user?.role);

  // Subscription step removed — KYC is the first step.
  const kycGroup = groups.find((g) => g.id === "kyc");
  const roleGroup = groups.find((g) => g.id !== "kyc" && g.id !== "subscription");

  return useMemo<OnboardingProgress>(() => {
    const kycDone = completedSteps.includes("kyc");
    const roleDone = roleGroup ? completedSteps.includes(roleGroup.id) : true;

    const ordered: Array<{ group: OnboardingGroup | undefined; done: boolean; icon: LucideIcon }> = [
      { group: kycGroup, done: kycDone, icon: ShieldCheck },
      { group: roleGroup, done: roleDone, icon: roleGroup?.icon ?? ShieldCheck },
    ];

    // Find first non-done index — that's the active step. Everything after is locked.
    let firstActive = -1;
    for (let i = 0; i < ordered.length; i++) {
      if (!ordered[i].done) { firstActive = i; break; }
    }

    const steps: OnboardingStep[] = ordered
      .filter((o): o is { group: OnboardingGroup; done: boolean; icon: LucideIcon } => !!o.group)
      .map((o, idx) => {
        const status: OnboardingStepStatus = o.done
          ? "done"
          : idx === firstActive
            ? "active"
            : "locked";
        return {
          id: o.group.id,
          title: o.group.title,
          hint: o.group.hint,
          icon: o.icon,
          status,
          group: o.group,
        };
      });

    const currentIndex = steps.findIndex((s) => s.status === "active");
    const allDone = currentIndex === -1;

    return {
      steps,
      currentIndex,
      currentStep: currentIndex >= 0 ? steps[currentIndex] : null,
      allDone,
      hasPlatformAccess: kycDone,
      bypassGating,
    };
  }, [completedSteps, kycGroup, roleGroup, bypassGating]);
}
