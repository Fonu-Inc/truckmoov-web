import { TrendingUp } from "lucide-react";
import {
  useMemo, useState,
} from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

type Transaction = {
  id: string;
  transaction_type: string;
  communication_type: string | null;
  quantity: number | null;
  amount_ngn: number;
  created_at: string;
};

type UsageAnalyticsChartProps = { transactions: Transaction[] };

const COLORS = {
  call: "hsl(217, 91%, 60%)",
  sms: "hsl(142, 71%, 45%)",
  whatsapp: "hsl(160, 84%, 39%)",
};

type DateRange = "today" | "yesterday" | "last_7_days" | "last_30_days" | "last_90_days";

const RANGE_OPTIONS: {
  value: DateRange; label: string;
}[] = [
  {
    value: "today", label: "Today",
  },
  {
    value: "yesterday", label: "Yesterday",
  },
  {
    value: "last_7_days", label: "Last 7 days",
  },
  {
    value: "last_30_days", label: "Last 30 days",
  },
  {
    value: "last_90_days", label: "Last 90 days",
  },
];

function getRangeBounds(range: DateRange): {
  start: Date; end: Date; days: number;
} {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setHours(
    0,
    0,
    0,
    0,
  );

  switch (range) {
    case "today":
      return {
        start, end, days: 1,
      };
    case "yesterday": {
      const yStart = new Date(start);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(start);
      yEnd.setMilliseconds(-1);
      return {
        start: yStart, end: yEnd, days: 1,
      };
    }
    case "last_7_days":
      start.setDate(start.getDate() - 6);
      return {
        start, end, days: 7,
      };
    case "last_30_days":
      start.setDate(start.getDate() - 29);
      return {
        start, end, days: 30,
      };
    case "last_90_days":
      start.setDate(start.getDate() - 89);
      return {
        start, end, days: 90,
      };
  }
}

