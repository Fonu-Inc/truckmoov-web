import type { SystemTenant } from "@truckmoov/api/auth";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ListErrorBanner } from "@/components/platform/billing/billingUi";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableSkeleton } from "@/components/ui/skeletons";
import { CustomerTableRow } from "./CustomerRows";
import { PAGE_SIZE } from "./paymentsAccessModel";
import type { CustomerRow } from "./paymentsAccessModel";

type Props = {
  rows: CustomerRow[];
  page: number;
  onPage: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  walletsReady: boolean;
  canAct: boolean;
  onSuspend: (t: SystemTenant) => void;
  onRestore: (t: SystemTenant) => void;
};

function Pager({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{`${total} ${total === 1 ? "customer" : "customers"}`}</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <span>{`Page ${page} of ${pages}`}</span>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function CustomerTable(props: Props) {
  const { rows, page, isLoading, isError, onRetry, canAct } = props;
  const columns = canAct ? 6 : 5;

  if (isError) {
    return (
      <ListErrorBanner
        title="Could not load customers"
        message="Check your connection and try again."
        onRetry={onRetry}
      />
    );
  }

  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Grace</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>What they have</TableHead>
              {canAct && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? <TableSkeleton columns={columns} />
              : visible.map(row => (
                  <CustomerTableRow
                    key={row.tenant.id}
                    row={row}
                    walletsReady={props.walletsReady}
                    canAct={canAct}
                    onSuspend={props.onSuspend}
                    onRestore={props.onRestore}
                  />
                ))}
          </TableBody>
        </Table>
        {!isLoading && rows.length === 0 && (
          <EmptyState
            icon={Building2}
            title="No customers found"
            description="Try a different search or filter."
          />
        )}
      </div>
      {!isLoading && rows.length > 0 && <Pager page={page} total={rows.length} onPage={props.onPage} />}
    </div>
  );
}
