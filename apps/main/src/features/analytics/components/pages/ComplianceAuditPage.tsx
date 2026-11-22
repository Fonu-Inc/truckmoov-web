import type { FleetComplianceAudit } from "@truckmoov/api/fleet";
import type { ChartPeriod } from "@/features/analytics/components/ui/ChartPeriodFilter";
import { useQuery } from "@tanstack/react-query";
import { getFleetComplianceAuditQueryOptions } from "@truckmoov/api/fleet";
import {
  AlertTriangle, Clock, Shield,
} from "lucide-react";
import { useState } from "react";
import {
  Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip,
} from "recharts";
import { AnalyticsGate } from "@/features/analytics/components/ui/AnalyticsGate";
import { ChartPeriodFilter } from "@/features/analytics/components/ui/ChartPeriodFilter";
import { periodToRange } from "@/features/analytics/utils/period";

export default function ComplianceAuditPage() {
  const [
    chartPeriod,
    setChartPeriod,
  ] = useState<ChartPeriod>("30d");
  const query = useQuery(getFleetComplianceAuditQueryOptions({ params: periodToRange(chartPeriod) }));
  const report = query.data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Compliance Audit Report</h2>
        <p className="text-sm text-muted-foreground">Monitor regulatory compliance, document expiry, and audit readiness across your fleet.</p>
      </div>
      <AnalyticsGate
        isPending={query.isPending}
        isError={query.isError}
        onRetry={() => query.refetch()}
        hasData
        stats={3}
      >
        {report && (
          <ComplianceAuditReport
            report={report}
            chartPeriod={chartPeriod}
            onPeriodChange={setChartPeriod}
          />
        )}
      </AnalyticsGate>
    </div>
  );
}

function rateTone(rate: number): "success" | "warning" | "destructive" {
  if (rate >= 80)
    return "success";
  return rate >= 60 ? "warning" : "destructive";
}

const RATE_CHIP = {
  success: "bg-success/10",
  warning: "bg-warning/10",
  destructive: "bg-destructive/10",
};
const RATE_TEXT = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

function ComplianceAuditReport({
  report, chartPeriod, onPeriodChange,
}: {
  report: FleetComplianceAudit; chartPeriod: ChartPeriod; onPeriodChange: (v: ChartPeriod) => void;
}) {
  const {
    complianceRatePercent: complianceRate, expiringIn30Days: expiringSoon, nonCompliantVehicles,
  } = report.summary;
  const tone = rateTone(complianceRate);

  // The design app's three statuses. A required document with no expiry on
  // record (`missing`) counts as non-compliant.
  const pieData = [
    {
      name: "Compliant", value: report.summary.valid, color: "hsl(var(--success))",
    },
    {
      name: "Expiring Soon", value: report.summary.expiring, color: "hsl(var(--warning))",
    },
    {
      name: "Non-Compliant", value: report.summary.expired + report.summary.missing, color: "hsl(var(--destructive))",
    },
  ].filter(d => d.value > 0);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl surface-sleek text-card-foreground border-border/50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${RATE_CHIP[tone]}`}>
                <Shield className={`h-5 w-5 ${RATE_TEXT[tone]}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Overall Compliance Rate</p>
                <p className={`text-3xl font-bold ${RATE_TEXT[tone]}`}>{`${complianceRate}%`}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl surface-sleek text-card-foreground border-border/50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Expiring in 30 Days</p>
                <p className="text-3xl font-bold text-warning">{expiringSoon}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl surface-sleek text-card-foreground border-border/50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Non-Compliant Assets</p>
                <p className="text-3xl font-bold text-destructive">{nonCompliantVehicles}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl surface-sleek text-card-foreground border-border/50">
        <div className="p-6 pb-4 flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <h3 className="font-semibold tracking-tight text-foreground font-display text-base">Compliance Breakdown</h3>
            <p className="text-sm text-muted-foreground">Share of compliance documents by status — valid, expiring, expired.</p>
          </div>
          <ChartPeriodFilter
            value={chartPeriod}
            onChange={onPeriodChange}
            className="rounded-xl px-3.5"
          />
        </div>
        <div className="p-6 pt-0">
          <ResponsiveContainer
            width="100%"
            height={250}
          >
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map(entry => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={{
                backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px",
              }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
