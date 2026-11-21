import { useQuery } from "@tanstack/react-query";
import {
  getSystemInstallationJobsQueryOptions, getSystemInstallersQueryOptions,
} from "@truckmoov/api/auth";
import { useMemo } from "react";
import { fromSystemInstallationJob } from "@/features/installers/utils/platformInstallations";

/**
 * The tab filters, counts and pages client-side the way fleetflow does, so it
 * loads one wide page rather than paging on the server.
 */
export const INSTALLATIONS_FETCH_LIMIT = 100;

const REFRESH_MS = 30_000;

/** Fleetflow's `usePlatformInstallations`, live branch: installation orders plus the installer accounts they name. */
export function usePlatformInstallations({ withInstallers = true }: { withInstallers?: boolean } = {}) {
  const jobs = useQuery({
    ...getSystemInstallationJobsQueryOptions({
      page: 1, limit: INSTALLATIONS_FETCH_LIMIT,
    }),
    refetchInterval: REFRESH_MS,
  });
  const installers = useQuery({
    ...getSystemInstallersQueryOptions({
      page: 1, limit: INSTALLATIONS_FETCH_LIMIT,
    }),
    enabled: withInstallers,
  });
  const allRecords = useMemo(
    () => (jobs.data?.data.items ?? []).map(fromSystemInstallationJob),
    [jobs.data],
  );
  return {
    records: allRecords,
    allRecords,
    loading: jobs.isLoading,
    error: jobs.isError ? "Installation records could not be loaded. Please try again." : null,
    liveInstallers: installers.data?.data.items ?? [],
    refresh: () => void jobs.refetch(),
  };
}
