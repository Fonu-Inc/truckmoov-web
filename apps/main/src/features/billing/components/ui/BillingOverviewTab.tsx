import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import { Search } from "lucide-react";
import {
  useMemo, useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { useCurrency } from "@/contexts/CurrencyContext";

import { CurrentPlanCard } from "@/features/billing/components/ui/CurrentPlanCard";
import {
  billingActivity,
  formatDate,
  invoiceOutstanding,
  invoices,
  invoiceTotal,
  lineTotal,
  payments,
} from "@/features/billing/utils/enterpriseBillingData";

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 200 80% 45%))",
  "hsl(var(--chart-3, 150 60% 40%))",
  "hsl(var(--chart-4, 32 90% 50%))",
  "hsl(var(--chart-5, 280 60% 55%))",
];

function monthLabel(iso: string) {
  return formatWithPattern(
    iso,
    "MMM yy",
  );
}

export function BillingOverviewTab() {
  const { format } = useCurrency();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    eventFilter,
    setEventFilter,
  ] = useState("all");

  const events = useMemo(
    () => Array.from(new Set(billingActivity.map(a => a.event))).sort(),
    [],
  );

  // ── Analytics ────────────────────────────────────────────────
  const spendTrend = useMemo(
    () => {
      const byMonth = new Map<string, {
        month: string; invoiced: number; paid: number; sort: string;
      }>();
      invoices.forEach((inv) => {
        const key = inv.invoiceDate.slice(
          0,
          7,
        );
        const row = byMonth.get(key) ?? {
          month: monthLabel(inv.invoiceDate), invoiced: 0, paid: 0, sort: key,
        };
        row.invoiced += invoiceTotal(inv);
        byMonth.set(
          key,
          row,
        );
      });
      payments
        .filter(p => p.status === "successful")
        .forEach((p) => {
          const key = p.date.slice(
            0,
            7,
          );
          const row = byMonth.get(key) ?? {
            month: monthLabel(p.date), invoiced: 0, paid: 0, sort: key,
          };
          row.paid += p.amount;
          byMonth.set(
            key,
            row,
          );
        });
      return Array.from(byMonth.values()).sort((a, b) => a.sort.localeCompare(b.sort));
    },
    [],
  );

  const spendByCategory = useMemo(
    () => {
      const totals = new Map<string, number>();
      invoices.forEach(inv =>
        inv.lines.forEach(l => totals.set(
          l.category,
          (totals.get(l.category) ?? 0) + lineTotal(l),
        )));
      return Array.from(totals.entries())
        .map(([
          name,
          value,
        ]) => ({
          name, value,
        }))
        .sort((a, b) => b.value - a.value);
    },
    [],
  );

  const outstandingTrend = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate))
        .map(inv => ({
          label: monthLabel(inv.invoiceDate),
          outstanding: invoiceOutstanding(inv),
        })),
    [],
  );

  const activity = billingActivity.filter((a) => {
    const matchesSearch
      = !search
        || `${a.event} ${a.resource}`.toLowerCase().includes(search.toLowerCase());
    const matchesEvent = eventFilter === "all" || a.event === eventFilter;
    return matchesSearch && matchesEvent;
  });

  const money = (v: number) => format(v);

  return (
    <div className="space-y-6">
      <CurrentPlanCard />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="surface-sleek rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoiced vs Paid</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              How much you were billed each month and how much you settled.
            </p>
          </CardHeader>
          <CardContent className="h-[280px]">
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
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip formatter={v => money(Number(v))} />
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
          </CardContent>
        </Card>

        <Card className="surface-sleek rounded-2xl">
          <CardHeader>
            <CardTitle>Spend by Charge Type</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Where your billing is concentrated.</p>
          </CardHeader>
          <CardContent className="h-[280px]">
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
                <Tooltip formatter={v => money(Number(v))} />
                <Legend
                  verticalAlign="bottom"
                  height={48}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-sleek rounded-2xl">
        <CardHeader>
          <CardTitle>Outstanding Balance Trend</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Amount left unpaid on each invoice issued to your organization.
          </p>
        </CardHeader>
        <CardContent className="h-[240px]">
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
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip formatter={v => money(Number(v))} />
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
        </CardContent>
      </Card>

      <Card className="surface-sleek rounded-2xl">
        <CardHeader className="space-y-4">
          <CardTitle>Billing Activity</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search activity, invoice or resource"
                className="pl-9 rounded-xl"
              />
            </div>
            <Select
              value={eventFilter}
              onValueChange={setEventFilter}
            >
              <SelectTrigger className="w-full sm:w-56 rounded-xl">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {events.map(e => (
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
                {activity.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(a.date)}</TableCell>
                    <TableCell className="font-medium">{a.event}</TableCell>
                    <TableCell className="text-muted-foreground">{a.resource}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {a.impact === null ? (
                        <span className="text-muted-foreground">No charge</span>
                      ) : (
                        <span className={a.impact < 0 ? "text-emerald-600" : ""}>
                          {a.impact < 0 ? "−" : "+"}
                          {format(Math.abs(a.impact))}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {activity.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      No activity matches your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
