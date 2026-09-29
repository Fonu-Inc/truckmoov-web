import { useQuery } from "@tanstack/react-query";
import { getJobsQueryOptions } from "@truckmoov/api/dispatch";
import {
  getDriversQueryOptions, getVehiclesQueryOptions,
} from "@truckmoov/api/fleet";
import { useMemo } from "react";

/**
 * A dispatch job reshaped into the camelCase fields fleetflow's Reports page
 * reads (`createdAt`, `vehicleId`, `pickupAddress`, …). The API has no
 * `completedAt`, so `updatedAt` stands in — fleetflow already falls back to it.
 */
export type ReportJob = {
  id: string;
  reference: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  amountNgn: number;
  vehicleId?: string;
  driverId?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  attachments: unknown[];
};

/**
 * Vehicles, drivers and jobs for every Reports tab. Each tab page calls this
 * itself so it stays a self-contained lazy chunk; React Query dedupes the
 * requests across tabs.
 */
export function useReportsData() {
  const vehiclesQuery = useQuery(getVehiclesQueryOptions());
  const driversQuery = useQuery(getDriversQueryOptions());
  const jobsQuery = useQuery(getJobsQueryOptions());

  const jobs = useMemo<ReportJob[]>(
    () => (jobsQuery.data?.data ?? []).map(j => ({
      id: j.id ?? "",
      reference: j.reference ?? "",
      status: j.status ?? "",
      createdAt: j.created_at,
      updatedAt: j.updated_at,
      amountNgn: j.amount_ngn ?? 0,
      vehicleId: j.assigned_vehicle_id,
      driverId: j.assigned_driver_id,
      pickupAddress: j.pickup?.address,
      deliveryAddress: j.dropoff?.address,
      attachments: j.pod_attachments ?? [],
    })),
    [jobsQuery.data],
  );

  return {
    vehicles: vehiclesQuery.data?.data ?? [],
    drivers: driversQuery.data?.data ?? [],
    jobs,
    error: vehiclesQuery.error ?? driversQuery.error ?? jobsQuery.error,
    refetch: () => {
      void vehiclesQuery.refetch();
      void driversQuery.refetch();
      void jobsQuery.refetch();
    },
    isPending: vehiclesQuery.isPending || driversQuery.isPending || jobsQuery.isPending,
  };
}
