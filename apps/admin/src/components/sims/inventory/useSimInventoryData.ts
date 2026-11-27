import type { SystemSimsQuery } from "@truckmoov/api/auth";
import type { SimLookups } from "./simInventoryShared";
import {
  keepPreviousData, useQuery,
} from "@tanstack/react-query";
import {
  getSystemDevicesQueryOptions,
  getSystemSimsQueryOptions,
  getSystemSimsSummaryQueryOptions,
  getSystemTenantsQueryOptions,
} from "@truckmoov/api/auth";
import { useMemo } from "react";
import { mapSimToRow } from "./simInventoryShared";

export function useSimInventoryData(query: SystemSimsQuery) {
  const simsQuery = useQuery(getSystemSimsQueryOptions(query));
  const summaryQuery = useQuery(getSystemSimsSummaryQueryOptions());
  const tenantsQuery = useQuery(getSystemTenantsQueryOptions());
  const deviceIds = useMemo(
    () => [...new Set(simsQuery.data?.data.sims.flatMap(sim => sim.deviceId ? [sim.deviceId] : []))].slice(
      0,
      100,
    ),
    [simsQuery.data],
  );
  const devicesQuery = useQuery({
    ...getSystemDevicesQueryOptions({
      params: {
        ids: deviceIds,
        limit: 100,
      },
    }),
    enabled: deviceIds.length > 0,
    placeholderData: keepPreviousData,
  });

  const tenants = useMemo(
    () => tenantsQuery.data?.data.tenants ?? [],
    [tenantsQuery.data],
  );
  const lookups = useMemo<SimLookups>(
    () => ({
      tenantNames: new Map(tenants.map(tenant => [
        tenant.id,
        tenant.name,
      ])),
      deviceImeis: new Map(devicesQuery.data?.data.items.map(device => [
        device.id,
        device.imei,
      ])),
    }),
    [
      tenants,
      devicesQuery.data,
    ],
  );
  const sims = useMemo(
    () => simsQuery.data?.data.sims.map(sim => mapSimToRow(
      sim,
      lookups,
    )) ?? [],
    [
      simsQuery.data,
      lookups,
    ],
  );

  return {
    simsQuery,
    summaryQuery,
    tenantsQuery,
    tenants,
    lookups,
    sims,
  };
}
