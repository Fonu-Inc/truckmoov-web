import type { DashboardPeriod } from "@/features/dashboard/utils/dashboardPeriod";
import {
  Building2,
  Cpu,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useDashboardTotals } from "@/features/dashboard/hooks/useDashboardTotals";
import { formatCount } from "./overviewFormat";

/** Primary Stats Grid — the only KPIs on this dashboard (fleetflow PlatformDashboard). */
export function OverviewStats({ period }: { period: DashboardPeriod }) {
  const {
    totals,
    changes,
    loading,
  } = useDashboardTotals(period);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Tenants"
        value={formatCount(totals.tenants)}
        change={changes.tenants}
        changeLabel="vs last month"
        icon={Building2}
        loading={loading.tenants}
      />
      <StatCard
        title="Active Tenants"
        value={formatCount(totals.activeTenants)}
        change={changes.activeTenants}
        changeLabel="vs last month"
        icon={ShieldCheck}
        variant="success"
        loading={loading.activeTenants}
      />
      <StatCard
        title="Total Vehicles by Tenant"
        value={formatCount(totals.vehicles)}
        change={changes.vehicles}
        changeLabel="vs last month"
        icon={Truck}
        loading={loading.vehicles}
      />
      <StatCard
        title="Total Drivers by Tenant"
        value={formatCount(totals.drivers)}
        change={changes.drivers}
        changeLabel="vs last month"
        icon={Users}
        loading={loading.drivers}
      />
      <StatCard
        title="Total Devices by Tenant"
        value={formatCount(totals.devices)}
        change={changes.devices}
        changeLabel="vs last month"
        icon={Cpu}
        loading={loading.devices}
      />
    </div>
  );
}
