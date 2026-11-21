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

// ponytail: mock data from fleetflow parity port — wire to packages/api
const TOTAL_TENANTS_CHANGE = 10;
// ponytail: mock data from fleetflow parity port — wire to packages/api
const ACTIVE_TENANTS_CHANGE = 12;
// ponytail: mock data from fleetflow parity port — wire to packages/api
const VEHICLES_CHANGE = 8;
// ponytail: mock data from fleetflow parity port — wire to packages/api
const DRIVERS_CHANGE = 15;
// ponytail: mock data from fleetflow parity port — wire to packages/api
const DEVICES_CHANGE = 9;

/** Primary Stats Grid — the only KPIs on this dashboard (fleetflow PlatformDashboard). */
export function OverviewStats({ period }: { period: DashboardPeriod }) {
  const {
    totals,
    loading,
  } = useDashboardTotals(period);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Tenants"
        value={formatCount(totals.tenants)}
        change={TOTAL_TENANTS_CHANGE}
        changeLabel="vs last month"
        icon={Building2}
        loading={loading.tenants}
      />
      <StatCard
        title="Active Tenants"
        value={formatCount(totals.activeTenants)}
        change={ACTIVE_TENANTS_CHANGE}
        changeLabel="vs last month"
        icon={ShieldCheck}
        variant="success"
        loading={loading.activeTenants}
      />
      <StatCard
        title="Total Vehicles by Tenant"
        value={formatCount(totals.vehicles)}
        change={VEHICLES_CHANGE}
        changeLabel="vs last month"
        icon={Truck}
        loading={loading.vehicles}
      />
      <StatCard
        title="Total Drivers by Tenant"
        value={formatCount(totals.drivers)}
        change={DRIVERS_CHANGE}
        changeLabel="vs last month"
        icon={Users}
        loading={loading.drivers}
      />
      <StatCard
        title="Total Devices by Tenant"
        value={formatCount(totals.devices)}
        change={DEVICES_CHANGE}
        changeLabel="vs last month"
        icon={Cpu}
        loading={loading.devices}
      />
    </div>
  );
}
