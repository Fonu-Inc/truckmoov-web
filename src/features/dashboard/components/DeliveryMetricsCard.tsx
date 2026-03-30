import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { deliveryMetricsQueryOptions } from "@/features/fleet/api";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatMs(ms: number): string {
 const h = Math.floor(ms / 3600000);
 const m = Math.floor((ms % 3600000) / 60000);
 if (h > 0) return `${h}h ${m}m`;
 return `${m}m`;
}

export default function DeliveryMetricsCard() {
 const { user } = useAuthStore();
 const tenantId = user?.tenantId ?? "";

 const { data, isLoading } = useQuery(
  deliveryMetricsQueryOptions({ params: { tenantId } })
 );

 const delivery = data?.data;

 const chartData = [
  { label: "Delivered", count: delivery?.delivered ?? 0, fill: "#22c55e" },
  { label: "In Progress", count: delivery?.inProgress ?? 0, fill: "#eab308" },
  { label: "Cancelled", count: delivery?.cancelled ?? 0, fill: "#ef4444" },
 ];

 return (
  <Card className="flex flex-col">
   <CardHeader>
    <CardTitle className="text-base">Delivery Metrics</CardTitle>
   </CardHeader>
   <CardContent className="flex-1 space-y-4">
    {/* Summary row */}
    {isLoading ? (
     <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
       <Skeleton key={i} className="h-14 w-full" />
      ))}
     </div>
    ) : (
     <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg border p-3 text-center">
       <p className="text-2xl font-bold text-green-500">{delivery?.delivered ?? 0}</p>
       <p className="text-xs text-muted-foreground mt-0.5">Delivered</p>
      </div>
      <div className="rounded-lg border p-3 text-center">
       <p className="text-2xl font-bold text-yellow-500">{delivery?.inProgress ?? 0}</p>
       <p className="text-xs text-muted-foreground mt-0.5">In Progress</p>
      </div>
      <div className="rounded-lg border p-3 text-center">
       <p className="text-2xl font-bold text-destructive">{delivery?.cancelled ?? 0}</p>
       <p className="text-xs text-muted-foreground mt-0.5">Cancelled</p>
      </div>
     </div>
    )}

    {/* Avg cycle time */}
    {!isLoading && (
     <div className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
      <span className="text-muted-foreground">Avg Cycle Time</span>
      <span className="font-semibold">
       {delivery?.averageCycleTimeMs ? formatMs(delivery.averageCycleTimeMs) : "—"}
      </span>
     </div>
    )}

    {/* Bar chart */}
    <div className="h-36">
     {isLoading ? (
      <Skeleton className="h-full w-full" />
     ) : (
      <ResponsiveContainer width="100%" height="100%">
       <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
         contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
         cursor={{ fill: "hsl(var(--muted))" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
         {chartData.map((entry) => (
          <Cell key={entry.label} fill={entry.fill} />
         ))}
        </Bar>
       </BarChart>
      </ResponsiveContainer>
     )}
    </div>
   </CardContent>
  </Card>
 );
}
