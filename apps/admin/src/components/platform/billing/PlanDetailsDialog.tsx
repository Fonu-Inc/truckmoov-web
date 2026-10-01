import type { PlanView, PriceChangeView, PriceField } from "@truckmoov/api/billing";
import { useBillingPlan } from "@truckmoov/api/billing";
import { CalendarClock, Coins, Cpu, Hash, Pencil, RefreshCw } from "lucide-react";
import {
  PlanStatusBadge,
  formatDateOnly,
  formatIsoDate,
  formatIsoDateTime,
  formatNgn,
} from "@/components/platform/billing/billingUi";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

const PRICE_HISTORY_LIMIT = 10;

const FIELD_LABEL: Record<PriceField, string> = {
  year1: "Year-1 price",
  renewal: "Renewal price",
  enterprise: "Enterprise installation",
  owner_operator: "Owner-operator installation",
};

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1.5 text-base font-semibold">{value}</p>
    </div>
  );
}

function ComponentsList({ components }: { components: string[] }) {
  if (components.length === 0) return null;
  return (
    <div className="rounded-xl border border-border/60">
      <div className="border-b border-border/60 px-4 py-2.5">
        <p className="text-sm font-medium">What makes up this plan</p>
        <p className="text-xs text-muted-foreground">
          One price per device. Everything below is bundled into it.
        </p>
      </div>
      <ul className="divide-y divide-border/60">
        {components.map((label) => (
          <li key={label} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Cpu className="h-4 w-4 text-primary" />
            </span>
            <span className="flex-1 text-sm font-medium">{label}</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Included</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PriceHistory({ rows, loading }: { rows: PriceChangeView[]; loading: boolean }) {
  return (
    <div className="rounded-xl border border-border/60">
      <div className="border-b border-border/60 px-4 py-2.5">
        <p className="text-sm font-medium">Price history</p>
        {rows.length >= PRICE_HISTORY_LIMIT && (
          <p className="text-xs text-muted-foreground">Latest {PRICE_HISTORY_LIMIT} changes</p>
        )}
      </div>
      {loading && <Skeleton className="m-4 h-16" />}
      {!loading && rows.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No price changes recorded.</p>
      )}
      {!loading && rows.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Price</TableHead>
              <TableHead>Old</TableHead>
              <TableHead>New</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>Changed by</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{FIELD_LABEL[row.field]}</TableCell>
                <TableCell>{formatNgn(row.oldPriceNgn)}</TableCell>
                <TableCell className="font-medium">{formatNgn(row.newPriceNgn)}</TableCell>
                <TableCell>{formatDateOnly(row.effectiveDate)}</TableCell>
                <TableCell>{row.changedByName}</TableCell>
                <TableCell className="max-w-[220px] whitespace-normal text-muted-foreground">
                  {row.reason}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function PlanDetailsDialog({
  open,
  onOpenChange,
  plan,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanView | null;
  onEdit: (plan: PlanView) => void;
}) {
  const detail = useBillingPlan(plan?.code ?? "");
  if (!plan) return null;

  const current = detail.data?.data.plan ?? plan;
  const history = detail.data?.data.priceHistory ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-xl">{current.name}</DialogTitle>
              <DialogDescription>{current.description || "No description."}</DialogDescription>
            </div>
            <PlanStatusBadge isActive={current.isActive} />
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile icon={Coins} label="Year-1 price" value={formatNgn(current.perDeviceYear1Ngn)} />
            <Tile icon={RefreshCw} label="Renewal price" value={formatNgn(current.perDeviceRenewalNgn)} />
            <Tile icon={CalendarClock} label="Validity" value={`${current.validityDays} days`} />
            <Tile icon={Hash} label="Product ID" value={<span className="font-mono text-sm">{current.code}</span>} />
          </div>

          <ComponentsList components={current.components} />

          <div className="grid gap-3 rounded-xl border border-border/60 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-medium">{formatIsoDate(current.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last updated</p>
              <p className="font-medium">{formatIsoDate(current.updatedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last price change</p>
              <p className="font-medium">{formatIsoDateTime(current.lastPriceChangedAt)}</p>
            </div>
          </div>

          {detail.isError ? (
            <div className="rounded-xl border border-border/60 p-4 text-center text-sm">
              <p className="text-muted-foreground">Couldn't load price history.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => void detail.refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <PriceHistory rows={history} loading={detail.isLoading} />
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              onOpenChange(false);
              onEdit(current);
            }}
          >
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
