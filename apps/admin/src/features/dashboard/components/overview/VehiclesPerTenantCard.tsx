import type { DashboardPeriod } from "@/features/dashboard/utils/dashboardPeriod";
import {
  Building2,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { useDashboardTotals } from "@/features/dashboard/hooks/useDashboardTotals";
import { WidgetBody } from "./WidgetBody";

const TOP_TENANT_COUNT = 8;
const NAME_MAX_CHARS = 24;

/** Vehicles per Tenant — fleetflow's horizontal bar chart over tenants onboarded in the period. */
export function VehiclesPerTenantCard({ period }: { period: DashboardPeriod }) {
  const navigate = useNavigate();
  const {
    periodTenants,
    tenantsLoading,
    tenantsError,
    refetchTenants,
  } = useDashboardTotals(period);
  const chartData = [...periodTenants]
    .sort((a, b) => b.vehicleCount - a.vehicleCount)
    .slice(
      0,
      TOP_TENANT_COUNT,
    )
    .map(t => ({
      name: t.name,
      vehicles: t.vehicleCount,
    }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Vehicles per Tenant
            </CardTitle>
            <CardDescription>How many vehicles each tenant manages</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/tenants")}
          >
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <WidgetBody
          isLoading={tenantsLoading}
          isError={tenantsError}
          onRetry={refetchTenants}
          skeletonClassName="h-[220px] w-full"
        >
          {chartData.length === 0
            ? <p className="py-12 text-center text-sm text-muted-foreground">No tenants in this period.</p>
            : (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(
                    220,
                    chartData.length * 44,
                  )}
                >
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{
                      top: 4,
                      right: 24,
                      bottom: 4,
                      left: 8,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={170}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(v: string) => (v.length > NAME_MAX_CHARS ? `${v.slice(
                        0,
                        NAME_MAX_CHARS,
                      )}…` : v)}
                    />
                    <Tooltip
                      formatter={value => [
                        `${value} vehicles`,
                        "Vehicles",
                      ]}
                      cursor={{ fill: "hsl(var(--muted))" }}
                    />
                    <Bar
                      dataKey="vehicles"
                      fill="hsl(var(--primary))"
                      radius={[
                        0,
                        6,
                        6,
                        0,
                      ]}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
