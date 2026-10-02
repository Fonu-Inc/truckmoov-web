import { useQuery } from "@tanstack/react-query";
import type { SystemTenant } from "@truckmoov/api/auth";
import { getSystemTenantsQueryOptions } from "@truckmoov/api/auth";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { formatLabel, formatNgn } from "./overviewFormat";
import { WidgetBody } from "./WidgetBody";

const NO_PLAN = "No plan";

type PlanRow = { plan: string; count: number; collectedNgn: number };

function planOf(tenant: SystemTenant) {
  return tenant.planAssigned ? (tenant.planName ?? formatLabel(tenant.plan)) : NO_PLAN;
}

function groupByPlan(tenants: SystemTenant[]): PlanRow[] {
  const rows = new Map<string, PlanRow>();
  for (const tenant of tenants) {
    const plan = planOf(tenant);
    const row = rows.get(plan) ?? { plan, count: 0, collectedNgn: 0 };
    row.count += 1;
    row.collectedNgn += tenant.collectedThisMonthNgn;
    rows.set(plan, row);
  }
  return [...rows.values()].sort((a, b) => b.count - a.count);
}

export function TenantsByPlanCard() {
  const { data, isLoading, isError, refetch } = useQuery(getSystemTenantsQueryOptions());
  const tenants = data?.data.tenants ?? [];
  const plans = groupByPlan(tenants);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Tenants by Plan
        </CardTitle>
        <CardDescription>Tenant count and cash collected this month per plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <WidgetBody
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={plans.length === 0}
          emptyMessage="No tenants yet."
        >
          {plans.map(item => (
            <div
              key={item.plan}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.plan}</span>
                <span className="text-muted-foreground">{`${item.count.toLocaleString()} tenants`}</span>
              </div>
              <Progress
                value={(item.count / tenants.length) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">{`${formatNgn(item.collectedNgn)} this month`}</p>
            </div>
          ))}
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
