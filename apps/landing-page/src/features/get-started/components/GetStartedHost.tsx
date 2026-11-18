"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { GetStartedDialog } from "@/features/get-started/components/GetStartedDialog";

type GetStartedHostProps = {
  open: boolean;
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
