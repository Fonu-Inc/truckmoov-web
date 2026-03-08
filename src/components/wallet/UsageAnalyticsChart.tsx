import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Phone, MessageSquare, MessageCircle } from "lucide-react";

interface Transaction {
  id: string;
  transaction_type: string;
  communication_type: string | null;
  quantity: number | null;
  amount_ngn: number;
  created_at: string;
}

interface UsageAnalyticsChartProps {
  transactions: Transaction[];
}

const COLORS = {
  call: "hsl(217, 91%, 60%)",
  sms: "hsl(142, 71%, 45%)",
  whatsapp: "hsl(160, 84%, 39%)",
};

export function UsageAnalyticsChart({ transactions }: UsageAnalyticsChartProps) {
  const { dailyData, weeklyBreakdown, channelDistribution } = useMemo(() => {
    // Filter to last 30 days debits only
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentDebits = transactions.filter(tx => 
      tx.transaction_type === 'debit' && 
      new Date(tx.created_at) >= thirtyDaysAgo
    );

    // Group by day for area chart
    const dailyMap = new Map<string, { call: number; sms: number; whatsapp: number; total: number }>();
    
    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyMap.set(key, { call: 0, sms: 0, whatsapp: 0, total: 0 });
    }

    recentDebits.forEach(tx => {
      const dateKey = new Date(tx.created_at).toISOString().split('T')[0];
      if (dailyMap.has(dateKey)) {
        const entry = dailyMap.get(dateKey)!;
        const type = tx.communication_type as 'call' | 'sms' | 'whatsapp';
        if (type && entry[type] !== undefined) {
          entry[type] += tx.amount_ngn;
        }
        entry.total += tx.amount_ngn;
      }
    });

    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      ...data,
    }));

    // Group by week for bar chart
    const weeklyMap = new Map<string, { call: number; sms: number; whatsapp: number }>();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
      const key = `Week ${4 - i}`;
      weeklyMap.set(key, { call: 0, sms: 0, whatsapp: 0 });
    }

    recentDebits.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.min(3, Math.floor(diffDays / 7));
      const weekKey = `Week ${4 - weekIndex}`;
      
      if (weeklyMap.has(weekKey)) {
        const entry = weeklyMap.get(weekKey)!;
        const type = tx.communication_type as 'call' | 'sms' | 'whatsapp';
        if (type && entry[type] !== undefined) {
          entry[type] += tx.amount_ngn;
        }
      }
    });

    const weeklyBreakdown = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      ...data,
    }));

    // Channel distribution for pie chart
    const channelTotals = recentDebits.reduce((acc, tx) => {
      const type = tx.communication_type;
      if (type) {
        acc[type] = (acc[type] || 0) + tx.amount_ngn;
      }
      return acc;
    }, {} as Record<string, number>);

    const channelDistribution = Object.entries(channelTotals).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as keyof typeof COLORS] || '#888',
    }));

    return { dailyData, weeklyBreakdown, channelDistribution };
  }, [transactions]);

  const totalSpent = channelDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Daily Spending Trend */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Daily Spending Trend
          </CardTitle>
          <CardDescription>Communication spending over the last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyData.every(d => d.total === 0) ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No spending data for the last 14 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.call} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.call} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.sms} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.sms} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWhatsapp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.whatsapp} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.whatsapp} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₦${v}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="call" stackId="1" stroke={COLORS.call} fillOpacity={1} fill="url(#colorCall)" name="Calls" />
                <Area type="monotone" dataKey="sms" stackId="1" stroke={COLORS.sms} fillOpacity={1} fill="url(#colorSms)" name="SMS" />
                <Area type="monotone" dataKey="whatsapp" stackId="1" stroke={COLORS.whatsapp} fillOpacity={1} fill="url(#colorWhatsapp)" name="WhatsApp" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Weekly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Breakdown</CardTitle>
          <CardDescription>Spending by channel over 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyBreakdown.every(w => w.call + w.sms + w.whatsapp === 0) ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => `₦${v}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, '']}
                />
                <Bar dataKey="call" fill={COLORS.call} radius={[4, 4, 0, 0]} name="Calls" />
                <Bar dataKey="sms" fill={COLORS.sms} radius={[4, 4, 0, 0]} name="SMS" />
                <Bar dataKey="whatsapp" fill={COLORS.whatsapp} radius={[4, 4, 0, 0]} name="WhatsApp" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Channel Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channel Distribution</CardTitle>
          <CardDescription>Last 30 days spending by channel</CardDescription>
        </CardHeader>
        <CardContent>
          {channelDistribution.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No spending data
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
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
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₦${value.toLocaleString()}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {channelDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₦{item.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalSpent > 0 ? ((item.value / totalSpent) * 100).toFixed(0) : 0}%
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
