import { AlertOctagon, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/shadcn/button";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { useKycProgress } from "@/hooks/useKycProgress";
import { useOnboardingStore } from "@/stores/onboardingStore";

/**
 * Persistent KYC nudge that lives just under the top navbar on every page
 * until KYC is fully verified by the Platform Admin.
 *
 * Design (per product spec):
 *   - Pinkish-red background (light) with strong red text/icon — attention-grabbing
 *   - Sticky beneath the header, always visible until KYC = Completed
 *   - Not dismissible
 *   - Title: "Complete your KYC to activate full platform access"
 *   - Subtext: "Some features are restricted until verification is complete."
 *   - CTA: "Complete KYC"
 *
 * Bypassed for demo users and platform admins (handled inside
 * useOnboardingProgress).
 */
export function KycBanner() {
  const navigate = useNavigate();
  const { bypassGating } = useOnboardingProgress();
  const { isVerified, isSubmitted, status, isLoading } = useKycProgress();
  const kycSkipped = useOnboardingStore((s) => s.kycSkipped);

  if (bypassGating) return null;
  if (isLoading) return null;
  if (isVerified) return null;
  // Only nudge users who explicitly chose "Skip for now" on the Verify Business step.
  // Until they skip, the onboarding flow itself is the source of truth.
  if (!kycSkipped && !isSubmitted) return null;

  const awaitingApproval =
    status === "under_review" || (isSubmitted && status !== "rejected");

  const goToKyc = () => navigate("/admin/settings?tab=kyc");

  // Awaiting-approval state keeps the original tone (it is informational, not urgent)
  if (awaitingApproval) {
    return (
      <div className="sticky top-14 z-20 border-b border-warning/40 bg-warning/10 backdrop-blur supports-[backdrop-filter]:bg-warning/10">
        <div className="flex items-center gap-3 px-6 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning/25 text-warning-foreground">
            <Clock className="h-4 w-4" />
          </div>
          <p className="flex-1 text-sm text-foreground">
            <span className="font-semibold">KYC submitted.</span>{" "}
            <span className="text-muted-foreground">
              Awaiting approval — you can browse the platform, but features stay locked until your KYC is approved.
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Incomplete-KYC state — red text in light mode, white text in dark mode
  return (
    <div
      className="sticky top-14 z-20 border-b backdrop-blur bg-[rgba(249,115,22,0.12)] dark:bg-[rgba(220,38,38,0.18)] border-[rgba(220,38,38,0.25)] dark:border-[rgba(220,38,38,0.4)]"
    >
      <div className="flex items-center gap-3 px-6 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(220,38,38,0.15)] text-[#B45309] dark:bg-white/10 dark:text-white">
          <AlertOctagon className="h-5 w-5" />
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="text-sm font-semibold text-[#7C2D12] dark:text-white">
            Complete your KYC to activate full platform access
          </p>
          <p className="text-xs text-[#9A3412] dark:text-white/80">
            Some features are restricted until verification is complete.
          </p>
        </div>
        <Button
          size="sm"
          onClick={goToKyc}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Complete KYC
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}



