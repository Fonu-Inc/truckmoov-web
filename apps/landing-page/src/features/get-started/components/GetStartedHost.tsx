"use client";

import type { DialogIntent } from "@/shared/stores/dialogStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { setOnboardingTokenStorage } from "@truckmoov/api/auth";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { GetStartedDialog } from "@/features/get-started/components/GetStartedDialog";

// The draft token outlives the tab here, so "Apply as Returning Customer" can resume days
// later. Set before the wizard (and its first request) mounts.
setOnboardingTokenStorage("local");

type GetStartedHostProps = {
  open: boolean;
  intent: DialogIntent;
  onOpenChange: (open: boolean) => void;
};

/**
 * Lazy entry point for the onboarding wizard. The query provider lives here, not around the
 * whole app, so react-query, the API client and the wizard only load when a visitor opens it.
 */
export function GetStartedHost(props: GetStartedHostProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <GetStartedDialog {...props} />
    </QueryClientProvider>
  );
}
