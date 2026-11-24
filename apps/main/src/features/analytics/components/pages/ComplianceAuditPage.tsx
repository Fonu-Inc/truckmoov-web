import type { FleetComplianceAudit } from "@truckmoov/api/fleet";
import type { ChartPeriod } from "@/features/analytics/components/ui/ChartPeriodFilter";
import { useQuery } from "@tanstack/react-query";
import { getFleetComplianceAuditQueryOptions } from "@truckmoov/api/fleet";
import {
  Activity, AlertTriangle, Clock, Shield,
} from "lucide-react";
import { useState } from "react";
import {
  Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
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

const CARD = "rounded-2xl surface-sleek text-card-foreground border-border/50";
const CARD_TITLE = "font-semibold tracking-tight text-foreground font-display text-base";

function humanize(value: string): string {
  const words = value.replace(
    /[_-]/g,
    " ",
  ).toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function rateTone(rate: number | null): "muted" | "success" | "warning" | "destructive" {
  if (rate === null)
    return "muted";
  if (rate >= 80)
    return "success";
  return rate >= 60 ? "warning" : "destructive";
}

const RATE_CHIP = {
  muted: "bg-muted",
  success: "bg-success/10",
  warning: "bg-warning/10",
  destructive: "bg-destructive/10",
};
const RATE_TEXT = {
  muted: "text-muted-foreground",
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
    expiringIn30Days: expiringSoon, nonCompliantVehicles,
  } = report.summary;
  // With nothing on record there is no rate to report.
  const complianceRate = report.summary.total > 0 ? report.summary.complianceRatePercent : null;
  const tone = rateTone(complianceRate);

  // Expired documents and missing driver-licence expiries are shown apart, so
  // the slices read the same way as the vehicle count beside them.
  const pieData = [
    {
      name: "Compliant", value: report.summary.valid, color: "hsl(var(--success))",
    },
    {
      name: "Expiring Soon", value: report.summary.expiring, color: "hsl(var(--warning))",
    },
    {
      name: "Expired", value: report.summary.expired, color: "hsl(var(--destructive))",
    },
    {
      name: "Missing Licence Expiry", value: report.summary.missing, color: "hsl(var(--muted-foreground))",
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
                <p className={`text-3xl font-bold ${RATE_TEXT[tone]}`}>{complianceRate === null ? "-" : `${complianceRate}%`}</p>
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
                <p className="text-xs text-muted-foreground">Vehicles holding an expired document</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl surface-sleek text-card-foreground border-border/50">
        <div className="p-6 pb-4 flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <h3 className="font-semibold tracking-tight text-foreground font-display text-base">Compliance Breakdown</h3>
            <p className="text-sm text-muted-foreground">Current documents and driver licences by status: valid, expiring, expired, missing.</p>
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

      <div className={CARD}>
        <div className="p-6 pb-4 space-y-1">
          <h3 className={CARD_TITLE}>Compliance by Category</h3>
          <p className="text-sm text-muted-foreground">Document status per category as of today.</p>
        </div>
        <div className="p-6 pt-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Valid</TableHead>
                <TableHead className="text-right">Expiring</TableHead>
                <TableHead className="text-right">Expired</TableHead>
                <TableHead className="text-right">Missing</TableHead>
                <TableHead className="text-right">Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.categories.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-20 text-center text-muted-foreground"
                  >
                    No compliance documents on record
                  </TableCell>
                </TableRow>
              )}
              {report.categories.map(c => (
                <TableRow key={c.category}>
                  <TableCell className="font-medium">{humanize(c.category)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.valid}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.expiring}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.expired}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.missing}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${RATE_TEXT[rateTone(c.total > 0 ? c.complianceRatePercent : null)]}`}>
                    {c.total > 0 ? `${c.complianceRatePercent}%` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {report.activity && (
        <div className={CARD}>
          <div className="p-6 pb-4 space-y-1">
            <h3 className={`${CARD_TITLE} flex items-center gap-2`}>
              <Activity className="h-4 w-4" />
              Audit Activity
            </h3>
            <p className="text-sm text-muted-foreground">
              {`${report.activity.totalEvents}${report.activity.truncated ? "+" : ""} audit-log events in the selected period.`}
            </p>
          </div>
          <div className="p-6 pt-0 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                title: "By record type", items: report.activity.byEntityType.map(e => ({
                  label: humanize(e.entityType), count: e.count,
                })),
              },
              {
                title: "Top actions", items: report.activity.topActions.map(a => ({
                  label: humanize(a.action), count: a.count,
                })),
              },
            ].map(group => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.title}</p>
                {group.items.length === 0
                  ? <p className="text-sm text-muted-foreground">No activity in this period</p>
                  : (
                      <ul className="space-y-1.5 text-sm">
                        {group.items.map(item => (
                          <li
                            key={item.label}
                            className="flex justify-between gap-3"
                          >
                            <span className="truncate">{item.label}</span>
                            <span className="tabular-nums font-medium">{item.count}</span>
                          </li>
                        ))}
                      </ul>
                    )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
