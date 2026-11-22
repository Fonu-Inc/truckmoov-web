import type { SystemInstallationJobsQuery } from "@truckmoov/api/auth";
import {
  keepPreviousData, useQuery,
} from "@tanstack/react-query";
import {
  getSystemInstallationJobsQueryOptions, getSystemInstallersQueryOptions,
} from "@truckmoov/api/auth";
import { useMemo } from "react";
import { fromSystemInstallationJob } from "@/features/installers/utils/platformInstallations";

/** The server's page cap; also the installer list size the assignment dialog reads. */
export const INSTALLATIONS_FETCH_LIMIT = 100;

const REFRESH_MS = 30_000;

/** Fleetflow's `usePlatformInstallations`, live branch: one server page of installation orders plus the installer accounts they name. */
export function usePlatformInstallations({
  withInstallers = true,
  query = {
    page: 1, limit: INSTALLATIONS_FETCH_LIMIT,
  },
}: {
  withInstallers?: boolean; query?: SystemInstallationJobsQuery;
} = {}) {
  const jobs = useQuery({
    ...getSystemInstallationJobsQueryOptions(query),
    refetchInterval: REFRESH_MS,
    placeholderData: keepPreviousData,
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
    total: jobs.data?.data.total ?? 0,
    countsByStatus: jobs.data?.data.countsByStatus,
    loading: jobs.isLoading,
    error: jobs.isError ? "Installation records could not be loaded. Please try again." : null,
    liveInstallers: installers.data?.data.items ?? [],
    refresh: () => void jobs.refetch(),
  };
}
