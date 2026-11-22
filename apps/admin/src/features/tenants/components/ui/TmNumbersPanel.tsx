import type {
  TmFilter,
  TmNumberStatus,
} from "@/features/tenants/utils/tmNumber";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  RotateCw,
  Search,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
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
import {
  formatTmNumber,
  matchesTmFilter,
  TM_STATUS_LABEL,
  TM_STATUS_TONE,
} from "@/features/tenants/utils/tmNumber";

type TmNumberRequest = {
  id: string;
  organization_name: string;
  contact_email: string;
  number_type: "existing" | "new";
  msisdn: string | null;
  sim_serial: string | null;
  status: TmNumberStatus;
  application_reference: string;
  mtn_reference: string | null;
  failure_reason: string | null;
  created_at: string;
};

type TmNumberEvent = {
  id: string;
  request_id: string;
  action: string;
  detail: string | null;
  created_at: string;
};

// ponytail: mock data from fleetflow parity port — wire to packages/api
// (the reference's tm_number_requests table is empty in the demo, so is this).
const tmNumberRequests: TmNumberRequest[] = [];

// ponytail: mock data from fleetflow parity port — wire to packages/api
const tmNumberEvents: TmNumberEvent[] = [];

const FILTERS: {
  value: TmFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All Telecom Master",
  },
  {
    value: "existing",
    label: "Existing Numbers",
  },
  {
    value: "new",
    label: "New Allocation Requests",
  },
  {
    value: "pending_verification",
    label: "Pending Verification",
  },
  {
    value: "allocation_pending",
    label: "Pending Allocation",
  },
  {
    value: "allocated",
    label: "Allocated",
  },
  {
    value: "failed",
    label: "Failed Requests",
  },
];

/** Fleetflow's platform Telecom Master tab (Tenants → Telecom Master). */
export function TmNumbersPanel() {
  const [
    filter,
    setFilter,
  ] = useState<TmFilter>("all");
  const [
    q,
    setQ,
  ] = useState("");
  const [
    openId,
    setOpenId,
  ] = useState<string | null>(null);

  const rows = tmNumberRequests;
  const events = useMemo(
    () => tmNumberEvents.filter(e => e.request_id === openId),
    [openId],
  );

  // ponytail: the reference invokes its tm-number-service "retry" action — no truckmoov endpoint yet.
  const retry = () => toast.success("Retried — MTN service connection is still pending");

  const visible = useMemo(
    () => rows.filter(r => matchesTmFilter(
      r,
      filter,
    )
    && (!q || `${r.organization_name} ${r.contact_email} ${r.msisdn ?? ""} ${r.sim_serial ?? ""}`.toLowerCase().includes(q.toLowerCase()))),
    [
      rows,
      filter,
      q,
    ],
  );
  const open = rows.find(r => r.id === openId);

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle>Telecom Master</CardTitle>
        <CardDescription>Telecom Master — existing MTN numbers and new Telecom Master SIM allocation requests. Device SIMs are managed under SIMs.</CardDescription>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search tenant, email or number"
              className="pl-9"
            />
          </div>
          <Select
            value={filter}
            onValueChange={v => setFilter(v as TmFilter)}
          >
            <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FILTERS.map(f => (
                <SelectItem
                  key={f.value}
                  value={f.value}
                >
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Number Type</TableHead>
              <TableHead>Telecom Master</TableHead>
              <TableHead>SIM Serial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0
              ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No Telecom Master records yet.
                    </TableCell>
                  </TableRow>
                )
              : visible.map((r) => {
                  const st = r.status;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.organization_name}</div>
                        <div className="text-xs text-muted-foreground">{r.contact_email}</div>
                      </TableCell>
                      <TableCell>{r.number_type === "existing" ? "Existing" : "New Allocation"}</TableCell>
                      <TableCell>{r.msisdn ? formatTmNumber(r.msisdn) : "Awaiting allocation"}</TableCell>
                      <TableCell>{r.sim_serial || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={TM_STATUS_TONE[st]}
                        >
                          {TM_STATUS_LABEL[st]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatWithPattern(
                          r.created_at,
                          "d MMM yyyy, h:mm a",
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setOpenId(r.id)}
                        >
                          View
                        </Button>
                        {st !== "verified" && st !== "allocated" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2"
                            onClick={retry}
                          >
                            <RotateCw className="mr-1 h-4 w-4" />
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog
        open={Boolean(open)}
        onOpenChange={o => !o && setOpenId(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{open?.organization_name}</DialogTitle>
            <DialogDescription>Telecom Master details and audit history for this enterprise account.</DialogDescription>
          </DialogHeader>
          {open && (
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Telecom Master</dt>
                  <dd>{open.msisdn ? formatTmNumber(open.msisdn) : "Awaiting allocation"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Network</dt>
                  <dd>MTN</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Application Ref</dt>
                  <dd className="break-all">{open.application_reference}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">MTN Reference</dt>
                  <dd>{open.mtn_reference || "—"}</dd>
                </div>
                {open.failure_reason && (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Failure Reason</dt>
                    <dd className="text-destructive">{open.failure_reason}</dd>
                  </div>
                )}
              </dl>
              <div>
                <p className="mb-2 font-medium">Audit History</p>
                <ul className="max-h-56 space-y-2 overflow-y-auto">
                  {events.map(e => (
                    <li
                      key={e.id}
                      className="rounded-lg border p-2"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">
                          {e.action.replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatWithPattern(
                            e.created_at,
                            "d MMM, h:mm a",
                          )}
                        </span>
                      </div>
                      {e.detail && <p className="text-xs text-muted-foreground">{e.detail}</p>}
                    </li>
                  ))}
                  {events.length === 0 && <li className="text-muted-foreground">No events recorded.</li>}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
