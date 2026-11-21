import { ErrorBoundary } from "@truckmoov/reusables/components/ErrorBoundary";
import {
  useMemo,
  useState,
} from "react";
import {
  Outlet, useLocation, useNavigation,
} from "react-router";
import { OnboardingRouteGate } from "@/components/onboarding/OnboardingRouteGate";
import { TrialBanner } from "@/components/onboarding/TrialBanner";
import { DashboardHeader } from "@/features/dashboard/components/ui/DashboardHeader";
import { DashboardSidebar } from "@/features/dashboard/components/ui/DashboardSidebar";
import { useSidebarStore } from "@/features/dashboard/stores/sidebarStore";
import { matchNavEntry } from "@/features/dashboard/utils/sidebarNav";
import { cn } from "@/lib/utils";
import { PageTitle } from "@/shared/components/layout/PageTitle";
import {
  PageActionsContext,
  PageTitleContext,
} from "@/shared/components/layout/pageTitleContext";

/**
 * The dashboard shell, mounted as a pathless layout route (see
 * `shared/lib/route.tsx`) so the sidebar and top bar survive navigation instead
 * of remounting per page.
 *
 * Pages render only their own content. The page's heading (`PageTitle`, in the
 * content area — the top bar carries no title, as in fleetflow) and whether it
 * is full-bleed come from its entry in `sidebarNav.ts` — one route, one name.
 *
 * This component re-renders on every navigation — it needs the pathname for the
 * title. `DashboardSidebar` is `memo`'d and takes no props, so that re-render
 * stops at the sidebar boundary instead of walking the whole nav tree.
 */
export function DashboardLayout() {
  const collapsed = useSidebarStore(s => s.collapsed);
  const { pathname } = useLocation();
  const navigating = useNavigation().state !== "idle";
  const entry = matchNavEntry(pathname);
  // The heading's action slot. Pages portal buttons into it via <PageActions>.
  const [
    actionsTarget,
    setActionsTarget,
  ] = useState<HTMLDivElement | null>(null);
  const actionsContext = useMemo(
    () => ({
      target: actionsTarget, setTarget: setActionsTarget,
    }),
    [actionsTarget],
  );
  const titleContext = useMemo(
    () => ({
      title: entry?.label ?? "", description: entry?.description,
    }),
    [entry],
  );
  // Fleetflow renders the heading above every platform page; tabbed pages opt
  // out (`manualTitle`) and render it under their tab bar. Off-nav pages and
  // full-bleed workspaces name themselves.
  const showAutoTitle = !!entry && !entry.manualTitle && !entry.fullWidth;

  return (
    <div className="min-h-screen bg-background">
      {/* Page chunks load on demand, so a click can block for a moment.
          Without this the wait reads as the app freezing. */}
      <div
        role="presentation"
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity duration-150 motion-reduce:transition-none",
          navigating ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="h-full w-2/5 animate-loading-bar bg-primary motion-reduce:w-full motion-reduce:animate-none" />
      </div>
      <ErrorBoundary><DashboardSidebar /></ErrorBoundary>
      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-col bg-card",
          // ponytail: mobile drops the fixed sidebar entirely (rendered as a
          // Sheet instead), so the content column takes the full width. `md:`
          // is the same 768px cutoff useIsMobile flips on.
          collapsed ? "md:ml-20" : "md:ml-64",
        )}
      >
        <ErrorBoundary>
          <DashboardHeader />
        </ErrorBoundary>
        <TrialBanner />
        <main className={cn(
          "min-w-0 flex-1 p-3 sm:p-6",
          entry?.fullWidth && "p-0 sm:p-0",
        )}
        >
          <ErrorBoundary>
            <PageTitleContext.Provider value={titleContext}>
              <PageActionsContext.Provider value={actionsContext}>
                <OnboardingRouteGate>
                  {showAutoTitle && <PageTitle />}
                  <Outlet />
                </OnboardingRouteGate>
              </PageActionsContext.Provider>
            </PageTitleContext.Provider>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
