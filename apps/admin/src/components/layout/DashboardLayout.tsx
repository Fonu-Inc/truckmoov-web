import type { ReactNode } from "react";
import { ErrorBoundary } from "@truckmoov/reusables/components/ErrorBoundary";
import { OnboardingRouteGate } from "@/components/onboarding/OnboardingRouteGate";
import { TrialBanner } from "@/components/onboarding/TrialBanner";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebarStore";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";

type DashboardLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  fullWidth?: boolean;
};

export function DashboardLayout({
  children,
  title,
  subtitle,
  fullWidth = false,
}: DashboardLayoutProps) {
  const collapsed = useSidebarStore(s => s.collapsed);
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary><DashboardSidebar /></ErrorBoundary>
      <div
        className={cn(
          "flex min-h-screen flex-col bg-card transition-all duration-300",
          collapsed ? "ml-20" : "ml-64",
        )}
      >
        <ErrorBoundary>
          <DashboardHeader
            title={title}
            subtitle={subtitle}
          />
        </ErrorBoundary>
        <div
          data-allow-no-subscriptiondata-trial-banner
        >
          <TrialBanner />
        </div>
        <main className={cn(
          "flex-1 p-6",
          fullWidth && "p-0",
        )}
        >
          <ErrorBoundary>
            <OnboardingRouteGate>{children}</OnboardingRouteGate>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
