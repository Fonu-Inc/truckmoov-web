import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  CheckCircle,
  ClipboardCheck,
  Clock,
  Download,
  Loader2,
  Search,
  Wifi,
  XCircle,
} from "lucide-react";
import {
  getSystemSimsRequestsExportQueryOptions,
  getSystemSimsRequestsQueryOptions,
  getSystemSimsRequestsSummaryQueryOptions,
  type SystemSimRequest,
  type SystemSimRequestsQuery,
  useApproveSIMRequest,
  useRejectSIMRequest,
} from "@truckmoov/api/auth";
import { toast } from "sonner";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
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
import { Textarea } from "@/components/shadcn/textarea";

import { SIMApprovalSummaryCards } from "./SIMApprovalSummaryCards";

const emptyValue = "-";
const REJECT_SIM_REQUEST_FORM_ID = "reject-sim-request-form";

const rejectRequestSchema = z.object({
  reason: z.string().trim().min(1, "Rejection reason is required."),
});

type RejectRequestFormValues = z.infer<typeof rejectRequestSchema>;

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);

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

const formatDataLimit = (valueMb: number) => {
  if (!Number.isFinite(valueMb) || valueMb <= 0) return emptyValue;
  if (valueMb >= 1024) {
    const gb = valueMb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${valueMb} MB`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyValue;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const titleCase = (value: string | null | undefined) =>
  value
    ? value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : emptyValue;

const isPendingRequest = (request: SystemSimRequest) => request.status.toLowerCase() === "pending";

const getStatusBadge = (status: string) => {
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
};

export function SIMApprovalQueue() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [organisationFilter, setOrganisationFilter] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [useCaseFilter, setUseCaseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState<SystemSimRequest | null>(null);

  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 350);
  const debouncedOrganisationFilter = useDebouncedValue(organisationFilter.trim(), 350);
  const debouncedCarrierFilter = useDebouncedValue(carrierFilter.trim(), 350);
  const debouncedUseCaseFilter = useDebouncedValue(useCaseFilter.trim(), 350);

  const approveRequest = useApproveSIMRequest();
  const rejectRequest = useRejectSIMRequest();
  const rejectForm = useForm<RejectRequestFormValues>({
    resolver: zodResolver(rejectRequestSchema),
    defaultValues: {
      reason: "",
    },
  });

  const queryPayload = useMemo<SystemSimRequestsQuery | undefined>(() => {
    const params: NonNullable<SystemSimRequestsQuery["params"]> = {};

    if (statusFilter !== "all") {
      params.status = statusFilter as "pending" | "approved" | "rejected";
    }
    if (debouncedSearchQuery) params.search = debouncedSearchQuery;
    if (debouncedOrganisationFilter) params.organisation = debouncedOrganisationFilter;
    if (debouncedCarrierFilter) params.carrier = debouncedCarrierFilter;
    if (debouncedUseCaseFilter) params.useCase = debouncedUseCaseFilter;

    return Object.keys(params).length > 0 ? { params } : undefined;
  }, [
    debouncedCarrierFilter,
    debouncedOrganisationFilter,
    debouncedSearchQuery,
    debouncedUseCaseFilter,
    statusFilter,
  ]);

  const requestsQuery = useQuery(getSystemSimsRequestsQueryOptions(queryPayload));
  const summaryQuery = useQuery(getSystemSimsRequestsSummaryQueryOptions());
  const requests = requestsQuery.data?.data.requests ?? [];
  const summary = summaryQuery.data?.data;
  const summaryLoadingValue = summaryQuery.isLoading ? "..." : 0;

  const summaryStats = {
    totalRequested: summary?.totalRequested ?? summaryLoadingValue,
    pendingCount: summary?.pendingApproval ?? summaryLoadingValue,
    approvedCount: summary?.approvedThisMonth ?? summaryLoadingValue,
    rejectedCount: summary?.rejectedThisMonth ?? summaryLoadingValue,
  };

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
        onError: (error) => toast.error(error.message),
        onSettled: () => setApprovingRequestId(null),
      },
    );
  };

  const handleRejectSubmit = (values: RejectRequestFormValues) => {
    if (!selectedRejectRequest) return;

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
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemSimsRequestsExportQueryOptions(queryPayload));
      downloadBlob(blob as Blob, "sim-requests.csv");
      toast.success("SIM requests exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SIMApprovalSummaryCards {...summaryStats} />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export Data
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(160px,1fr))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-10"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Input
              placeholder="Organisation"
              value={organisationFilter}
              onChange={(event) => setOrganisationFilter(event.target.value)}
            />
            <Input
              placeholder="Carrier"
              value={carrierFilter}
              onChange={(event) => setCarrierFilter(event.target.value)}
            />
            <Input
              placeholder="Use case"
              value={useCaseFilter}
              onChange={(event) => setUseCaseFilter(event.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px] px-6 whitespace-nowrap">Organisation</TableHead>
                  <TableHead className="min-w-[150px] px-6 whitespace-nowrap">Carrier</TableHead>
                  <TableHead className="min-w-[210px] px-6 whitespace-nowrap">Plan / Use Case</TableHead>
                  <TableHead className="min-w-[160px] px-6 whitespace-nowrap">Data Limit / SIM</TableHead>
                  <TableHead className="min-w-[120px] px-6 whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="min-w-[150px] px-6 whitespace-nowrap">Status</TableHead>
                  <TableHead className="min-w-[170px] px-6 whitespace-nowrap">Date Requested</TableHead>
                  <TableHead className="min-w-[190px] px-6 text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestsQuery.isLoading || requestsQuery.isFetching ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="py-12 text-center text-muted-foreground">
                        <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin" />
                        Loading SIM requests...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="py-12 text-center text-muted-foreground">
                        <Wifi className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No provisioning requests found</p>
                        <p className="text-sm">Adjust filters or wait for tenants to request SIM activations</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="px-6 font-semibold">{request.tenantName || emptyValue}</TableCell>
                      <TableCell className="px-6 font-medium">{request.preferredOperator || emptyValue}</TableCell>
                      <TableCell className="px-6">
                        <div className="space-y-1">
                          <p className="font-semibold">{request.requestedPlan || emptyValue}</p>
                          <p className="text-sm text-muted-foreground">{titleCase(request.useCase)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 font-semibold">
                        {formatDataLimit(request.requestedDataLimitMb)}
                      </TableCell>
                      <TableCell className="px-6 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-muted-foreground" />
                          {request.numberOfSims}
                        </span>
                      </TableCell>
                      <TableCell className="px-6">{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="px-6 text-muted-foreground">{formatDate(request.createdAt)}</TableCell>
                      <TableCell className="px-6">
                        <div className="flex items-center justify-end gap-2">
                          {isPendingRequest(request) ? (
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
                          ) : (
                            <span className="text-sm text-muted-foreground">Processed</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedRejectRequest)}
        onOpenChange={(open) => {
          if (!open && !rejectRequest.isPending) closeRejectDialog();
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
            <Button variant="outline" onClick={closeRejectDialog} disabled={rejectRequest.isPending}>
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
