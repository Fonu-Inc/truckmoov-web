import type { ColumnDef } from "@tanstack/react-table";
import type { StockWaitlistRow } from "@truckmoov/api/auth/device-stock";
import {
  useMutation, useQuery, useQueryClient,
} from "@tanstack/react-query";
import {
  assignPaidStock, deviceStockSummary, getStockWaitlist, resendStockEmail,
  STOCK_WAITLIST_STATUSES, stockWaitlistDetail,
} from "@truckmoov/api/auth/device-stock";
import { DataTable } from "@truckmoov/reusables/components/shadcn/data-table";
import {
  useMemo, useState,
} from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";

const stockKey = ["platform-device-stock"] as const;
const queueKey = ["platform-stock-waitlist"] as const;
const field = "h-10 rounded-md border border-input bg-background px-3 text-sm";
const day = (iso: string | null) => iso ? new Date(iso).toLocaleDateString() : "—";
const model = (r: Pick<StockWaitlistRow, "manufacturer" | "model">) => `${r.manufacturer} ${r.model}`;
function errorText(error: unknown) {
  const msg = (error as { message?: string } | null)?.message;
  return msg || "Could not complete that action. Try again.";
}
function Kpi({
  label, value,
}: {
  label: string; value: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function DeviceStockInventorySummary() {
  const {
    data, isPending, isError, refetch,
  } = useQuery({
    queryKey: stockKey, queryFn: deviceStockSummary, refetchInterval: 30_000,
  });
  if (isPending)
    return <p className="py-3 text-sm text-muted-foreground">Loading stock counts…</p>;
  if (isError || !data) {
    return (
      <div
        className="flex items-center gap-3 py-3 text-sm"
        role="alert"
      >
        Could not load stock counts.
        {" "}
        <Button
          variant="outline"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }
  return (
    <section
      className="space-y-3"
      aria-label="Stock summary"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          label="Available Units"
          value={data.totals.available}
        />
        <Kpi
          label="Held for Payment"
          value={data.totals.held}
        />
        <Kpi
          label="Paid, Awaiting Assignment"
          value={data.totals.paid}
        />
      </div>
      <h2 className="font-semibold">Stock by Model</h2>
      {data.models.length === 0 && <p className="text-sm text-muted-foreground">No supported models.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.models.map(m => (
          <div
            className="rounded-lg border bg-card p-4"
            key={m.id}
          >
            <h3 className="font-medium">{model(m)}</h3>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt>Available</dt>
                <dd>{m.available}</dd>
              </div>
              <div>
                <dt>Held</dt>
                <dd>{m.held}</dd>
              </div>
              <div>
                <dt>Paid</dt>
                <dd>{m.paid}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function exportRows(rows: StockWaitlistRow[]) {
  const cell = (v: string | number | null) => {
    const s = String(v ?? "");
    const safe = /^\s*[=+@-]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(
      /"/g,
      "\"\"",
    )}"`;
  };
  const csv = [
    [
      "Organisation",
      "Reference",
      "Model",
      "Requested",
      "Offered",
      "Paid",
      "Still Waiting",
      "Date Joined",
      "Email Status",
      "Status",
    ],
    ...rows.map(r => [
      r.organisation,
      r.reference,
      model(r),
      r.requested,
      r.offered,
      r.paid,
      r.waiting,
      r.joinedAt,
      r.emailStatus,
      r.status,
    ]),
  ].map(row => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(
    [csv],
    { type: "text/csv;charset=utf-8" },
  ));
  const link = document.createElement("a");
  link.href = url;
  link.download = "stock-waitlist.csv";
  link.click();
  setTimeout(
    () => URL.revokeObjectURL(url),
    1000,
  );
}

export function DeviceStockWaitlist() {
  const {
    data, isPending, isError, refetch,
  } = useQuery({
    queryKey: queueKey, queryFn: getStockWaitlist, refetchInterval: 30_000,
  });
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("");
  const [
    modelFilter,
    setModel,
  ] = useState("");
  const [
    from,
    setFrom,
  ] = useState("");
  const [
    to,
    setTo,
  ] = useState("");
  const [
    filters,
    setFilters,
  ] = useState(false);
  const [
    selected,
    setSelected,
  ] = useState<string>();
  const counts = data?.counts;
  const rows = useMemo(
    () => (data?.requests ?? []).filter((r) => {
      const ts = r.joinedAt?.slice(
        0,
        10,
      ) ?? "";
      return (!search || [
        r.organisation,
        r.reference,
        model(r),
      ].some(s => s.toLowerCase().includes(search.trim().toLowerCase())))
      && (!status || r.status === status) && (!modelFilter || model(r) === modelFilter) && (!from || ts >= from) && (!to || ts <= to);
    }),
    [
      data,
      search,
      status,
      modelFilter,
      from,
      to,
    ],
  );
  const columns = useMemo<ColumnDef<StockWaitlistRow>[]>(
    () => [
      {
        accessorKey: "organisation", header: "Organisation",
      },
      {
        accessorKey: "reference", header: "Reference",
      },
      {
        id: "model", accessorFn: model, header: "Model",
      },
      {
        accessorKey: "requested", header: "Requested",
      },
      {
        id: "offeredPaid", header: "Offered / Paid", cell: ({ row }) => `${row.original.offered} / ${row.original.paid}`,
      },
      {
        accessorKey: "waiting", header: "Still Waiting",
      },
      {
        accessorKey: "joinedAt", header: "Date Joined", cell: ({ row }) => day(row.original.joinedAt),
      },
      {
        accessorKey: "emailStatus", header: "Email Status", cell: ({ row }) => row.original.emailStatus ?? "—",
      },
      {
        accessorKey: "status", header: "Status",
      },
      {
        id: "action", header: "Action", cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelected(row.original.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [],
  );
  return (
    <section
      className="space-y-4"
      aria-label="Stock waitlist"
    >
      {counts && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Customers Waiting"
            value={counts.customersWaiting}
          />
          <Kpi
            label="Units Still Needed"
            value={counts.unitsStillNeeded}
          />
          <Kpi
            label="Offers Awaiting Payment"
            value={counts.offersAwaitingPayment}
          />
          <Kpi
            label="Paid, Ready to Assign"
            value={counts.paidReadyToAssign}
          />
        </div>
      )}
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Stock Waitlist</h2>
          <Button
            variant="outline"
            onClick={() => exportRows(rows)}
            disabled={!rows.length}
          >
            Export
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            aria-label="Search waitlist"
            placeholder="Search organisation, reference or model"
            className="min-w-60 flex-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className={field}
            aria-label="Status"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STOCK_WAITLIST_STATUSES.map(v => <option key={v}>{v}</option>)}
          </select>
          <Button
            variant="outline"
            aria-expanded={filters}
            onClick={() => setFilters(!filters)}
          >
            Filter
          </Button>
        </div>
        {filters && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-sm">
              Model
              <select
                value={modelFilter}
                onChange={e => setModel(e.target.value)}
                className={field}
              >
                <option value="">All models</option>
                {Array.from(new Set(data?.requests.map(model) ?? [])).sort().map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Date joined from
              <Input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Date joined to
              <Input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </label>
            <Button
              variant="ghost"
              onClick={() => {
                setModel("");
                setFrom("");
                setTo("");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isPending}
          isError={isError}
          onRetry={() => void refetch()}
          emptyState="No customers on the stock waitlist yet."
          hasActiveFilters={!!(search || status || modelFilter || from || to)}
        />
      </div>
      {selected && (
        <WaitlistWindow
          key={selected}
          id={selected}
          onClose={() => setSelected(undefined)}
        />
      )}
    </section>
  );
}

function WaitlistWindow({
  id, onClose,
}: {
  id: string; onClose: () => void;
}) {
  const key = [
    ...queueKey,
    id,
  ];
  const qc = useQueryClient();
  const [
    picking,
    setPicking,
  ] = useState(false);
  const [
    picked,
    setPicked,
  ] = useState<string[]>([]);
  const {
    data, isPending, isError, refetch,
  } = useQuery({
    queryKey: key, queryFn: () => stockWaitlistDetail(id),
  });
  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: queueKey }),
    qc.invalidateQueries({ queryKey: stockKey }),
  ]);
  const resend = useMutation({
    mutationFn: (emailId: string) => resendStockEmail(
      id,
      emailId,
    ), onSuccess: refresh,
  });
  const assign = useMutation({
    mutationFn: () => assignPaidStock(
      id,
      picked,
    ), onSuccess: async () => {
      setPicked([]);
      setPicking(false);
      await refresh();
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open)
          onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data?.organisation ?? "Stock waitlist request"}</DialogTitle>
          <DialogDescription>{data ? `${data.reference} · ${model(data)}` : "Request details"}</DialogDescription>
        </DialogHeader>
        {isPending && <p>Loading request…</p>}
        {isError && (
          <div role="alert">
            Could not load request.
            <Button
              variant="outline"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        )}
        {data && (
          <>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm sm:grid-cols-4">
              <div>
                <dt>Requested</dt>
                <dd>{data.requested}</dd>
              </div>
              <div>
                <dt>Offered</dt>
                <dd>{data.offered}</dd>
              </div>
              <div>
                <dt>Paid</dt>
                <dd>{data.paid}</dd>
              </div>
              <div>
                <dt>Still waiting</dt>
                <dd>{data.waiting}</dd>
              </div>
            </dl>
            <p className="text-sm">
              Status:
              {data.status}
              {" "}
              · Email:
              {data.emailStatus ?? "Not sent"}
            </p>
            <a
              href={data.offerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium underline"
            >
              Open customer offer page
            </a>
            <section className="space-y-2">
              <h3 className="font-semibold">Offer history</h3>
              {!data.offers.length && <p className="text-sm text-muted-foreground">No offers yet.</p>}
              {data.offers.map(o => (
                <div
                  key={o.id}
                  className="rounded-md border p-3 text-sm"
                >
                  <p>
                    {o.quantity}
                    {" "}
                    unit(s) ·
                    {" "}
                    {o.state === "held" ? "Awaiting payment" : o.state === "paid" ? "Paid" : "Cancelled"}
                    {" "}
                    ·
                    {" "}
                    {day(o.createdAt)}
                  </p>
                  <p className="text-muted-foreground">{o.initialCheckout ? "Initial onboarding checkout" : `Email: ${o.emailStatus ?? "Not sent"}`}</p>
                  {o.emailStatus === "Failed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resend.isPending}
                      onClick={() => resend.mutate(o.id)}
                    >
                      Resend email
                    </Button>
                  )}
                </div>
              ))}
              {data.emailStatus === "Failed" && !data.offers.some(o => o.emailStatus === "Failed")
                && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={resend.isPending}
                    onClick={() => resend.mutate("joined")}
                  >
                    Resend waitlist confirmation
                  </Button>
                )}
              {resend.isSuccess && (
                <p
                  role="status"
                  className="text-sm"
                >
                  Email queued for resend.
                </p>
              )}
              {resend.isError && (
                <p
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errorText(resend.error)}
                </p>
              )}
            </section>
            {!!data.paidUnits.length && !picking && <Button onClick={() => setPicking(true)}>Assign devices</Button>}
            {picking && (
              <section className="space-y-2 rounded-lg border p-4">
                <h3 className="font-semibold">Select paid devices held for this order</h3>
                {data.paidUnits.map(u => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={picked.includes(u.id)}
                      onChange={e => setPicked(e.target.checked ? [
                        ...picked,
                        u.id,
                      ] : picked.filter(i => i !== u.id))}
                    />
                    IMEI
                    {" "}
                    {u.imei}
                  </label>
                ))}
                <Button
                  disabled={!picked.length || assign.isPending}
                  onClick={() => assign.mutate()}
                >
                  Confirm assignment
                </Button>
                {assign.isError && (
                  <p
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {errorText(assign.error)}
                  </p>
                )}
              </section>
            )}
            {assign.isSuccess && (
              <p
                role="status"
                className="text-sm"
              >
                Devices assigned.
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