function DateRangeSelect({
  value, onChange,
}: {
  value: DateRange; onChange: (v: DateRange) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={v => onChange(v as DateRange)}
    >
      <SelectTrigger className="h-7 w-[120px] shrink-0 text-[11px] px-2">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map(opt => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-xs"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ height }}
    >
      No spending data for the selected range
    </div>
  );
}

export function UsageAnalyticsChart({ transactions }: UsageAnalyticsChartProps) {
  const [
    dailyRange,
    setDailyRange,
  ] = useState<DateRange>("last_30_days");
  const [
    weeklyRange,
    setWeeklyRange,
  ] = useState<DateRange>("last_30_days");
  const [
    channelRange,
    setChannelRange,
  ] = useState<DateRange>("last_30_days");

  const filterByRange = (range: DateRange) => {
    const {
      start, end,
    } = getRangeBounds(range);
    return transactions.filter((tx) => {
      if (tx.transaction_type !== "debit")
        return false;
      const d = new Date(tx.created_at);
      return d >= start && d <= end;
    });
  };

  // Daily/period spending trend
  const dailyData = useMemo(
    () => {
      const {
        start, days,
      } = getRangeBounds(dailyRange);
      const debits = filterByRange(dailyRange);

      const map = new Map<string, {
        call: number; sms: number; whatsapp: number; total: number;
      }>();
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split("T")[0];
        map.set(
          key,
          {
            call: 0, sms: 0, whatsapp: 0, total: 0,
          },
        );
      }

      debits.forEach((tx) => {
        const key = new Date(tx.created_at).toISOString().split("T")[0];
        if (map.has(key)) {
          const entry = map.get(key)!;
          const type = tx.communication_type as "call" | "sms" | "whatsapp";
          if (type && entry[type] !== undefined)
            entry[type] += tx.amount_ngn;
          entry.total += tx.amount_ngn;
        }
      });

      return Array.from(map.entries()).map(([
        date,
        data,
      ]) => ({
        date: new Date(date).toLocaleDateString(
          "en-GB",
          {
            day: "numeric", month: "short",
          },
        ),
        ...data,
      }));
    },
    [
      transactions,
      dailyRange,
    ],
  );

  // Weekly breakdown — buckets sized to range
  const weeklyBreakdown = useMemo(
    () => {
      const {
        start, days,
      } = getRangeBounds(weeklyRange);
      const debits = filterByRange(weeklyRange);

      // Choose sensible bucket count
      const bucketCount = days <= 1 ? 4 : days <= 7 ? 7 : days <= 30 ? 4 : 12;
      const bucketDays = days / bucketCount;

      const buckets: {
        label: string; call: number; sms: number; whatsapp: number;
      }[] = [];
      for (let i = 0; i < bucketCount; i++) {
        buckets.push({
          label: bucketCount <= 7 ? `${i + 1}` : `B${i + 1}`,
          call: 0,
          sms: 0,
          whatsapp: 0,
        });
      }

      debits.forEach((tx) => {
        const txDate = new Date(tx.created_at);
        const diffMs = txDate.getTime() - start.getTime();
        const dayOffset = diffMs / (1000 * 60 * 60 * 24);
        const idx = Math.min(
          bucketCount - 1,
          Math.max(
            0,
            Math.floor(dayOffset / bucketDays),
          ),
        );
        const type = tx.communication_type as "call" | "sms" | "whatsapp";
        if (type && buckets[idx][type] !== undefined)
          buckets[idx][type] += tx.amount_ngn;
      });

      return buckets;
    },
    [
      transactions,
      weeklyRange,
    ],
  );

  // Channel distribution
  const channelDistribution = useMemo(
    () => {
      const debits = filterByRange(channelRange);
      const totals = debits.reduce(
        (acc, tx) => {
          const type = tx.communication_type;
          if (type)
            acc[type] = (acc[type] || 0) + tx.amount_ngn;
          return acc;
        },
        {} as Record<string, number>,
      );

      return Object.entries(totals).map(([
        name,
        value,
      ]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: COLORS[name as keyof typeof COLORS] || "#888",
      }));
    },
    [
      transactions,
      channelRange,
    ],
  );

  const totalSpent = channelDistribution.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const dailyRangeLabel = RANGE_OPTIONS.find(o => o.value === dailyRange)?.label.toLowerCase();
  const weeklyRangeLabel = RANGE_OPTIONS.find(o => o.value === weeklyRange)?.label.toLowerCase();
  const channelRangeLabel = RANGE_OPTIONS.find(o => o.value === channelRange)?.label.toLowerCase();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Daily Spending Trend */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex flex-nowrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base truncate">
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">Daily Spending Trend</span>
              </CardTitle>
              <CardDescription className="text-xs truncate">
                Communication spending over the
                {dailyRangeLabel}
              </CardDescription>
            </div>
            <DateRangeSelect
              value={dailyRange}
              onChange={setDailyRange}
            />
          </div>
        </CardHeader>
        <CardContent>
          {!dailyData.some(d => d.total > 0) ? <EmptyChart height={250} /> : (
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <AreaChart
                data={dailyData}
                margin={{
                  top: 10, right: 30, left: 0, bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="colorCall"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.call}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.call}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="colorSms"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.sms}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.sms}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="colorWhatsapp"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.whatsapp}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.whatsapp}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={v => `₦${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [
                    `₦${value.toLocaleString()}`,
                    "",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="call"
                  stackId="1"
                  stroke={COLORS.call}
                  fillOpacity={1}
                  fill="url(#colorCall)"
                  name="Calls"
                />
                <Area
                  type="monotone"
                  dataKey="sms"
                  stackId="1"
                  stroke={COLORS.sms}
                  fillOpacity={1}
                  fill="url(#colorSms)"
                  name="SMS"
                />
                <Area
                  type="monotone"
                  dataKey="whatsapp"
                  stackId="1"
                  stroke={COLORS.whatsapp}
                  fillOpacity={1}
                  fill="url(#colorWhatsapp)"
                  name="WhatsApp"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Weekly Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex flex-nowrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm truncate">Spending Breakdown</CardTitle>
              <CardDescription className="text-xs truncate">
                Spending by channel for the
                {weeklyRangeLabel}
              </CardDescription>
            </div>
            <DateRangeSelect
              value={weeklyRange}
              onChange={setWeeklyRange}
            />
          </div>
        </CardHeader>
        <CardContent>
          {!weeklyBreakdown.some(w => w.call + w.sms + w.whatsapp > 0) ? <EmptyChart height={200} /> : (
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <BarChart
                data={weeklyBreakdown}
                margin={{
                  top: 10, right: 10, left: -10, bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="label"
                  className="text-xs"
                  tick={{
                    fill: "hsl(var(--muted-foreground))", fontSize: 11,
                  }}
                />
                <YAxis
                  className="text-xs"
                  tick={{
                    fill: "hsl(var(--muted-foreground))", fontSize: 10,
                  }}
                  tickFormatter={v => `₦${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [
                    `₦${value.toLocaleString()}`,
                    "",
                  ]}
                />
                <Bar
                  dataKey="call"
                  fill={COLORS.call}
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                  name="Calls"
                />
                <Bar
                  dataKey="sms"
                  fill={COLORS.sms}
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                  name="SMS"
                />
                <Bar
                  dataKey="whatsapp"
                  fill={COLORS.whatsapp}
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                  name="WhatsApp"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Channel Distribution */}
      <Card>
        <CardHeader>
          <div className="flex flex-nowrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm truncate">Channel Distribution</CardTitle>
              <CardDescription className="text-xs truncate">
                Spending by channel for the
                {channelRangeLabel}
              </CardDescription>
            </div>
            <DateRangeSelect
              value={channelRange}
              onChange={setChannelRange}
            />
          </div>
        </CardHeader>
        <CardContent>
          {channelDistribution.length === 0 ? <EmptyChart height={180} /> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer
                width="50%"
                height={180}
              >
                <PieChart>
                  <Pie
                    data={channelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {channelDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      `₦${value.toLocaleString()}`,
                      "",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {channelDistribution.map(item => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ₦
                        {item.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {totalSpent > 0 ? ((item.value / totalSpent) * 100).toFixed(0) : 0}
                        %
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
