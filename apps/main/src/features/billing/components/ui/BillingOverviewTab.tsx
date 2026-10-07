import type { ColumnDef } from "@tanstack/react-table";
import type { TenantBillingActivity } from "@truckmoov/api/billing";
import {
  useTenantBillingActivity, useTenantBillingOverview,
} from "@truckmoov/api/billing";
import { Search } from "lucide-react";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { CurrentPlanCard } from "@/features/billing/components/ui/CurrentPlanCard";
import { useDebouncedValue } from "@/features/data-bundle/utils/dataBundle";
import {
  formatDate, monthLabel, ngn,
} from "../../utils/billingHelpers";
import { SectionError } from "../../utils/billingShared";

const PAGE_SIZE = 20;

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 200 80% 45%))",
  "hsl(var(--chart-3, 150 60% 40%))",
  "hsl(var(--chart-4, 32 90% 50%))",
  "hsl(var(--chart-5, 280 60% 55%))",
];

const thousands = (v: number) => `${Math.round(v / 1000)}k`;

function ChartCard({
  title, subtitle, height, state, isEmpty, className, children,
}: {
  title: string;
  subtitle: string;
  height: string;
  state: {
    isLoading: boolean; isError: boolean; refetch: () => unknown;
  };
  isEmpty: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const body = () => {
    if (state.isLoading)
      return <Skeleton className="h-full w-full rounded-xl" />;
    if (state.isError) {
      return (
        <SectionError
          message="Could not load this chart."
          onRetry={() => state.refetch()}
        />
      );
    }
    if (isEmpty)
      return <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No billing data yet.</p>;
    return children;
  };

  return (
    <Card className={`surface-sleek rounded-2xl ${className ?? ""}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </CardHeader>
      <CardContent className={height}>{body()}</CardContent>
    </Card>
  );
}

function BillingCharts() {
  const overview = useTenantBillingOverview();
  const data = overview.data?.data;
  const spendTrend = (data?.spendTrend ?? []).map(m => ({
    month: monthLabel(`${m.month}-01`), invoiced: m.invoicedNgn, paid: m.paidNgn,
  }));
  const spendByCategory = (data?.spendByCategory ?? []).map(c => ({
    name: c.name, value: c.valueNgn,
  }));
  const outstandingTrend = (data?.outstandingTrend ?? []).map(p => ({
    label: monthLabel(p.date), outstanding: p.outstandingNgn,
  }));

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Invoiced vs Paid"
          subtitle="How much you were billed each month and how much you settled."
          height="h-[280px]"
          state={overview}
          isEmpty={spendTrend.length === 0}
          className="lg:col-span-2"
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart data={spendTrend}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={70}
                tickFormatter={thousands}
              />
              <Tooltip formatter={v => ngn(Number(v))} />
              <Legend />
              <Bar
                dataKey="invoiced"
                name="Invoiced"
                fill="hsl(var(--primary))"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
              />
              <Bar
                dataKey="paid"
                name="Paid"
                fill="hsl(var(--muted-foreground))"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Spend by Charge Type"
          subtitle="Where your billing is concentrated."
          height="h-[280px]"
          state={overview}
          isEmpty={spendByCategory.length === 0}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={spendByCategory}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {spendByCategory.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={v => ngn(Number(v))} />
              <Legend
                verticalAlign="bottom"
                height={48}
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title="Outstanding Balance Trend"
        subtitle="Amount left unpaid on each invoice issued to your organization."
        height="h-[240px]"
        state={overview}
        isEmpty={outstandingTrend.length === 0}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart data={outstandingTrend}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={70}
              tickFormatter={thousands}
            />
            <Tooltip formatter={v => ngn(Number(v))} />
            <Line
              type="monotone"
              dataKey="outstanding"
              name="Outstanding"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}

const activityColumns: ColumnDef<TenantBillingActivity>[] = [
  {
    id: "date",
    header: "Date",
    enableSorting: false,
    meta: { className: "whitespace-nowrap" },
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "event",
    header: "Event",
    enableSorting: false,
    meta: { className: "font-medium" },
  },
  {
    accessorKey: "resource",
    header: "Related resource",
    enableSorting: false,
    meta: { className: "text-muted-foreground" },
  },
  {
    id: "impact",
    header: "Financial impact",
    enableSorting: false,
    meta: { className: "text-right tabular-nums" },
    cell: ({ row }) => {
      const impact = row.original.impactNgn;
      return impact === null
        ? <span className="text-muted-foreground">No charge</span>
        : (
            <span className={impact < 0 ? "text-emerald-600" : ""}>
              {impact < 0 ? "−" : "+"}
              {ngn(Math.abs(impact))}
            </span>
          );
    },
  },
];

function BillingActivity() {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    eventFilter,
    setEventFilter,
  ] = useState("all");
  const [
    page,
    setPage,
  ] = useState(1);
  const q = useDebouncedValue(search.trim());

  const activity = useTenantBillingActivity({
    params: {
      q: q || undefined, event: eventFilter === "all" ? undefined : eventFilter, page, pageSize: PAGE_SIZE,
    },
  });
  const list = activity.data?.data;

  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader className="space-y-4">
        <CardTitle>Billing Activity</CardTitle>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search activity, invoice or resource"
              className="pl-9 rounded-xl"
            />
          </div>
          <Select
            value={eventFilter}
            onValueChange={(v) => {
              setEventFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-56 rounded-xl">
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {[...(list?.events ?? [])].sort().map(e => (
                <SelectItem
                  key={e}
                  value={e}
                >
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border overflow-x-auto">
          <DataTable
            columns={activityColumns}
            data={list?.items ?? []}
            isLoading={activity.isLoading}
            isError={activity.isError}
            errorMessage="Could not load your billing activity."
            onRetry={() => activity.refetch()}
            emptyState="No activity matches your filters."
            pagination={list && {
              page,
              pageSize: PAGE_SIZE,
              total: list.total,
              onPageChange: setPage,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function BillingOverviewTab() {
  return (
    <div className="space-y-6">
      <CurrentPlanCard />
      <BillingCharts />
      <BillingActivity />
    </div>
  );
}
