import { useQuery } from "@tanstack/react-query";
import { getSystemTenantsQueryOptions } from "@truckmoov/api/auth";
import { Eye, Building2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { formatLabel, formatNgn } from "./overviewFormat";
import { WidgetBody } from "./WidgetBody";

const TOP_TENANT_COUNT = 5;

function statusClass(status: string) {
  if (status === "active") {
    return "bg-success/10 text-success border-success/30";
  }
  if (status === "pending" || status === "trial") {
    return "bg-warning/10 text-warning border-warning/30";
  }
  return "bg-destructive/10 text-destructive border-destructive/30";
}

export function TopTenantsCard() {
  const { data, isLoading, isError, refetch } = useQuery(getSystemTenantsQueryOptions());
  const topTenants = [...(data?.data.tenants ?? [])]
    .filter(tenant => tenant.collectedThisMonthNgn > 0)
    .sort((a, b) => b.collectedThisMonthNgn - a.collectedThisMonthNgn)
    .slice(0, TOP_TENANT_COUNT);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Top Tenants This Month
            </CardTitle>
            <CardDescription>Tenants ranked by cash collected this month</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to="/tenants">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <WidgetBody
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={topTenants.length === 0}
          emptyMessage="No payments collected from tenants this month."
        >
          {topTenants.map((tenant, index) => (
            <div
              key={tenant.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  {`#${index + 1}`}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{tenant.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {tenant.planAssigned ? (tenant.planName ?? formatLabel(tenant.plan)) : "No plan"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="font-medium">{formatNgn(tenant.collectedThisMonthNgn)}</p>
                  <p className="text-muted-foreground">Collected</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="font-medium">{tenant.vehicleCount.toLocaleString()}</p>
                  <p className="text-muted-foreground">Vehicles</p>
                </div>
                <Badge className={statusClass(tenant.status)}>{formatLabel(tenant.status)}</Badge>
              </div>
            </div>
          ))}
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
