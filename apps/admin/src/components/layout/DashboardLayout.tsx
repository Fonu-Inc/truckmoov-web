import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { TrialBanner } from "@/components/onboarding/TrialBanner";
import { OnboardingRouteGate } from "@/components/onboarding/OnboardingRouteGate";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebarStore";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  fullWidth?: boolean;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  fullWidth = false,
}: DashboardLayoutProps) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col bg-card transition-all duration-300",
          collapsed ? "ml-20" : "ml-64"
        )}
      >
        <DashboardHeader title={title} subtitle={subtitle} />
        <div data-allow-no-subscription data-trial-banner>
          <TrialBanner />
        </div>
        <main className={cn("flex-1 p-6", fullWidth && "p-0")}>
          <OnboardingRouteGate>{children}</OnboardingRouteGate>
        </main>
      </div>
    </div>
  );
}


