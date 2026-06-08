import { Dialog, DialogContent } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useNavigate } from "react-router-dom";

/**
 * Compact welcome modal: heading, short copy, and a primary "Get Started" CTA.
 * Decorated with subtle constellation accents.
 */
export function WelcomeModal() {
  const { showWelcome, dismissWelcome } = useOnboardingStore();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Dismiss first so the modal closes immediately and is never shown again
    // for this activation (WELCOME_SEEN is persisted in localStorage).
    dismissWelcome();
    setTimeout(() => navigate("/"), 0);
  };

  return (
    <Dialog
      open={showWelcome}
      onOpenChange={(open) => {
        if (!open) dismissWelcome();
      }}
    >
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="relative bg-background px-8 py-10">
          {/* Constellation accents */}
          <ConstellationTopRight />
          <ConstellationBottomLeft />

          <div className="relative z-10 flex flex-col items-center gap-5 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome to FleetPro!
            </h2>

            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              We're excited to have you on board. Get ready to streamline your shipping,
              track packages, and manage your deliveries with ease.
            </p>

            <Button
              onClick={handleGetStarted}
              data-allow-no-subscription
              className="h-11 rounded-full px-10 text-base font-semibold shadow-md"
            >
              Get Started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Decorative constellation in the top-right corner. */
function ConstellationTopRight() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute -right-2 -top-2 h-28 w-28 text-primary/60"
      viewBox="0 0 160 160"
      fill="none"
    >
      <g stroke="currentColor" strokeWidth="0.8">
        <line x1="20" y1="40" x2="60" y2="20" />
        <line x1="60" y1="20" x2="100" y2="50" />
        <line x1="100" y1="50" x2="140" y2="30" />
        <line x1="60" y1="20" x2="80" y2="70" />
        <line x1="80" y1="70" x2="130" y2="80" />
        <line x1="100" y1="50" x2="130" y2="80" />
      </g>
      <g fill="currentColor">
        {[
          [20, 40], [60, 20], [100, 50], [140, 30], [80, 70], [130, 80],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={2.4} />
        ))}
      </g>
    </svg>
  );
}

function ConstellationBottomLeft() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute -bottom-2 -left-2 h-20 w-20 text-primary/60"
      viewBox="0 0 100 100"
      fill="none"
    >
      <g stroke="currentColor" strokeWidth="0.8">
        <line x1="10" y1="60" x2="40" y2="40" />
        <line x1="40" y1="40" x2="70" y2="70" />
        <line x1="40" y1="40" x2="30" y2="80" />
      </g>
      <g fill="currentColor">
        <circle cx="10" cy="60" r="2.2" />
        <circle cx="40" cy="40" r="2.2" />
        <circle cx="70" cy="70" r="2.2" />
        <circle cx="30" cy="80" r="2.2" />
      </g>
    </svg>
  );
}


