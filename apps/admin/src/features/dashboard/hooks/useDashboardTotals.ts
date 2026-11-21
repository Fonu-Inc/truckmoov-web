import type { DashboardPeriod } from "@/features/dashboard/utils/dashboardPeriod";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemDashboardQueryOptions,
  getSystemDevicesSummaryQueryOptions,
  getSystemTenantsQueryOptions,
  getSystemTenantsSummaryQueryOptions,
} from "@truckmoov/api/auth";
import { filterByPeriod } from "@/features/dashboard/utils/dashboardPeriod";

/**
 * The dashboard's tenant-derived figures, as fleetflow's PlatformDashboard computes
 * them: tenants onboarded within the period (by `createdAt`) drive every total.
 * "overall" reads the all-time summary endpoints instead of summing the list.
 * Values are undefined until their query has data.
 */
export function useDashboardTotals(period: DashboardPeriod) {
  const filtered = period !== "overall";
  const dashboard = useQuery({
    ...getSystemDashboardQueryOptions(),
    enabled: !filtered,
  });
  const summary = useQuery({
    ...getSystemTenantsSummaryQueryOptions(),
    enabled: !filtered,
  });
  const devices = useQuery({
    ...getSystemDevicesSummaryQueryOptions(),
    enabled: !filtered,
  });
  const tenantList = useQuery(getSystemTenantsQueryOptions());

  const listLoaded = tenantList.data !== undefined;
  const periodTenants = filterByPeriod(
    tenantList.data?.data.tenants ?? [],
    period,
    undefined,
    t => t.createdAt,
  );
  const sum = (key: "vehicleCount" | "driverCount" | "deviceCount") =>
    listLoaded
      ? periodTenants.reduce(
          (total, t) => total + t[key],
          0,
        )
      : undefined;

  if (filtered) {
    return {
      periodTenants,
      tenantsLoading: tenantList.isLoading,
      tenantsError: tenantList.isError,
      refetchTenants: tenantList.refetch,
      totals: {
        tenants: listLoaded ? periodTenants.length : undefined,
        activeTenants: listLoaded ? periodTenants.filter(t => t.status === "active").length : undefined,
        vehicles: sum("vehicleCount"),
        drivers: sum("driverCount"),
        devices: sum("deviceCount"),
      },
      loading: {
        tenants: tenantList.isLoading,
        activeTenants: tenantList.isLoading,
        vehicles: tenantList.isLoading,
        drivers: tenantList.isLoading,
        devices: tenantList.isLoading,
      },
    };
  }

  return {
    periodTenants,
    tenantsLoading: tenantList.isLoading,
    tenantsError: tenantList.isError,
    refetchTenants: tenantList.refetch,
    totals: {
      tenants: dashboard.data?.data.totalTenants,
      activeTenants: summary.data?.data.activeTenants,
      vehicles: dashboard.data?.data.totalVehicles,
      drivers: dashboard.data?.data.totalDrivers,
      devices: devices.data?.data.totalDevices,
    },
    loading: {
      tenants: dashboard.isLoading,
      activeTenants: summary.isLoading,
      vehicles: dashboard.isLoading,
      drivers: dashboard.isLoading,
      devices: devices.isLoading,
    },
  };
}
