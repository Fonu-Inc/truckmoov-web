import type {
  SystemDeviceSetupRequest,
  SystemDeviceSetupRequestsQuery,
} from "@truckmoov/api/auth";
import type { DeviceSetupFilters } from "./requests/deviceSetupConfig";
import {
  useQuery, useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemDeviceSetupRequestQueryOptions,
  getSystemDeviceSetupRequestsExportQueryOptions,
  getSystemDeviceSetupRequestsQueryOptions,
  useApproveSystemDeviceSetupRequest,
  useAssignSystemDeviceSetupRequest,
  useRejectSystemDeviceSetupRequest,
  useSystemDeviceSetupSummary,
} from "@truckmoov/api/auth";
import {
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { getDeviceSetupColumns } from "./requests/deviceSetupColumns";
import {
  cloneFilters,
  countActiveFilters,

  downloadBlob,
  EMPTY_FILTERS,
  getStatusBucket,
  STATUS_OPTIONS,
} from "./requests/deviceSetupConfig";
import { DeviceSetupFilterPopover } from "./requests/DeviceSetupFilterPopover";
import { DeviceSetupRequestDetailsDialog } from "./requests/DeviceSetupRequestDetailsDialog";
import { RejectDeviceSetupRequestDialog } from "./requests/RejectDeviceSetupRequestDialog";

const ALL_STATUSES = "all";

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

function buildQueryPayload(search: string): SystemDeviceSetupRequestsQuery {
  return { params: search ? { search } : {} };
}

export function DeviceSetupRequestsQueue() {
  const queryClient = useQueryClient();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState(ALL_STATUSES);
  const [
    filters,
    setFilters,
  ] = useState<DeviceSetupFilters>(() => cloneFilters(EMPTY_FILTERS));
  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState<SystemDeviceSetupRequest | null>(null);
  const [
    rejectTarget,
    setRejectTarget,
  ] = useState<SystemDeviceSetupRequest | null>(null);
  const [
    approvingId,
    setApprovingId,
  ] = useState<string | null>(null);
  const [
    assigningId,
    setAssigningId,
  ] = useState<string | null>(null);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const debouncedSearch = useDebouncedValue(
    search.trim(),
    350,
  );

  const approveRequest = useApproveSystemDeviceSetupRequest();
  const assignRequest = useAssignSystemDeviceSetupRequest();
  const rejectRequest = useRejectSystemDeviceSetupRequest();
  const summaryQuery = useSystemDeviceSetupSummary();
  const summary = summaryQuery.data?.data;

  const queryPayload = useMemo(
    () => buildQueryPayload(debouncedSearch),
    [debouncedSearch],
  );
  const requestsQuery = useQuery(getSystemDeviceSetupRequestsQueryOptions(queryPayload));
  const detailQuery = useQuery({
    ...getSystemDeviceSetupRequestQueryOptions(selectedRequest?.id ?? ""),
    enabled: Boolean(selectedRequest?.id),
  });

  const allRequests = requestsQuery.data?.data?.requests;
  const organisations = useMemo(
    () => [...new Set((allRequests ?? []).map(r => r.organisationName).filter((n): n is string => Boolean(n)))].sort(),
    [allRequests],
  );
  const manufacturers = useMemo(
    () => [...new Set((allRequests ?? []).map(r => r.manufacturer).filter(Boolean))].sort(),
    [allRequests],
  );
  const requests = useMemo(
    () => {
      const {
        organisation, manufacturer,
      } = filters;
      return (allRequests ?? []).filter((r) => {
        if (statusFilter !== ALL_STATUSES && getStatusBucket(r.status) !== statusFilter)
          return false;
        if (organisation.enabled && organisation.value && r.organisationName !== organisation.value)
          return false;
        return !(manufacturer.enabled && manufacturer.value && r.manufacturer !== manufacturer.value);
      });
    },
    [
      allRequests,
      filters,
      statusFilter,
    ],
  );
  const detailRequest = detailQuery.data?.data ?? selectedRequest;
  const hasActiveFilters = Boolean(debouncedSearch)
    || statusFilter !== ALL_STATUSES
    || countActiveFilters(filters) > 0;
  const isMutating = approveRequest.isPending || assignRequest.isPending || rejectRequest.isPending;

  function handleApprove(request: SystemDeviceSetupRequest, note?: string) {
    setApprovingId(request.id);
    approveRequest.mutate(
      {
        id: request.id, data: note?.trim() ? { note: note.trim() } : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Request approved");
          setSelectedRequest(null);
        },
        onError: error => toast.error(error.message),
        onSettled: () => setApprovingId(null),
      },
    );
  }

  function handleAssign(request: SystemDeviceSetupRequest) {
    setAssigningId(request.id);
    assignRequest.mutate(
      { id: request.id },
      {
        onSuccess: () => toast.success("Device setup request assigned"),
        onError: error => toast.error(error.message),
        onSettled: () => setAssigningId(null),
      },
    );
  }

  function handleReject(reason: string) {
    if (!rejectTarget)
      return;
    rejectRequest.mutate(
      {
        id: rejectTarget.id, data: { reason },
      },
      {
        onSuccess: () => {
          toast.success("Request rejected");
          setRejectTarget(null);
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  function openReject(request: SystemDeviceSetupRequest) {
    setSelectedRequest(null);
    setRejectTarget(request);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemDeviceSetupRequestsExportQueryOptions(queryPayload));
      downloadBlob(
        blob,
        "device-setup-requests.csv",
      );
      toast.success("Device setup requests exported");
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  }

  const columns = getDeviceSetupColumns({
    isMutating,
    approvingId,
    assigningId,
    onView: setSelectedRequest,
    onApprove: request => handleApprove(request),
    onReject: openReject,
    onAssign: handleAssign,
  });

  const emptyState = (message: string) => (
    <div className="py-12 text-center text-sm text-muted-foreground">
      <Cpu className="mx-auto mb-4 h-12 w-12 opacity-50" />
      <p>No device provisioning requests found</p>
      <p className="text-xs">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Devices Requested"
          icon={Cpu}
          value={summary?.devicesRequested ?? 0}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          title="Pending Review"
          icon={Clock}
          variant="warning"
          value={summary?.pendingApproval ?? 0}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          title="Approved Requests"
          icon={CheckCircle2}
          variant="success"
          value={summary?.approved ?? 0}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          title="Rejected Requests"
          icon={XCircle}
          variant="danger"
          value={summary?.rejected ?? 0}
          loading={summaryQuery.isLoading}
        />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Device Requests
              </CardTitle>
              <CardDescription>
                Tenant-submitted device provisioning requests awaiting platform review and fulfilment
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={requestsQuery.isLoading || isExporting}
              className="bg-transparent"
            >
              {isExporting
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Download className="mr-2 h-4 w-4" />}
              Export Data
            </Button>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organisation, email, manufacturer, model…"
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DeviceSetupFilterPopover
              applied={filters}
              onApply={setFilters}
              organisations={organisations}
              manufacturers={manufacturers}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <DataTable
              columns={columns}
              data={requests}
              isLoading={requestsQuery.isLoading}
              isError={requestsQuery.isError}
              errorMessage="Unable to load setup requests."
              onRetry={() => requestsQuery.refetch()}
              hasActiveFilters={hasActiveFilters}
              emptyState={emptyState("Wait for tenants to request devices")}
              filteredEmptyState={emptyState("Adjust filters or wait for tenants to request devices")}
            />
          </div>
        </CardContent>
      </Card>

      <RejectDeviceSetupRequestDialog
        open={!!rejectTarget}
        organisation={rejectTarget?.organisationName ?? undefined}
        isPending={rejectRequest.isPending}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleReject}
      />

      <DeviceSetupRequestDetailsDialog
        request={detailRequest}
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        isBusy={isMutating}
        onRetry={() => detailQuery.refetch()}
        onClose={() => setSelectedRequest(null)}
        onApprove={handleApprove}
        onReject={openReject}
      />
    </div>
  );
}
