import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface OnboardingLayoutProps {
  step: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Widen the inner container — useful for the activation step with three pathways. */
  wide?: boolean;
}

const STEPS: Array<{ id: 1 | 2 | 3 | 4; label: string }> = [
  { id: 1, label: "Subscription" },
  { id: 2, label: "Verify Business" },
  { id: 3, label: "Activate System" },
  { id: 4, label: "Quick Access" },
];

/**
 * In-dashboard onboarding layout. Renders inside the standard
 * DashboardLayout so the sidebar + top bar remain visible. The
 * "Get Started" sidebar group navigates between the setup steps.
 */
export function OnboardingLayout({ step, title, subtitle, children, wide }: OnboardingLayoutProps) {
  return (
    <DashboardLayout title="Get Started" subtitle="Finish setup to unlock the full platform">
      <div className={cn("mx-auto", wide ? "max-w-5xl" : "max-w-3xl")}>
        {/* Step indicator */}
        <ol className="flex items-center justify-center gap-2 sm:gap-4">
          {STEPS.map((s, idx) => {
            const isDone = s.id < step;
            const isActive = s.id === step;
            return (
              <li key={s.id} className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                      isDone && "bg-success text-success-foreground",
                      isActive && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                      !isDone && !isActive && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs font-medium sm:inline",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <span className="h-px w-6 bg-border sm:w-10" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Content card */}
        <div className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}
