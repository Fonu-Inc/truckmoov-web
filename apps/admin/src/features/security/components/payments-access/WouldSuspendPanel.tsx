import type { ColumnDef } from "@tanstack/react-table";
import { useEnforcementPreview } from "@truckmoov/api/billing";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import { Link } from "react-router";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { formatCurrency } from "@/lib/currency";
import { plural } from "./enforcementModel";

function noticeDelivered(why: "waived" | "no_notice_yet" | "no_contact" | "capped") {
  if (why === "capped")
    return "Yes";
  return why === "waived" ? "-" : "No";
}

// Would-suspend and held-back customers share one table, so both map to this row.
type PreviewRow = {
  tenantId: string;
  tenantName: string;
  amountOwedNgn: number | null;
  dueDate: string | null;
  notice: string;
  outcome: string;
};

const COLUMNS: ColumnDef<PreviewRow>[] = [
  {
    accessorKey: "tenantName",
    header: "Customer",
    meta: { className: "font-medium" },
    cell: ({ row }) => (
      <Link
        to={`/tenants/${row.original.tenantId}`}
        className="hover:underline"
      >
        {row.original.tenantName}
      </Link>
    ),
  },
  {
    accessorKey: "amountOwedNgn",
    header: "Owes",
    cell: ({ row }) => row.original.amountOwedNgn === null
      ? <span className="text-muted-foreground">-</span>
      : formatCurrency(
          row.original.amountOwedNgn,
          "NGN",
        ),
  },
  {
    accessorKey: "dueDate",
    header: "Unpaid since",
    cell: ({ row }) => row.original.dueDate === null
      ? <span className="text-muted-foreground">-</span>
      : formatDate(row.original.dueDate),
  },
  {
    accessorKey: "notice", header: "Notice delivered",
  },
  {
    accessorKey: "outcome", header: "What happens", enableSorting: false, meta: { className: "text-sm text-muted-foreground" },
  },
];

export function WouldSuspendPanel({ autoSuspendEnabled }: { autoSuspendEnabled: boolean | undefined }) {
  const query = useEnforcementPreview();
  if (!query.data)
    return null;
  const {
    wouldSuspend, deferred, notes,
  } = query.data.data;
  if (wouldSuspend.length === 0 && deferred.length === 0)
    return null;
  const rows: PreviewRow[] = [
    ...wouldSuspend.map(row => ({
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      amountOwedNgn: row.amountOwedNgn,
      dueDate: row.dueDate,
      notice: "Yes",
      outcome: `${plural(
        row.assets.users,
        "user",
      )}, ${plural(
        row.assets.devices,
        "device",
      )}, ${plural(
        row.assets.sims,
        "SIM",
      )}, ${plural(
        row.assets.shareLinks,
        "share link",
      )}`,
    })),
    ...deferred.map(row => ({
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      amountOwedNgn: null,
      dueDate: null,
      notice: noticeDelivered(row.why),
      outcome: `Held back: ${row.label}`,
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Would be suspended next run</CardTitle>
        <CardDescription>
          {autoSuspendEnabled
            ? "These customers are past their grace period. They are suspended at the next daily run."
            : "Automatic suspension is off, so none of these customers are suspended yet. This is what would happen if it were on."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <DataTable
          columns={COLUMNS}
          data={rows}
        />
        <p className="text-xs text-muted-foreground">{notes.sims}</p>
      </CardContent>
    </Card>
  );
}
