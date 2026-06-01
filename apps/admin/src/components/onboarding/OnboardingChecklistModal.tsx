import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useOnboardingProgress, type OnboardingStep } from "@/hooks/useOnboardingProgress";
import type { OnboardingAction } from "./onboardingChecklist";
import { CheckCircle2, Sparkles, ArrowRight, Truck, MapPin, Package, Lock } from "lucide-react";
import { SubscriptionModal } from "./SubscriptionModal";
import { cn } from "@/lib/utils";

/**
 * Sequential onboarding modal: Welcome → step-by-step progression.
 * Each step unlocks the next; locked steps are visible but disabled.
 */
export function OnboardingChecklistModal() {
  const navigate = useNavigate();
  const {
    showPanel,
    showWelcome,
    completeStep,
    skipOnboarding,
    openChecklist,
    showSubscriptionModal,
    setShowSubscriptionModal,
    refreshVisibility,
    markActionClicked,
  } = useOnboardingStore();

  const { steps, currentStep, allDone } = useOnboardingProgress();

  const [view, setView] = useState<"welcome" | "actions">(
    showWelcome ? "welcome" : "actions"
  );

  useEffect(() => {
    if (showWelcome) setView("welcome");
    else setView("actions");
  }, [showWelcome]);

  useEffect(() => {
    refreshVisibility();
    const onFocus = () => refreshVisibility();
    const interval = window.setInterval(refreshVisibility, 60_000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [refreshVisibility]);

  const open = showWelcome || showPanel;

  const handleAction = (groupId: string, action: OnboardingAction) => {
    markActionClicked(action.id);
    if (action.action === "subscription") {
      setShowSubscriptionModal(true);
      return;
    }
    completeStep(groupId);
    navigate(action.to);
  };

  const handleGetStarted = () => {
    skipOnboarding();
    navigate("/onboarding/kyc");
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) skipOnboarding();
        }}
      >
        <DialogContent
          className="max-w-md p-0 overflow-hidden bg-card"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="relative">
            {view === "welcome" ? (
              <WelcomeView onGetStarted={handleGetStarted} onSkip={skipOnboarding} />
            ) : (
              <ActionsView
                steps={steps}
                currentStepId={currentStep?.id ?? null}
                allDone={allDone}
                onAction={handleAction}
                onSkip={skipOnboarding}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
        onSelected={() => {
          completeStep("subscription");
          setShowSubscriptionModal(false);
        }}
      />
    </>
  );
}

/* ---------------- Welcome view ---------------- */

function WelcomeView({
  onGetStarted,
  onSkip,
}: {
  onGetStarted: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <div className="relative h-40 overflow-hidden bg-gradient-to-b from-primary/15 via-primary/5 to-background">
        <ConfettiDots />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -left-10 -top-2 flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-md ring-1 ring-border">
              <MapPin className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            <div className="absolute -right-10 -top-1 flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-md ring-1 ring-border">
              <Package className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-xl">
              <Truck className="h-10 w-10" strokeWidth={1.75} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-6 pt-4 text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Welcome to FleetPro Enterprise
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          We'll guide you through a few quick steps — verify your business,
          activate your system, then start using the platform.
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <Button onClick={onGetStarted} size="sm" className="px-6">
            Get Started
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-border bg-muted/30 px-6 py-3">
        <Button variant="outline" size="sm" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Sequential Actions view ---------------- */

function ActionsView({
  steps,
  currentStepId,
  allDone,
  onAction,
  onSkip,
}: {
  steps: OnboardingStep[];
  currentStepId: string | null;
  allDone: boolean;
  onAction: (groupId: string, action: OnboardingAction) => void;
  onSkip: () => void;
}) {
  return (
    <div className="animate-scale-in">
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h2 className="text-base font-semibold leading-none tracking-tight text-foreground">
              Get Started
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {allDone
                ? "You're all set — nice work!"
                : "Complete each step to unlock the next."}
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[55vh] overflow-y-auto px-4 py-4 space-y-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isDone = step.status === "done";
          const isActive = step.status === "active";
          const isLocked = step.status === "locked";

          return (
            <div
              key={step.id}
              className={cn(
                "rounded-xl border p-3 transition-all",
                isDone && "border-success/30 bg-success/5",
                isActive && "border-primary bg-primary/5 shadow-sm",
                isLocked && "border-border bg-muted/30 opacity-60"
              )}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    isDone && "bg-success/15 text-success",
                    isActive && "bg-primary/15 text-primary",
                    isLocked && "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isLocked ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isDone && "text-success",
                        isActive && "text-primary",
                        isLocked && "text-muted-foreground"
                      )}
                    >
                      Step {index + 1}
                    </span>
                    {isActive && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                        Now
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                    {step.title}
                  </p>
                  {step.hint && (
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {step.hint}
                    </p>
                  )}
                </div>
              </div>

              {!isDone && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 pl-[2.625rem]">
                  {step.group.actions.map((action) => (
                    <Button
                      key={action.id}
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      disabled={isLocked}
                      onClick={() => onAction(step.id, action)}
                      className="h-8"
                    >
                      {action.label}
                      {!isLocked && <ArrowRight className="ml-1 h-3 w-3" />}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end border-t border-border bg-muted/30 px-6 py-3">
        <Button variant="outline" size="sm" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}

/** Decorative scattered confetti dots in brand palette. */
function ConfettiDots() {
  const dots = [
    { top: "12%", left: "10%", size: 8, color: "bg-primary" },
    { top: "22%", left: "82%", size: 6, color: "bg-primary/60" },
    { top: "55%", left: "6%", size: 5, color: "bg-foreground/40" },
    { top: "70%", left: "88%", size: 7, color: "bg-primary" },
    { top: "8%", left: "45%", size: 4, color: "bg-foreground/30" },
    { top: "30%", left: "20%", size: 5, color: "bg-primary/70" },
    { top: "18%", left: "70%", size: 4, color: "bg-foreground/40" },
    { top: "65%", left: "30%", size: 4, color: "bg-primary/50" },
    { top: "40%", left: "92%", size: 5, color: "bg-foreground/30" },
    { top: "75%", left: "55%", size: 4, color: "bg-primary/60" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {dots.map((d, i) => (
        <span
          key={i}
          className={`absolute rounded-full ${d.color}`}
          style={{
            top: d.top,
            left: d.left,
            width: `${d.size}px`,
            height: `${d.size}px`,
          }}
        />
      ))}
    </div>
  );
}



