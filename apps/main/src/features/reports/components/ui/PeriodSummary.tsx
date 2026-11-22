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
  Activity, CheckCircle, CreditCard, FileText,
  Fuel, MessageSquare, Package, Route, Truck, Users, Wrench,
} from "lucide-react";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TREND_RANGES } from "@/features/reports/utils/reportsUtils";
import { PageHeader } from "@/shared/components/layout/PageHeader";
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
      <SelectTrigger className="h-9 px-3.5 rounded-xl w-[150px]"><SelectValue /></SelectTrigger>
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
  if (licence.status === "ended") {
    return {
      ...base, count: 0, detail: `${licence.planName} — ended`,
    };
  }
  return {
    ...base, count: 1, detail: "Active plan — no changes in this period",
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

/** "16 Nov – 21 Nov 2026" — the design app shows the period as a range on both tabs. */
function periodLabel(summary: ReportsSummary) {
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

  return (
    <>
      <PageHeader
        title={mode === "daily" ? "Daily Summary" : "Weekly Summary"}
        description={`Key totals and recent operational activity for this account.${summary ? `\n${periodLabel(summary)}` : ""}`}
      />
      <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="space-y-4">
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
      </div>
    </>
  );
}
