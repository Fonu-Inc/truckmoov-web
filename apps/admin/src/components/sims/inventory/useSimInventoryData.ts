import type { SystemSimsQuery } from "@truckmoov/api/auth";
import type { SimLookups } from "./simInventoryShared";
import { useQuery } from "@tanstack/react-query";
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
  const devicesQuery = useQuery(getSystemDevicesQueryOptions());

  const tenants = useMemo(
    () => tenantsQuery.data?.data.tenants ?? [],
    [tenantsQuery.data],
  );
  const devices = useMemo(
    () => devicesQuery.data?.data.devices ?? [],
    [devicesQuery.data],
  );
  const lookups = useMemo<SimLookups>(
    () => ({
      tenantNames: new Map(tenants.map(tenant => [
        tenant.id,
        tenant.name,
      ])),
      deviceImeis: new Map(devices.map(device => [
        device.id,
        device.imei,
      ])),
    }),
    [
      tenants,
      devices,
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
    devicesQuery,
    tenants,
    devices,
    lookups,
    sims,
  };
}
