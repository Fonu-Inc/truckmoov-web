import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";
import {
  Building2,
  Cpu,
  Loader2,
  Network,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ChartDateFilter } from "@/components/shadcn/chart-date-filter";

const ORG_TYPE_ICONS: Record<string, typeof Building2> = {
  ENTERPRISE: Building2,
  FLEET_PROVIDER: Truck,
  AGGREGATOR: Network,
  OWNER_OPERATOR: Sparkles,
};

const ORG_TYPE_COLORS: Record<string, string> = {
  ENTERPRISE: "hsl(var(--primary))",
  FLEET_PROVIDER: "hsl(var(--success))",
  AGGREGATOR: "hsl(var(--warning))",
  OWNER_OPERATOR: "hsl(var(--info, var(--primary)))",
};

const ORG_TYPE_BG: Record<string, string> = {
  ENTERPRISE: "bg-primary/10 text-primary",
  FLEET_PROVIDER: "bg-success/10 text-success",
  AGGREGATOR: "bg-warning/10 text-warning",
  OWNER_OPERATOR: "bg-accent/10 text-accent-foreground",
};

export function StakeholderOverviewTab() {
  const typeSummaries: {
    type: string;
    label: string;
    count: number;
    activeCount: number;
    vehicleCount: number;
    driverCount: number;
    deviceCount: number;
  }[] = [];
  const orgDetails: {
    id: string;
    name: string;
    organizationType: string;
    status: string;
    vehicleCount: number;
    driverCount: number;
    deviceCount: number;
  }[] = [];
  const aggregatorNetworks: {
    aggregatorId: string;
    aggregatorName: string;
    relationshipType: string;
    childCount: number;
  }[] = [];
  const totalOrgs = 0;
  const isLoading = false;
  const [
    distributionRange,
    setDistributionRange,
  ] = useState<ChartDateRange>("30d");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pieData = typeSummaries
    .filter(t => t.count > 0)
    .map(t => ({
      name: t.label,
      value: t.count,
      color: ORG_TYPE_COLORS[t.type],
    }));

  return (
    <div className="space-y-6">
      {/* Stat cards per org type */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {typeSummaries.map((summary) => {
          const Icon = ORG_TYPE_ICONS[summary.type] || Building2;
          return (
            <Card key={summary.type}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {summary.label}
                      s
                    </p>
                    <p className="text-3xl font-bold">{summary.count}</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs bg-success/10 text-success border-success/30"
                      >
                        {summary.activeCount}
                        {" "}
                        active
                      </Badge>
                    </div>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-lg flex items-center justify-center ${ORG_TYPE_BG[summary.type]}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribution pie chart */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  Organization Distribution
                </CardTitle>
                <CardDescription>
                  {totalOrgs}
                  {" "}
                  total organizations across all stakeholder types
                </CardDescription>
              </div>
              <ChartDateFilter
                value={distributionRange}
                onValueChange={setDistributionRange}
              />
            </div>
          </CardHeader>
          <CardContent>
            {pieData.length === 0
              ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No organizations registered yet.
                  </p>
                )
              : (
                  <div className="flex items-center gap-8">
                    <ResponsiveContainer
                      width="55%"
                      height={220}
                    >
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell
                              key={i}
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
                          formatter={(value: number, name: string) => [
                            `${value} org${value !== 1 ? "s" : ""}`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {pieData.map(entry => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm font-medium">
                              {entry.name}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
          </CardContent>
        </Card>

        {/* Asset distribution by org type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Assets by Stakeholder Type
            </CardTitle>
            <CardDescription>
              Vehicles, drivers, and devices per organization type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typeSummaries.map((summary) => {
                const Icon = ORG_TYPE_ICONS[summary.type] || Building2;
                const hasAssets
                  = summary.vehicleCount + summary.driverCount + summary.deviceCount > 0;
                return (
                  <div
                    key={summary.type}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center ${ORG_TYPE_BG[summary.type]}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">
                        {summary.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Truck className="h-3.5 w-3.5" />
                        <span>{summary.vehicleCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{summary.driverCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Cpu className="h-3.5 w-3.5" />
                        <span>{summary.deviceCount}</span>
                      </div>
                      {!hasAssets && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          No assets
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aggregator networks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-warning" />
              Aggregator Networks
            </CardTitle>
            <CardDescription>
              Aggregators and their connected sub-organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aggregatorNetworks.length === 0
              ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No aggregator networks configured.
                  </p>
                )
              : (
                  <div className="space-y-3">
                    {aggregatorNetworks.map(agg => (
                      <div
                        key={agg.aggregatorId}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                            <Network className="h-4 w-4 text-warning" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{agg.aggregatorName}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {agg.relationshipType.replace(
                                /_/g,
                                " ",
                              ).toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {agg.childCount}
                            {" "}
                            member
                            {agg.childCount !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
          </CardContent>
        </Card>

        {/* Top organizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Top Organizations by Assets
            </CardTitle>
            <CardDescription>
              Organizations with the largest fleet footprint
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orgDetails.length === 0
              ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No organizations yet.
                  </p>
                )
              : (
                  <div className="space-y-3">
                    {orgDetails
                      .sort(
                        (a, b) =>
                          b.vehicleCount
                          + b.driverCount
                          + b.deviceCount
                          - (a.vehicleCount + a.driverCount + a.deviceCount),
                      )
                      .slice(
                        0,
                        6,
                      )
                      .map((org) => {
                        const Icon
                          = ORG_TYPE_ICONS[org.organizationType] || Building2;
                        return (
                          <div
                            key={org.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-8 w-8 rounded-lg flex items-center justify-center ${ORG_TYPE_BG[org.organizationType]}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{org.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {org.organizationType
                                    .replace(
                                      /_/g,
                                      " ",
                                    )
                                    .toLowerCase()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>
                                {org.vehicleCount}
                                {" "}
                                veh
                              </span>
                              <span>
                                {org.driverCount}
                                {" "}
                                drv
                              </span>
                              <span>
                                {org.deviceCount}
                                {" "}
                                dev
                              </span>
                              <Badge
                                className={
                                  org.status === "ACTIVE"
                                    ? "bg-success/10 text-success border-success/30"
                                    : "bg-destructive/10 text-destructive border-destructive/30"
                                }
                              >
                                {org.status.toLowerCase()}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
