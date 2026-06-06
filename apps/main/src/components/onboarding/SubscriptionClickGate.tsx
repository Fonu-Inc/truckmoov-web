import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";

/**
 * Two-layer global hard gate.
 *
 * KYC action gate:
 *   If KYC is not yet APPROVED (i.e. user skipped KYC, or it's submitted but
 *   pending review), operational clicks are blocked until verification passes.
 *   Restrictions stay in place until KYC is approved by Platform Admin.
 *
 * Sidebar navigation, header controls, banner CTAs, and elements marked
 * data-allow-no-subscription / data-allow-no-kyc remain functional so
 * users can keep browsing and complete onboarding.
 */
export function SubscriptionClickGate() {
  const isVerified = false;
  const kycLoading = false;
  const { bypassGating } = useOnboardingProgress();
  const location = useLocation();

  useEffect(() => {
    if (bypassGating) return;

    // Never gate while the user is already on an onboarding route — they're
    // actively completing the very step we'd redirect them to.
    if (location.pathname.startsWith("/onboarding")) return;

    // Determine whether KYC is currently blocking actions.
    const kycBlocked = !kycLoading && !isVerified;

    if (!kycBlocked) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find the closest interactive element
      const interactive = target.closest(
        'button, [role="button"], a[href], [data-action]'
      ) as HTMLElement | null;
      if (!interactive) return;

      // Universal opt-outs: sidebar/header/banners + explicit markers.
      if (interactive.closest("aside")) return; // sidebar
      if (interactive.closest("header")) return; // top header (logout, theme, etc.)
      if (interactive.closest("[data-trial-banner]")) return;
      if (interactive.closest("[data-kyc-banner]")) return;

      // Subscription-layer opt-outs (also implied for KYC layer).
      if (interactive.closest("[data-allow-no-subscription]")) return;
      // KYC-layer opt-out: things that should remain clickable even when KYC
      // blocks (e.g. Verify Business CTA, document uploads on KYC page).
      if (interactive.closest("[data-allow-no-kyc]")) return;

      // Allow plain navigation links (router) — they don't perform features.
      if (interactive.tagName === "A") {
        const href = (interactive as HTMLAnchorElement).getAttribute("href") || "";
        if (href.startsWith("/") || href.startsWith("#")) return;
      }

      // Allow closing dialogs/popovers
      const label = (interactive.getAttribute("aria-label") || "").toLowerCase();
      if (label === "close" || label === "dismiss") return;

      e.preventDefault();
      e.stopPropagation();

      // Keep the user in context — no redirect, just inform.
      toast.error("KYC required", {
        description:
          "You need to complete your KYC before accessing this feature.",
      });
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [isVerified, kycLoading, bypassGating, location.pathname]);

  return null;
}
