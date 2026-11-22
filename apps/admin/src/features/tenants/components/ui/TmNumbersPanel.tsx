import type { SystemTelecomMasterRequest } from "@truckmoov/api/auth";
import type {
  TmFilter,
  TmNumberStatus,
} from "@/features/tenants/utils/tmNumber";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemTelecomMasterRequestQueryOptions,
  getSystemTelecomMasterRequestsQueryOptions,
  useRetrySystemTelecomMasterRequest,
} from "@truckmoov/api/auth";
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
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TmResolveForm } from "@/features/tenants/components/ui/TmResolveForm";
import { errorMessage } from "@/features/tenants/utils/onboarding";
import {
  formatTmNumber,
  matchesTmFilter,
  TM_STATUS_LABEL,
  TM_STATUS_TONE,
} from "@/features/tenants/utils/tmNumber";

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

const RETRYABLE: TmNumberStatus[] = [
  "verification_failed",
  "allocation_failed",
];

/** Platform Telecom Master tab (Tenants → Telecom Master). */
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

  const listQuery = useQuery(getSystemTelecomMasterRequestsQueryOptions());
  const detailQuery = useQuery({
    ...getSystemTelecomMasterRequestQueryOptions(openId ?? ""),
    enabled: Boolean(openId),
  });
  const retry = useRetrySystemTelecomMasterRequest();

  const rows: SystemTelecomMasterRequest[] = listQuery.data?.data?.requests ?? [];
  const open = detailQuery.data?.data?.request ?? null;
  const events = detailQuery.data?.data?.events ?? [];

  const visible = useMemo(
    () => rows.filter(r =>
      matchesTmFilter(
        r,
        filter,
      )
      && (!q
        || `${r.organizationName} ${r.contactEmail} ${r.msisdn ?? ""} ${r.simSerial ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase()))),
    [
      rows,
      filter,
      q,
    ],
  );

  const handleRetry = (id: string) => {
    retry.mutate(
      { id },
      {
        onSuccess: () => toast.success("Retry requested — the request is back in the pending queue."),
        onError: error => toast.error(errorMessage(
          error,
          "Could not retry this request.",
        )),
      },
    );
  };

  const filtered = Boolean(q.trim()) || filter !== "all";

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
            {listQuery.isLoading
              ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                )
              : listQuery.isError
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {errorMessage(
                          listQuery.error,
                          "Could not load Telecom Master records.",
                        )}
                        {" "}
                        <Button
                          variant="link"
                          onClick={() => listQuery.refetch()}
                        >
                          Try again
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                : visible.length === 0
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          {filtered
                            ? "No Telecom Master records match the current filters."
                            : "No Telecom Master records yet."}
                        </TableCell>
                      </TableRow>
                    )
                  : visible.map((r) => {
                      const st = r.status;
                      const isRetrying = retry.isPending && retry.variables?.id === r.id;
                      return (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="font-medium">{r.organizationName}</div>
                            <div className="text-xs text-muted-foreground">{r.contactEmail}</div>
                          </TableCell>
                          <TableCell>{r.numberType === "existing" ? "Existing" : "New Allocation"}</TableCell>
                          <TableCell>{r.msisdn ? formatTmNumber(r.msisdn) : "Awaiting allocation"}</TableCell>
                          <TableCell>{r.simSerial || "—"}</TableCell>
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
                              r.createdAt,
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
                            {RETRYABLE.includes(st) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="ml-2"
                                loading={isRetrying}
                                onClick={() => handleRetry(r.id)}
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
        open={Boolean(openId)}
        onOpenChange={o => !o && setOpenId(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{open?.organizationName ?? "Telecom Master"}</DialogTitle>
            <DialogDescription>Telecom Master details and audit history for this enterprise account.</DialogDescription>
          </DialogHeader>
          {detailQuery.isLoading
            ? <Skeleton className="h-48 w-full" />
            : detailQuery.isError || !open
              ? (
                  <p className="text-sm text-muted-foreground">
                    {errorMessage(
                      detailQuery.error,
                      "Could not load this Telecom Master record.",
                    )}
                    {" "}
                    <Button
                      variant="link"
                      onClick={() => detailQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </p>
                )
              : (
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
                        <dd className="break-all">{open.applicationReference}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">MTN Reference</dt>
                        <dd>{open.mtnReference || "—"}</dd>
                      </div>
                      {open.failureReason && (
                        <div className="col-span-2">
                          <dt className="text-xs text-muted-foreground">Failure Reason</dt>
                          <dd className="text-destructive">{open.failureReason}</dd>
                        </div>
                      )}
                    </dl>
                    <TmResolveForm
                      key={`${open.id}-${open.status}`}
                      request={open}
                    />
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
                                  e.createdAt,
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
