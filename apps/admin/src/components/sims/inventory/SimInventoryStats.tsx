import type { SystemSimsSummary } from "@truckmoov/api/auth";
import {
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Wifi,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { EMPTY_VALUE } from "./simInventoryShared";

type SimInventoryStatsProps = {
  summary: SystemSimsSummary | undefined;
  loading: boolean;
};

export function SimInventoryStats({
  summary,
  loading,
}: SimInventoryStatsProps) {
  const value = (count: number | undefined) => count ?? EMPTY_VALUE;

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <StatCard
        title="Total SIMs"
        value={value(summary?.total)}
        icon={Wifi}
        loading={loading}
      />
      <StatCard
        title="Active"
        value={value(summary?.active)}
        icon={CheckCircle}
        variant="success"
        loading={loading}
      />
      <StatCard
        title="Assigned"
        value={value(summary?.assigned)}
        icon={Smartphone}
        loading={loading}
      />
      <StatCard
        title="Unassigned"
        value={value(summary?.unassigned)}
        icon={AlertTriangle}
        variant="warning"
        loading={loading}
      />
      <StatCard
        title="Suspended"
        value={value(summary?.suspended)}
        icon={XCircle}
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
