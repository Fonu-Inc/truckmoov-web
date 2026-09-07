import { ErrorBoundary } from "@truckmoov/reusables/components/ErrorBoundary";
import {
  Outlet, useLocation, useNavigation,
} from "react-router";
import { OnboardingRouteGate } from "@/components/onboarding/OnboardingRouteGate";
import { TrialBanner } from "@/components/onboarding/TrialBanner";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { DashboardHeader } from "@/features/dashboard/components/ui/DashboardHeader";
import { DashboardSidebar } from "@/features/dashboard/components/ui/DashboardSidebar";
import { useSidebarStore } from "@/features/dashboard/stores/sidebarStore";
import {
  matchNavEntry, resolveLabel,
} from "@/features/dashboard/utils/sidebarNav";
import { cn } from "@/lib/utils";

/**
 * The dashboard shell, mounted as a pathless layout route (see
 * `shared/lib/route.tsx`) so the sidebar and top bar survive navigation instead
 * of remounting per page.
 *
 * Pages render only their own content. The page's title and whether it is
 * full-bleed come from its entry in `sidebarNav.ts` — one route, one name.
 *
 * This component re-renders on every navigation — it needs the pathname for the
 * title. `DashboardSidebar` is `memo`'d and takes no props, so that re-render
 * stops at the sidebar boundary instead of walking the whole nav tree.
 */
export function DashboardLayout() {
  const collapsed = useSidebarStore(s => s.collapsed);
  const role = useAuthStore(s => s.user?.role);
  const { pathname } = useLocation();
  const navigating = useNavigation().state !== "idle";
  const entry = matchNavEntry(pathname);

  return (
    <div className="min-h-screen bg-background">
      {/* Page chunks load on demand, so a click can block for a moment.
          Without this the wait reads as the app freezing. */}
      <div
        role="presentation"
        className={cn(
          "fixed inset-x-0 top-0 z-50 h-0.5 bg-primary transition-opacity duration-150 motion-reduce:transition-none",
          navigating ? "animate-pulse opacity-100" : "opacity-0",
        )}
      />
      <ErrorBoundary><DashboardSidebar /></ErrorBoundary>
      <div
        className={cn(
          "flex min-h-screen flex-col bg-card",
          collapsed ? "ml-20" : "ml-64",
        )}
      >
        <ErrorBoundary>
          <DashboardHeader title={entry ? resolveLabel(
            entry,
            role,
          ) : ""}
          />
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
