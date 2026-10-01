import type { BillingPlanStatusFilter, PlanView } from "@truckmoov/api/billing";
import {
  useActivateBillingPlan,
  useBillingPlans,
  useDeactivateBillingPlan,
} from "@truckmoov/api/billing";
import { Eye, Package, Pencil, Plus, Power, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InstallationPriceCard } from "@/components/platform/billing/InstallationPriceCard";
import { PlanDetailsDialog } from "@/components/platform/billing/PlanDetailsDialog";
import { PlanFormDialog } from "@/components/platform/billing/PlanFormDialog";
import {
  PlanStatusBadge,
  formatIsoDate,
  formatNgn,
  ListErrorBanner,
} from "@/components/platform/billing/billingUi";
import { useBillingList } from "@/components/platform/billing/useBillingList";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";
import { TableSkeleton } from "@/components/ui/skeletons";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";

const PAGE_SIZE = 10;
const COLUMN_COUNT = 8;

const EXPORT_COLUMNS = [
  { header: "Product ID", accessor: "code" as const },
  { header: "Product Name", accessor: "name" as const },
  { header: "Year-1 Price (NGN)", accessor: "perDeviceYear1Ngn" as const },
  { header: "Renewal Price (NGN)", accessor: "perDeviceRenewalNgn" as const },
  { header: "Validity (days)", accessor: "validityDays" as const },
  { header: "Status", accessor: (r: PlanView) => (r.isActive ? "Active" : "Inactive") },
  { header: "Last Updated", accessor: (r: PlanView) => formatIsoDate(r.updatedAt) },
];

function PlanActions({
  plan,
  onView,
  onEdit,
  onToggle,
}: {
  plan: PlanView;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <TooltipWrapper content="View details">
        <Button variant="ghost" size="icon" aria-label="View details" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      </TooltipWrapper>
      <TooltipWrapper content="Edit plan">
        <Button variant="ghost" size="icon" aria-label="Edit plan" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      </TooltipWrapper>
      <TooltipWrapper content={plan.isActive ? "Deactivate" : "Activate"}>
        <Button
          variant="ghost"
          size="icon"
          aria-label={plan.isActive ? "Deactivate plan" : "Activate plan"}
          onClick={onToggle}
        >
          <Power className={plan.isActive ? "h-4 w-4 text-success" : "h-4 w-4 text-destructive"} />
        </Button>
      </TooltipWrapper>
    </div>
  );
}

function PlanRow({
  plan,
  onView,
  onEdit,
  onToggle,
}: {
  plan: PlanView;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">{plan.code}</TableCell>
      <TableCell className="font-medium">{plan.name}</TableCell>
      <TableCell className="font-medium">{formatNgn(plan.perDeviceYear1Ngn)}</TableCell>
      <TableCell className="font-medium">{formatNgn(plan.perDeviceRenewalNgn)}</TableCell>
      <TableCell>{plan.validityDays} days</TableCell>
      <TableCell>
        <PlanStatusBadge isActive={plan.isActive} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatIsoDate(plan.updatedAt)}</TableCell>
      <TableCell>
        <PlanActions plan={plan} onView={onView} onEdit={onEdit} onToggle={onToggle} />
      </TableCell>
    </TableRow>
  );
}

function PlansEmptyOrError({
  isError,
  message,
  onRetry,
}: {
  isError: boolean;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <TableRow>
      <TableCell colSpan={COLUMN_COUNT} className="py-12 text-center">
        {isError ? (
          <>
            <p className="text-sm font-medium">Couldn't load license plans</p>
            <p className="text-xs text-muted-foreground">{message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              Try again
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">No license plans found</p>
            <p className="text-xs text-muted-foreground">Adjust your search or add a plan.</p>
          </>
        )}
      </TableCell>
    </TableRow>
  );
}

export function LicensePlansTab() {
  const { confirm, confirmDialog } = useConfirmAction();
  const list = useBillingList<{ status: BillingPlanStatusFilter }>({ status: "all" });
  const { data, isLoading, isError, error, refetch } = useBillingPlans({
    params: {
      q: list.debouncedSearch || undefined,
      status: list.filters.status,
      page: list.page,
      limit: PAGE_SIZE,
    },
  });
  const activate = useActivateBillingPlan();
  const deactivate = useDeactivateBillingPlan();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PlanView | null>(null);
  const [viewing, setViewing] = useState<PlanView | null>(null);

  const plans = data?.data.items ?? [];
  const total = data?.data.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggle = (plan: PlanView) => {
    const action = plan.isActive ? deactivate : activate;
    action.mutate(
      { code: plan.code },
      {
        onSuccess: () => toast.success(`${plan.name} ${plan.isActive ? "deactivated" : "activated"}`),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const askToggle = (plan: PlanView) =>
    confirm({
      title: plan.isActive ? "Deactivate this plan?" : "Activate this plan?",
      description: plan.isActive
        ? `Customers will no longer be able to select ${plan.name} until it is activated again.`
        : `${plan.name} will become available for customers to select again.`,
      confirmLabel: plan.isActive ? "Yes, deactivate" : "Yes, activate",
      destructive: plan.isActive,
      onConfirm: () => toggle(plan),
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="rounded-xl" onClick={() => setAdding(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add M2M License Plan
        </Button>
      </div>

      <Card className="surface-sleek rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              M2M License Plans
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              M2M plans customers can be billed for. Each plan bundles data, device and platform license.
              Plans can be deactivated but never deleted.
            </p>
          </div>
          <ExportButton
            rows={plans}
            filename="m2m-license-plans"
            label="Export Data (loaded rows)"
            columns={EXPORT_COLUMNS}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={list.search}
                onChange={(e) => list.setSearch(e.target.value)}
                placeholder="Search by product ID or name"
                className="rounded-xl pl-9"
              />
            </div>
            <Select
              value={list.filters.status}
              onValueChange={(v) => list.setFilter("status", v as BillingPlanStatusFilter)}
            >
              <SelectTrigger className="w-[160px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isError && plans.length > 0 && (
            <ListErrorBanner title="Couldn't load license plans" message={error?.message} onRetry={() => void refetch()} />
          )}

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Year-1 Price</TableHead>
                  <TableHead>Renewal Price</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableSkeleton rows={PAGE_SIZE} columns={COLUMN_COUNT} />}
                {plans.map((plan) => (
                  <PlanRow
                    key={plan.code}
                    plan={plan}
                    onView={() => setViewing(plan)}
                    onEdit={() => setEditing(plan)}
                    onToggle={() => askToggle(plan)}
                  />
                ))}
                {!isLoading && plans.length === 0 && (
                  <PlansEmptyOrError isError={isError} message={error?.message} onRetry={() => void refetch()} />
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {plans.length} of {total} plans
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={list.page === 1}
                onClick={() => list.setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span>
                Page {list.page} of {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={list.page >= pages}
                onClick={() => list.setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <InstallationPriceCard />

      <PlanFormDialog open={adding} onOpenChange={setAdding} />
      <PlanFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} plan={editing} />
      <PlanDetailsDialog
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        plan={viewing}
        onEdit={setEditing}
      />
      {confirmDialog}
    </div>
  );
}
