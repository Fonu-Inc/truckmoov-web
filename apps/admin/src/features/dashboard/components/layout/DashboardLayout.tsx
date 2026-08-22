import { ErrorBoundary } from "@truckmoov/reusables/components/ErrorBoundary";
import {
  Outlet, useLocation,
} from "react-router";
import { OnboardingRouteGate } from "@/components/onboarding/OnboardingRouteGate";
import { TrialBanner } from "@/components/onboarding/TrialBanner";
import { DashboardHeader } from "@/features/dashboard/components/ui/DashboardHeader";
import { DashboardSidebar } from "@/features/dashboard/components/ui/DashboardSidebar";
import { matchNavEntry } from "@/features/dashboard/utils/sidebarNav";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebarStore";

/**
 * The dashboard shell, mounted as a pathless layout route (see
 * `shared/lib/route.ts`) so the sidebar and top bar survive navigation instead
 * of remounting per page.
 *
 * Pages render only their own content. The page's title and whether it is
 * full-bleed come from its entry in `sidebarNav.ts` — one route, one name.
 */
export function DashboardLayout() {
  const collapsed = useSidebarStore(s => s.collapsed);
  const { pathname } = useLocation();
  const entry = matchNavEntry(pathname);

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
          <DashboardHeader title={entry?.label ?? ""} />
        </ErrorBoundary>
        <TrialBanner />
        <main className={cn(
          "flex-1 p-6",
          entry?.fullWidth && "p-0",
        )}
        >
          <ErrorBoundary>
            <OnboardingRouteGate><Outlet /></OnboardingRouteGate>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
