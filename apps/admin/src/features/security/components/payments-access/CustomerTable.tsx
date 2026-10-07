import type { ColumnDef } from "@tanstack/react-table";
import type { SystemTenant } from "@truckmoov/api/auth";
import type { CustomerRow } from "./paymentsAccessModel";
import {
  Building2, ExternalLink,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DataTable } from "@/components/shadcn/data-table";
import {
  AccessCell, ActionCell, GraceCell, PaymentCell,
} from "./CustomerRows";
import { PAGE_SIZE } from "./paymentsAccessModel";

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

type ColumnOptions = {
  walletsReady: boolean;
  canAct: boolean;
  onSuspend: (t: SystemTenant) => void;
  onRestore: (t: SystemTenant) => void;
};

// Client-paged list: sorting a page slice would mislead, so every column opts out.
function customerColumns({
  walletsReady, canAct, onSuspend, onRestore,
}: ColumnOptions): ColumnDef<CustomerRow>[] {
  const columns: ColumnDef<CustomerRow>[] = [
    {
      id: "company",
      header: "Company",
      enableSorting: false,
      meta: { className: "font-medium" },
      cell: ({ row: { original: { tenant } } }) => (
        <Link
          to={`/tenants/${tenant.id}`}
          className="inline-flex items-center gap-1 hover:underline"
        >
          {tenant.name}
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </Link>
      ),
    },
    {
      id: "payment",
      header: "Payment",
      enableSorting: false,
      cell: ({ row }) => (
        <PaymentCell
          row={row.original}
          walletsReady={walletsReady}
        />
      ),
    },
    {
      id: "grace",
      header: "Grace",
      enableSorting: false,
      cell: ({ row }) => <GraceCell row={row.original} />,
    },
    {
      id: "access",
      header: "Access",
      enableSorting: false,
      cell: ({ row }) => <AccessCell row={row.original} />,
    },
    {
      id: "assets",
      header: "What they have",
      enableSorting: false,
      meta: { className: "text-sm text-muted-foreground" },
      cell: ({ row: { original: { tenant } } }) =>
        `${tenant.vehicleCount} vehicles, ${tenant.deviceCount} devices, ${tenant.simCount} SIMs`,
    },
  ];
  if (canAct) {
    columns.push({
      id: "action",
      header: "Action",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <ActionCell
          tenant={row.original.tenant}
          onSuspend={onSuspend}
          onRestore={onRestore}
        />
      ),
    });
  }
  return columns;
}

export function CustomerTable(props: Props) {
  const {
    rows, page, isLoading, isError, onRetry, walletsReady, canAct, onSuspend, onRestore,
  } = props;
  const columns = useMemo(
    () => customerColumns({
      walletsReady, canAct, onSuspend, onRestore,
    }),
    [
      walletsReady,
      canAct,
      onSuspend,
      onRestore,
    ],
  );

  const visible = rows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  return (
    <div className="rounded-xl border">
      <DataTable
        columns={columns}
        data={visible}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Could not load customers. Check your connection and try again."
        onRetry={onRetry}
        emptyState={(
          <EmptyState
            icon={Building2}
            title="No customers found"
            description="Try a different search or filter."
          />
        )}
        pagination={{
          page, pageSize: PAGE_SIZE, total: rows.length, onPageChange: props.onPage,
        }}
      />
    </div>
  );
}
