import type {
  BillingPlanStatusFilter, PlanView,
} from "@truckmoov/api/billing";
import {
  useActivateBillingPlan,
  useBillingPlans,
  useDeactivateBillingPlan,
} from "@truckmoov/api/billing";
import {
  Eye, Package, Pencil, Plus, Power, Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  BillingCard,
  BillingCardBody,
  BillingCardHeader,
  FILTER_TRIGGER,
  formatIsoDate,
  formatNgn,
  ListErrorBanner,
  PlanStatusBadge,
  TableStateRows,
} from "@/components/platform/billing/billingUi";
import { DeliveryPriceCard } from "@/components/platform/billing/DeliveryPriceCard";
import { InstallationPriceCard } from "@/components/platform/billing/InstallationPriceCard";
import { PlanDetailsDialog } from "@/components/platform/billing/PlanDetailsDialog";
import { PlanFormDialog } from "@/components/platform/billing/PlanFormDialog";
import { useBillingList } from "@/components/platform/billing/useBillingList";
import { Button } from "@/components/shadcn/button";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";
import { PageActions } from "@/shared/components/layout/PageTitle";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";

// The design app lists every product (first-year and renewal) as its own row,
// so there is no pager: fetch the whole catalogue in one go.
const PLAN_LIMIT = 100;

/** One sellable product: a plan's first-year price or its renewal price. */
type ProductRow = {
  key: string;
  name: string;
  priceNgn: number;
  plan: PlanView;
};

// All first-year products, then all renewals — the design app's order.
function toProducts(plans: PlanView[]): ProductRow[] {
  const year1 = plans.map(plan => ({
    key: `${plan.code}:year1`, name: `${plan.code.toUpperCase()}_Yr1`, priceNgn: plan.perDeviceYear1Ngn, plan,
  }));
  const renewals = plans.map(plan => ({
    key: `${plan.code}:renewal`, name: `${plan.code.toUpperCase()}_RENEW`, priceNgn: plan.perDeviceRenewalNgn, plan,
  }));
  return [
    ...year1,
    ...renewals,
  ];
}

const EXPORT_COLUMNS = [
  {
    header: "Product Name", accessor: "name" as const,
  },
  {
    header: "Price (NGN)", accessor: "priceNgn" as const,
  },
  {
    header: "Validity (days)", accessor: (r: ProductRow) => r.plan.validityDays,
  },
  {
    header: "Status", accessor: (r: ProductRow) => (r.plan.isActive ? "Active" : "Inactive"),
  },
  {
    header: "Last Updated", accessor: (r: ProductRow) => formatIsoDate(r.plan.updatedAt),
  },
];

function ProductActions({
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
        <Button
          variant="ghost"
          size="icon"
          aria-label="View details"
          onClick={onView}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TooltipWrapper>
      <TooltipWrapper content="Edit product">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit product"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TooltipWrapper>
      <TooltipWrapper content={plan.isActive ? "Deactivate" : "Activate"}>
        <Button
          variant="ghost"
          size="icon"
          aria-label={plan.isActive ? "Deactivate product" : "Activate product"}
          onClick={onToggle}
        >
          <Power className={plan.isActive ? "h-4 w-4 text-success" : "h-4 w-4 text-destructive"} />
        </Button>
      </TooltipWrapper>
    </div>
  );
}

