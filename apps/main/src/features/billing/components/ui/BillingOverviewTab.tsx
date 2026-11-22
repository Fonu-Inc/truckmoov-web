import {
  useTenantBillingActivity, useTenantBillingOverview,
} from "@truckmoov/api/billing";
import { Search } from "lucide-react";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { CurrentPlanCard } from "@/features/billing/components/ui/CurrentPlanCard";
import { useDebouncedValue } from "@/features/data-bundle/utils/dataBundle";
import { FleetTablePager } from "@/features/fleet/components/ui/FleetTablePager";
import { cn } from "@/lib/utils";
import {
  formatDate, monthLabel, ngn,
} from "../../utils/billingHelpers";
import {
  BILLING_CARD, BILLING_CARD_SUBTITLE, BILLING_CARD_TITLE, BILLING_PAGE_SIZE, SectionError, TableStateRows,
} from "../../utils/billingShared";

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 200 80% 45%))",
  "hsl(var(--chart-3, 150 60% 40%))",
  "hsl(var(--chart-4, 32 90% 50%))",
  "hsl(var(--chart-5, 280 60% 55%))",
];

const thousands = (v: number) => `${Math.round(v / 1000)}k`;

function ChartCard({
  title, lead = BILLING_CARD_SUBTITLE, subtitle, height, state, isEmpty, className, children,
}: {
  title: string;
  /** The first muted line under the title (the design app repeats the card subtitle here). */
  lead?: string;
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
    <div className={cn(
      BILLING_CARD,
      className,
    )}
    >
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <h3 className={BILLING_CARD_TITLE}>{title}</h3>
        <p className="text-sm text-muted-foreground mt-1.5">{lead}</p>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className={cn(
        "p-6 pt-0",
        height,
      )}
      >
        {body()}
      </div>
    </div>
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
        lead="Details and current information for outstanding balance trend."
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

function Impact({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-muted-foreground">No charge</span>;
  return value < 0
    ? <span className="text-emerald-600">{`−${ngn(Math.abs(value))}`}</span>
    : <span>{`+${ngn(value)}`}</span>;
}

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
      q: q || undefined, event: eventFilter === "all" ? undefined : eventFilter, page, pageSize: BILLING_PAGE_SIZE,
    },
  });
  const list = activity.data?.data;
  const rows = list?.items ?? [];

  return (
    <div className={BILLING_CARD}>
      <div className="flex flex-col p-6 pb-4 space-y-4">
        <h3 className={BILLING_CARD_TITLE}>Billing Activity</h3>
        <p className="text-sm text-muted-foreground mt-1.5">{BILLING_CARD_SUBTITLE}</p>
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
            <SelectTrigger className="h-10 px-3.5 w-full sm:w-56 rounded-xl">
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
      </div>
      <div className="p-6 pt-0">
        <div className="rounded-2xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Related resource</TableHead>
                <TableHead className="text-right">Financial impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableStateRows
                colSpan={4}
                isLoading={activity.isLoading}
                isError={activity.isError}
                errorMessage="Could not load your billing activity."
                onRetry={() => activity.refetch()}
                isEmpty={rows.length === 0}
                emptyMessage="No activity matches your filters."
              />
              {!activity.isLoading && !activity.isError && rows.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(a.date)}</TableCell>
                  <TableCell className="font-medium">{a.event}</TableCell>
                  <TableCell className="text-muted-foreground">{a.resource}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Impact value={a.impactNgn} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {list && (
          <FleetTablePager
            page={page}
            pageSize={BILLING_PAGE_SIZE}
            total={list.total}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
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
