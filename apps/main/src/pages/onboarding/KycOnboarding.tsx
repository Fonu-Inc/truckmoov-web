import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { OnboardingLayout } from "./OnboardingLayout";
import { OnboardingKYCStep } from "@/components/onboarding/OnboardingKYCStep";

/**
 * Onboarding "Verify Business" step.
 *
 * Reuses the exact same KYC component used in Organisation Settings → KYC.
 * The persistent KYC banner only activates AFTER the user explicitly clicks
 * "Skip for now" — never before.
 */
export default function KycOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const markKycSkipped = useOnboardingStore((s) => s.markKycSkipped);
  const tenantId = user?.tenantId ?? "";

  const handleSkip = () => {
    markKycSkipped();
    toast.info("KYC skipped for now", {
      description:
        "You'll see a reminder on every page until your business is verified.",
    });
    navigate("/onboarding/activate");
  };

  const handleContinue = () => {
    navigate("/onboarding/activate");
  };

  return (
    <OnboardingLayout
      step={2}
      title="Verify your business"
      subtitle="Submit your business details and documents so our team can verify your account. You can continue to the dashboard at any time — we'll keep reminding you until verification is complete."
    >
      {tenantId ? (
        <OnboardingKYCStep tenantId={tenantId} onContinue={handleContinue} onSkip={handleSkip} />
      ) : (
        <p className="text-sm text-muted-foreground">
          We couldn't find a tenant for your account. Please contact support.
        </p>
      )}
    </OnboardingLayout>
  );
}