export function LicensePlansTab() {
  const {
    confirm, confirmDialog,
  } = useConfirmAction();
  const list = useBillingList<{ status: BillingPlanStatusFilter }>({ status: "all" });
  const {
    data, isLoading, isError, error, refetch,
  } = useBillingPlans({
    params: {
      q: list.debouncedSearch || undefined,
      status: list.filters.status,
      page: 1,
      limit: PLAN_LIMIT,
    },
  });
  const activate = useActivateBillingPlan();
  const deactivate = useDeactivateBillingPlan();

  const [
    adding,
    setAdding,
  ] = useState(false);
  const [
    editing,
    setEditing,
  ] = useState<PlanView | null>(null);
  const [
    viewing,
    setViewing,
  ] = useState<PlanView | null>(null);

  const products = toProducts(data?.data.items ?? []);
  const totalProducts = (data?.data.total ?? 0) * 2;

  const toggle = (plan: PlanView) => {
    const action = plan.isActive ? deactivate : activate;
    action.mutate(
      { code: plan.code },
      {
        onSuccess: () => toast.success(`${plan.name} ${plan.isActive ? "deactivated" : "activated"}`),
        onError: err => toast.error(err.message),
      },
    );
  };

  // A plan's first-year and renewal rows share one active flag.
  const askToggle = (plan: PlanView) =>
    confirm({
      title: plan.isActive ? "Deactivate this product?" : "Activate this product?",
      description: plan.isActive
        ? `Customers will no longer be able to select ${plan.name} (first year and renewal) until it is activated again.`
        : `${plan.name} (first year and renewal) will become available for customers to select again.`,
      confirmLabel: plan.isActive ? "Yes, deactivate" : "Yes, activate",
      destructive: plan.isActive,
      onConfirm: () => toggle(plan),
    });

  return (
    <div className="space-y-4">
      <PageActions>
        <Button
          className="rounded-xl"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add M2M License Plan
        </Button>
      </PageActions>

      <BillingCard>
        <BillingCardHeader
          icon={Package}
          title="M2M License Plans"
          subtitle="Submitted documents, validity dates, and related records."
          description="M2M plans customers can be billed for. Each product bundles data, device and platform license. Products can be deactivated but never deleted."
          action={(
            <div className="flex shrink-0 items-center gap-2">
              <ExportButton
                rows={products}
                filename="m2m-license-plans"
                columns={EXPORT_COLUMNS}
              />
            </div>
          )}
        />
        <BillingCardBody>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={list.search}
                onChange={e => list.setSearch(e.target.value)}
                placeholder="Search products..."
                className="rounded-xl pl-9"
              />
            </div>
            <Select
              value={list.filters.status}
              onValueChange={v => list.setFilter(
                "status",
                v as BillingPlanStatusFilter,
              )}
            >
              <SelectTrigger className={`${FILTER_TRIGGER} w-[160px]`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isError && products.length > 0 && (
            <ListErrorBanner
              title="Couldn't load license plans"
              message={error?.message}
              onRetry={() => void refetch()}
            />
          )}

          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableStateRows
                  colSpan={6}
                  isLoading={isLoading}
                  isError={isError}
                  isEmpty={products.length === 0}
                  errorTitle="Couldn't load license plans"
                  errorMessage={error?.message}
                  onRetry={() => void refetch()}
                  emptyTitle="No products found"
                />
                {products.map(p => (
                  <TableRow key={p.key}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-medium">{formatNgn(p.priceNgn)}</TableCell>
                    <TableCell>{`${p.plan.validityDays} days`}</TableCell>
                    <TableCell>
                      <PlanStatusBadge isActive={p.plan.isActive} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatIsoDate(p.plan.updatedAt)}</TableCell>
                    <TableCell>
                      <ProductActions
                        plan={p.plan}
                        onView={() => setViewing(p.plan)}
                        onEdit={() => setEditing(p.plan)}
                        onToggle={() => askToggle(p.plan)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!isLoading && products.length > 0 && (
            <Label className="text-xs text-muted-foreground">
              Showing
              {" "}
              {products.length}
              {" "}
              of
              {" "}
              {totalProducts}
              {" "}
              products
            </Label>
          )}
        </BillingCardBody>
      </BillingCard>

      <InstallationPriceCard />
      <DeliveryPriceCard />

      <PlanFormDialog
        open={adding}
        onOpenChange={setAdding}
      />
      <PlanFormDialog
        open={!!editing}
        onOpenChange={o => !o && setEditing(null)}
        plan={editing}
      />
      <PlanDetailsDialog
        open={!!viewing}
        onOpenChange={o => !o && setViewing(null)}
        plan={viewing}
        onEdit={setEditing}
      />
      {confirmDialog}
    </div>
  );
}
