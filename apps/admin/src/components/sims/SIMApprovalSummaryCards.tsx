import {
  CheckCircle,
  Clock,
  Wifi,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

type Props = {
  pendingCount: number | string;
  approvedCount: number | string;
  rejectedCount: number | string;
  totalRequested: number | string;
  loading?: boolean;
};

export function SIMApprovalSummaryCards({
  pendingCount,
  approvedCount,
  rejectedCount,
  totalRequested,
  loading = false,
}: Props) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
      <StatCard
        title="Total SIMs Requested"
        value={totalRequested}
        icon={Wifi}
        loading={loading}
      />
      <StatCard
        title="Pending Approval"
        value={pendingCount}
        icon={Clock}
        variant="warning"
        loading={loading}
      />
      <StatCard
        title="Approved"
        value={approvedCount}
        icon={CheckCircle}
        variant="success"
        loading={loading}
      />
      <StatCard
        title="Rejected"
        value={rejectedCount}
        icon={XCircle}
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
