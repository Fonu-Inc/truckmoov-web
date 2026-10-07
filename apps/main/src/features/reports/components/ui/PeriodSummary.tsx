import type { TenantLicence } from "@truckmoov/api/billing";
import type {
  ReportPeriod, ReportsSummary, ReportTrendRange,
} from "@truckmoov/api/fleet";
import type { Row } from "./ReportsShared";
import { useQuery } from "@tanstack/react-query";
import { getTenantLicenceQueryOptions } from "@truckmoov/api/billing";
import {
  getReportsActivityTrendQueryOptions, getReportsSummaryQueryOptions,
} from "@truckmoov/api/fleet";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity, CheckCircle, CreditCard, Download, FileText,
  Fuel, MessageSquare, Package, Route, Truck, Users, Wrench,
} from "lucide-react";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/shadcn/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  exportToCSV, TREND_RANGES,
} from "@/features/reports/utils/reportsUtils";
import { ReportsGate } from "./ReportsGate";
import {
  ActivityRows, RowsSkeleton, SectionCard, SummaryStat,
} from "./ReportsShared";

function TrendRangeSelect({
  value, onChange,
}: {
  value: ReportTrendRange; onChange: (v: ReportTrendRange) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={v => onChange(v as ReportTrendRange)}
    >
      <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        {TREND_RANGES.map(r => (
          <SelectItem
            key={r.value}
            value={r.value}
          >
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ActivityTrendCard({ initialRange }: { initialRange: ReportTrendRange }) {
  const [
    range,
    setRange,
  ] = useState(initialRange);
  const trendQuery = useQuery(getReportsActivityTrendQueryOptions({ params: { range } }));

  return (
    <SectionCard
      title="Activity trend"
      description="Jobs created vs completed"
      action={(
        <TrendRangeSelect
          value={range}
          onChange={setRange}
        />
      )}
    >
      <ReportsGate
        query={trendQuery}
        skeleton={<Skeleton className="h-[240px] w-full" />}
      >
        <ResponsiveContainer
          width="100%"
          height={240}
        >
          <BarChart data={trendQuery.data?.data ?? []}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              allowDecimals={false}
            />
            <Tooltip contentStyle={{
              backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px",
            }}
            />
            <Legend />
            <Bar
              dataKey="created"
              name="Created"
              fill="hsl(var(--primary))"
              radius={[
                6,
                6,
                0,
                0,
              ]}
            />
            <Bar
              dataKey="completed"
              name="Completed"
              fill="hsl(var(--success))"
              radius={[
                6,
                6,
                0,
                0,
              ]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ReportsGate>
    </SectionCard>
  );
}

function subscriptionRow(licence: TenantLicence | null | undefined): Row {
  const base = {
    label: "Subscription", icon: CreditCard,
  };
  if (!licence) {
    return {
      ...base, count: "—", detail: "No active licence",
    };
  }
  const periodEnd = formatWithPattern(
    licence.periodEnd,
    "dd MMM yyyy",
  );
  if (licence.status === "ended") {
    return {
      ...base, count: 0, detail: `${licence.planName} — ended ${periodEnd}`,
    };
  }
  return {
    ...base, count: licence.daysLeft, detail: `${licence.planName} — ${licence.daysLeft} days to renewal (${periodEnd})`,
  };
}

function summaryRows(summary: ReportsSummary, licence: TenantLicence | null | undefined) {
  const {
    operations, fleet, administration,
  } = summary;
  const operationRows: Row[] = [
    {
      label: "Jobs created", count: operations.jobsCreated, detail: "New jobs booked in this period", icon: Package,
    },
    {
      label: "Jobs completed", count: operations.jobsCompleted, detail: "Deliveries marked complete", icon: CheckCircle,
    },
    {
      label: "Jobs in progress", count: operations.jobsInProgress, detail: "Currently on the road", icon: Route,
    },
    {
      label: "Jobs cancelled", count: operations.jobsCancelled, detail: "Cancelled or aborted jobs", icon: FileText,
    },
  ];
  const fleetRows: Row[] = [
    {
      label: "Vehicles added", count: fleet.vehiclesAdded, detail: "New vehicles onboarded", icon: Truck,
    },
    {
      label: "Drivers added", count: fleet.driversAdded, detail: "New drivers registered", icon: Users,
    },
    {
      label: "Vehicles in maintenance", count: fleet.vehiclesInMaintenance, detail: "Currently off the road", icon: Wrench,
    },
    {
      label: "Active vehicles", count: fleet.activeVehicles, detail: "Available for dispatch", icon: Activity,
    },
  ];
  const adminRows: Row[] = [
    {
      label: "Documents uploaded", count: administration.documentsUploaded, detail: "Waybills, PODs and attachments", icon: FileText,
    },
    {
      label: "Driver communications", count: administration.driverCommunications, detail: "Dispatch notifications sent to drivers", icon: MessageSquare,
    },
    subscriptionRow(licence),
    {
      label: "Fuel entries logged", count: administration.fuelEntries, detail: "Fuel transactions recorded", icon: Fuel,
    },
  ];
  return {
    operationRows, fleetRows, adminRows,
  };
}

function periodLabel(mode: ReportPeriod, summary: ReportsSummary) {
  if (mode === "daily") {
    return formatWithPattern(
      summary.period.from,
      "EEEE, dd MMM yyyy",
    );
  }
  return `${formatWithPattern(
    summary.period.from,
    "dd MMM",
  )} – ${formatWithPattern(
    summary.period.to,
    "dd MMM yyyy",
  )}`;
}

export function PeriodSummary({ mode }: { mode: ReportPeriod }) {
  const { format: formatCurrency } = useCurrency();
  const summaryQuery = useQuery(getReportsSummaryQueryOptions({ params: { period: mode } }));
  // A missing or forbidden licence only blanks the Subscription row.
  const licenceQuery = useQuery(getTenantLicenceQueryOptions());
  // The page shell renders immediately; only the parts fed by the summary
  // wait on it, so the trend card's request runs in parallel.
  const summary = summaryQuery.data?.data;
  const rows = summary && summaryRows(
    summary,
    licenceQuery.data?.data,
  );
  const loading = summaryQuery.isPending;
  const operations = summary?.operations;
  const fleet = summary?.fleet;

  const sections: [string, Row[]][] = rows
    ? [
        [
          "Operations",
          rows.operationRows,
        ],
        [
          "Fleet",
          rows.fleetRows,
        ],
        [
          "Administration",
          rows.adminRows,
        ],
      ]
    : [];

  const handleExport = () => summary && exportToCSV(
    `${mode}_summary`,
    [
      "Section",
      "Metric",
      "Value",
    ],
    [
      ...sections.flatMap(([
        section,
        sectionRows,
      ]) => sectionRows.map(r => [
        section,
        r.label,
        r.count,
      ])),
      [
        "Financial",
        "Revenue",
        summary.revenueNgn,
      ],
    ],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{mode === "daily" ? "Daily Summary" : "Weekly Summary"}</h2>
          <p className="text-sm text-muted-foreground min-h-5">
            {summary && periodLabel(
              mode,
              summary,
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!summary}
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-2" />
          {" "}
          Export summary
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryStat
          icon={Package}
          label="Jobs created"
          value={operations ? `${operations.jobsCreated}` : "—"}
          hint={mode === "daily" ? "Today" : "This week"}
          loading={loading}
        />
        <SummaryStat
          icon={CheckCircle}
          label="Jobs completed"
          value={operations ? `${operations.jobsCompleted}` : "—"}
          hint={operations && `${operations.jobsInProgress} in progress`}
          loading={loading}
        />
        <SummaryStat
          icon={Truck}
          label="Vehicles active"
          value={fleet ? `${fleet.activeVehicles}/${fleet.totalVehicles}` : "—"}
          hint={fleet && `${fleet.vehiclesInMaintenance} in maintenance`}
          loading={loading}
        />
        <SummaryStat
          icon={CreditCard}
          label="Revenue booked"
          value={summary ? formatCurrency(summary.revenueNgn) : "—"}
          hint="Completed jobs"
          loading={loading}
        />
      </div>

      <ActivityTrendCard initialRange={mode === "daily" ? "today" : "last_week"} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Operations"
          description="Job and dispatch activity"
        >
          <ReportsGate
            query={summaryQuery}
            skeleton={<RowsSkeleton />}
          >
            {rows && <ActivityRows rows={rows.operationRows} />}
          </ReportsGate>
        </SectionCard>
        <SectionCard
          title="Fleet & people"
          description="Assets and drivers"
        >
          <ReportsGate
            query={summaryQuery}
            skeleton={<RowsSkeleton />}
          >
            {rows && <ActivityRows rows={rows.fleetRows} />}
          </ReportsGate>
        </SectionCard>
        <SectionCard
          title="Administration"
          description="Documents, communications and account"
        >
          <ReportsGate
            query={summaryQuery}
            skeleton={<RowsSkeleton />}
          >
            {rows && <ActivityRows rows={rows.adminRows} />}
          </ReportsGate>
        </SectionCard>
      </div>
    </div>
  );
}
