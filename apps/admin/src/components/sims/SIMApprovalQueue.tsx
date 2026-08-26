import type { ColumnDef } from "@tanstack/react-table";
import type {
  SystemSimRequest,
  SystemSimRequestsQuery,
} from "@truckmoov/api/auth";
import type {
  FilterDraft,
  FilterField,
} from "@/components/shadcn/platform-filter-popover";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemSimsRequestsExportQueryOptions,
  getSystemSimsRequestsQueryOptions,
  getSystemSimsRequestsSummaryQueryOptions,
  getSystemTenantsQueryOptions,

  useApproveSIMRequest,
  useRejectSIMRequest,
} from "@truckmoov/api/auth";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import {
  CheckCircle,
  ClipboardCheck,
  Clock,
  Download,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  buildEmptyDraft,
  PlatformFilterPopover,
} from "@/components/shadcn/platform-filter-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";

import { SIMApprovalSummaryCards } from "./SIMApprovalSummaryCards";

const emptyValue = "-";
const REJECT_SIM_REQUEST_FORM_ID = "reject-sim-request-form";

const rejectRequestSchema = z.object({
  reason: z.string().trim().min(
    1,
    "Rejection reason is required.",
  ),
});

type RejectRequestFormValues = z.infer<typeof rejectRequestSchema>;

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [
    debounced,
    setDebounced,
  ] = useState(value);

  useEffect(
    () => {
      const timeout = window.setTimeout(
        setDebounced,
        delayMs,
        value,
      );
      return () => window.clearTimeout(timeout);
    },
    [
      delayMs,
      value,
    ],
  );

  return debounced;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDataLimit(valueMb: number) {
  if (!Number.isFinite(valueMb) || valueMb <= 0)
    return emptyValue;
  if (valueMb >= 1024) {
    const gb = valueMb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${valueMb} MB`;
}

function titleCase(value: string | null | undefined) {
  return value
    ? value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : emptyValue;
}

const isPendingRequest = (request: SystemSimRequest) => request.status.toLowerCase() === "pending";

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return (
        <Badge className="border-warning/30 bg-warning/10 text-warning">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge className="border-success/30 bg-success/10 text-success">
          <CheckCircle className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status || emptyValue}</Badge>;
  }
}

export function SIMApprovalQueue() {
  const queryClient = useQueryClient();
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const [
    approvingRequestId,
    setApprovingRequestId,
  ] = useState<string | null>(null);
  const [
    selectedRejectRequest,
    setSelectedRejectRequest,
  ] = useState<SystemSimRequest | null>(null);

  const tenantsQuery = useQuery(getSystemTenantsQueryOptions());
  const tenantOptions = useMemo(
    () => (tenantsQuery.data?.data.tenants ?? [])
      .map(t => ({
        value: t.name,
        label: t.name,
      })),
    [tenantsQuery.data],
  );

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: "organisation",
        label: "Organisation",
        type: "select",
        options: tenantOptions,
      },
    ],
    [tenantOptions],
  );

  const [
    advancedFilters,
    setAdvancedFilters,
  ] = useState<FilterDraft>(() => buildEmptyDraft(filterFields));

  const debouncedSearch = useDebouncedValue(
    searchQuery.trim(),
    350,
  );

  const apiOrganisation
    = advancedFilters.organisation?.enabled && advancedFilters.organisation?.value
      ? advancedFilters.organisation.value
      : undefined;

  const approveRequest = useApproveSIMRequest();
  const rejectRequest = useRejectSIMRequest();
  const rejectForm = useForm<RejectRequestFormValues>({
    resolver: zodResolver(rejectRequestSchema),
    defaultValues: { reason: "" },
  });

  const queryPayload = useMemo<SystemSimRequestsQuery | undefined>(
    () => {
      const params: NonNullable<SystemSimRequestsQuery["params"]> = {};

      if (statusFilter !== "all") {
        params.status = statusFilter as "pending" | "approved" | "rejected";
      }
      if (debouncedSearch)
        params.search = debouncedSearch;
      if (apiOrganisation)
        params.organisation = apiOrganisation;

      return Object.keys(params).length > 0 ? { params } : undefined;
    },
    [
      apiOrganisation,
      debouncedSearch,
      statusFilter,
    ],
  );

  const requestsQuery = useQuery(getSystemSimsRequestsQueryOptions(queryPayload));
  const summaryQuery = useQuery(getSystemSimsRequestsSummaryQueryOptions());
  const requests = requestsQuery.data?.data.requests ?? [];
  const summary = summaryQuery.data?.data;

  const hasActiveFilters = statusFilter !== "all" || !!debouncedSearch || !!apiOrganisation;

  const closeRejectDialog = () => {
    setSelectedRejectRequest(null);
    rejectForm.reset();
  };

  const handleApprove = (request: SystemSimRequest) => {
    setApprovingRequestId(request.id);
    approveRequest.mutate(
      { id: request.id },
      {
        onSuccess: () => toast.success("SIM request approved"),
        onError: error => toast.error(error.message),
        onSettled: () => setApprovingRequestId(null),
      },
    );
  };

  const handleRejectSubmit = (values: RejectRequestFormValues) => {
    if (!selectedRejectRequest)
      return;

    rejectRequest.mutate(
      {
        id: selectedRejectRequest.id,
        data: { reason: values.reason.trim() },
      },
      {
        onSuccess: () => {
          toast.success("SIM request rejected");
          closeRejectDialog();
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemSimsRequestsExportQueryOptions(queryPayload));
      downloadBlob(
        blob as Blob,
        "sim-requests.csv",
      );
      toast.success("SIM requests exported");
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  const columns: ColumnDef<SystemSimRequest>[] = useMemo(
    () => [
      {
        id: "organisation",
        header: "Organisation",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.tenantName || emptyValue}</span>
        ),
      },
      {
        id: "carrier",
        header: "Carrier",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.preferredOperator || emptyValue}</span>
        ),
      },
      {
        id: "plan",
        header: "Plan / Use Case",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold">{row.original.requestedPlan || emptyValue}</p>
            <p className="text-sm text-muted-foreground">{titleCase(row.original.useCase)}</p>
          </div>
        ),
      },
      {
        id: "dataLimit",
        header: "Data Limit / SIM",
        cell: ({ row }) => (
          <span className="font-semibold">{formatDataLimit(row.original.requestedDataLimitMb)}</span>
        ),
      },
      {
        id: "quantity",
        header: "Quantity",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 font-semibold">
            <CheckCircle className="h-3 w-3 text-muted-foreground" />
            {row.original.numberOfSims}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        id: "createdAt",
        header: "Date Requested",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(
              row.original.createdAt,
              emptyValue,
            )}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="block text-right">Actions</span>,
        cell: ({ row }) => {
          const request = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              {isPendingRequest(request)
                ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRejectRequest(request)}
                        disabled={approveRequest.isPending || rejectRequest.isPending}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request)}
                        loading={approvingRequestId === request.id}
                        disabled={rejectRequest.isPending}
                      >
                        Approve
                      </Button>
                    </>
                  )
                : (
                    <span className="text-sm text-muted-foreground">Processed</span>
                  )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      approveRequest.isPending,
      rejectRequest.isPending,
      approvingRequestId,
    ],
  );

  return (
    <div className="space-y-6">
      <SIMApprovalSummaryCards
        totalRequested={summary?.totalRequested ?? 0}
        pendingCount={summary?.pendingApproval ?? 0}
        approvedCount={summary?.approvedThisMonth ?? 0}
        rejectedCount={summary?.rejectedThisMonth ?? 0}
        loading={summaryQuery.isPending}
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                SIM Requests
              </CardTitle>
              <CardDescription>
                Tenant submissions for new SIM provisioning awaiting review, approval, or fulfilment.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={requestsQuery.isLoading || isExporting}
            >
              {isExporting
                ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )
                : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
              Export Data
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-10"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <PlatformFilterPopover
              entity="requests"
              fields={filterFields}
              value={advancedFilters}
              onApply={setAdvancedFilters}
              onReset={() => setAdvancedFilters(buildEmptyDraft(filterFields))}
            />
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <DataTable
              columns={columns}
              data={requests}
              isLoading={requestsQuery.isLoading}
              isError={requestsQuery.isError}
              errorMessage="Unable to load SIM requests."
              onRetry={() => requestsQuery.refetch()}
              hasActiveFilters={hasActiveFilters}
              emptyState="No provisioning requests found"
              filteredEmptyState="No requests match your filters."
              className="[&_th]:px-6 [&_td]:px-6 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedRejectRequest)}
        onOpenChange={(open) => {
          if (!open && !rejectRequest.isPending)
            closeRejectDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject SIM Request</DialogTitle>
            <DialogDescription>
              Provide a reason before rejecting this provisioning request.
            </DialogDescription>
          </DialogHeader>

          <Form {...rejectForm}>
            <form
              id={REJECT_SIM_REQUEST_FORM_ID}
              onSubmit={rejectForm.handleSubmit(handleRejectSubmit)}
              className="space-y-4"
            >
              <FormField
                control={rejectForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Explain why this request is being rejected."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRejectDialog}
              disabled={rejectRequest.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={REJECT_SIM_REQUEST_FORM_ID}
              variant="destructive"
              loading={rejectRequest.isPending}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
