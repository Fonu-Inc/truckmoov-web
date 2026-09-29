import type { Row } from "./ReportsShared";
import type { TrendRange } from "@/features/reports/utils/reportsUtils";
import {
  endOfDay, formatWithPattern, isWithinRange, startOfDay, startOfWeek,
} from "@truckmoov/app-core/utils/time-utils";
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

import { useCurrency } from "@/contexts/CurrencyContext";
import { useReportsData } from "@/features/reports/hooks/useReportsData";
import {
  buildTrend, exportToCSV, TREND_RANGES,
} from "@/features/reports/utils/reportsUtils";
import { ReportsGate } from "./ReportsGate";
import {
  ActivityRows, SectionCard, SummaryStat,
} from "./ReportsShared";

function TrendRangeSelect({
  value, onChange,
}: {
  value: TrendRange; onChange: (v: TrendRange) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={v => onChange(v as TrendRange)}
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

export function PeriodSummary({ mode }: { mode: "daily" | "weekly" }) {
  const data = useReportsData();
  const {
    vehicles, drivers, jobs,
  } = data;
  const { format: formatCurrency } = useCurrency();
  const [
    trendRange,
    setTrendRange,
  ] = useState<TrendRange>(mode === "daily" ? "today" : "last_week");
  const [now] = useState(() => new Date());
  const start = mode === "daily" ? startOfDay(now) : startOfWeek(now);
  const end = endOfDay(now);
  const within = (d?: string | null) => !!d && isWithinRange(
    d,
    start,
    end,
  );

  const jobsCreated = jobs.filter(j => within(j.createdAt));
  const jobsCompleted = jobs.filter(j => [
    "completed",
    "delivered",
  ].includes(j.status) && within(j.updatedAt));
  const jobsInProgress = jobs.filter(j => [
    "in_progress",
    "en-route",
    "arrived",
    "loaded",
  ].includes(j.status));
  const jobsCancelled = jobs.filter(j => j.status === "cancelled" && within(j.updatedAt));
  const driversAdded = drivers.filter(d => within(d.createdAt));
  const inMaintenance = vehicles.filter(v => v.status === "maintenance");
  const revenue = jobsCompleted.reduce(
    (s, j) => s + (j.amountNgn),
    0,
  );

  const rangeLabel = mode === "daily"
    ? formatWithPattern(
        now,
        "EEEE, dd MMM yyyy",
      )
    : `${formatWithPattern(
      start,
      "dd MMM",
    )} – ${formatWithPattern(
      now,
      "dd MMM yyyy",
    )}`;

  const operations: Row[] = [
    {
      label: "Jobs created", count: jobsCreated.length, detail: "New jobs booked in this period", icon: Package,
    },
    {
      label: "Jobs completed", count: jobsCompleted.length, detail: "Deliveries marked complete", icon: CheckCircle,
    },
    {
      label: "Jobs in progress", count: jobsInProgress.length, detail: "Currently on the road", icon: Route,
    },
    {
      label: "Jobs cancelled", count: jobsCancelled.length, detail: "Cancelled or aborted jobs", icon: FileText,
    },
  ];

  const fleet: Row[] = [
    {
      label: "Vehicles added", count: "\u2014", detail: "Onboarding dates unavailable", icon: Truck,
    },
    {
      label: "Drivers added", count: driversAdded.length, detail: "New drivers registered", icon: Users,
    },
    {
      label: "Vehicles in maintenance", count: inMaintenance.length, detail: "Currently off the road", icon: Wrench,
    },
    {
      label: "Active vehicles", count: vehicles.filter(v => v.status === "active").length, detail: "Available for dispatch", icon: Activity,
    },
  ];

  // ponytail: missing report metrics stay unavailable until a reporting endpoint supplies them.
  const admin: Row[] = [
    {
      label: "Documents uploaded", count: jobsCompleted.filter(j => j.attachments.length).length, detail: "Waybills, PODs and attachments", icon: FileText,
    },
    {
      label: "Driver communications", count: "\u2014", detail: "Communication totals unavailable", icon: MessageSquare,
    },
    {
      label: "Subscription", count: "\u2014", detail: "Subscription activity unavailable", icon: CreditCard,
    },
    {
      label: "Fuel entries logged", count: "\u2014", detail: "Fuel entry totals unavailable", icon: Fuel,
    },
  ];

  const trend = buildTrend(
    jobs,
    trendRange,
  );

  const handleExport = () => exportToCSV(
    `${mode}_summary`,
    [
      "Section",
      "Metric",
      "Value",
    ],
    [
      ...operations.map(r => [
        "Operations",
        r.label,
        r.count,
      ] as (string | number)[]),
      ...fleet.map(r => [
        "Fleet",
        r.label,
        r.count,
      ] as (string | number)[]),
      ...admin.map(r => [
        "Administration",
        r.label,
        r.count,
      ] as (string | number)[]),
      [
        "Financial",
        "Revenue",
        revenue,
      ],
    ],
  );

  return (
    <ReportsGate data={data}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{mode === "daily" ? "Daily Summary" : "Weekly Summary"}</h2>
            <p className="text-sm text-muted-foreground">{rangeLabel}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
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
            value={`${jobsCreated.length}`}
            hint={mode === "daily" ? "Today" : "This week"}
          />
          <SummaryStat
            icon={CheckCircle}
            label="Jobs completed"
            value={`${jobsCompleted.length}`}
            hint={`${jobsInProgress.length} in progress`}
          />
          <SummaryStat
            icon={Truck}
            label="Vehicles active"
            value={`${vehicles.filter(v => v.status === "active").length}/${vehicles.length}`}
            hint={`${inMaintenance.length} in maintenance`}
          />
          <SummaryStat
            icon={CreditCard}
            label="Revenue booked"
            value={formatCurrency(revenue)}
            hint="Completed jobs"
          />
        </div>

        <SectionCard
          title="Activity trend"
          description="Jobs created vs completed"
          action={(
            <TrendRangeSelect
              value={trendRange}
              onChange={setTrendRange}
            />
          )}
        >
          <ResponsiveContainer
            width="100%"
            height={240}
          >
            <BarChart data={trend}>
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
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard
            title="Operations"
            description="Job and dispatch activity"
          >
            <ActivityRows rows={operations} />
          </SectionCard>
          <SectionCard
            title="Fleet & people"
            description="Assets and drivers"
          >
            <ActivityRows rows={fleet} />
          </SectionCard>
          <SectionCard
            title="Administration"
            description="Documents, communications and account"
          >
            <ActivityRows rows={admin} />
          </SectionCard>
        </div>
      </div>
    </ReportsGate>
  );
}
