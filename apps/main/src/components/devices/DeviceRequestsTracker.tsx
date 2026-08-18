import type { DeviceSetupRequest } from "@truckmoov/api/fleet";
import type React from "react";
import {

  getDeviceSetupRequestQueryOptions,
  useDeviceSetupRequests,
} from "@truckmoov/api/fleet";
import { queryClient } from "@truckmoov/api/lib/query-client";
import {
  formatRelative, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  FileText,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";

type DeviceSetupRequestStatus
  = | "pending_review"
    | "assigned"
    | "in_progress"
    | "provisioned"
    | "active"
    | "rejected"
    | "cancelled"
    | string;

const statusConfig: Record<string, {
  label: string; color: string; icon: React.ReactNode;
}> = {
  pending_review: {
    label: "Pending Review",
    color: "bg-warning/10 text-warning border-warning/30",
    icon: <Clock className="h-3 w-3" />,
  },
  assigned: {
    label: "Assigned",
    color: "bg-primary/10 text-primary border-primary/30",
    icon: <Loader2 className="h-3 w-3" />,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-primary/10 text-primary border-primary/30",
    icon: <Loader2 className="h-3 w-3" />,
  },
  provisioned: {
    label: "Provisioned",
    color: "bg-success/10 text-success border-success/30",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  active: {
    label: "Completed",
    color: "bg-success/10 text-success border-success/30",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    color: "bg-destructive/10 text-destructive border-destructive/30",
    icon: <XCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-muted text-muted-foreground border-border",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function getStatusInfo(status: DeviceSetupRequestStatus) {
  return statusConfig[status] ?? {
    label: status.replace(
      /_/g,
      " ",
    ),
    color: "bg-muted text-muted-foreground border-border",
    icon: <Clock className="h-3 w-3" />,
  };
}

export function DeviceRequestsTracker() {
  const {
    data, isLoading, isError, error, refetch, isFetching,
  } = useDeviceSetupRequests();
  const requests = data?.data ?? [];
  const [
    expandedId,
    setExpandedId,
  ] = useState<string | null>(null);
  const [
    detailById,
    setDetailById,
  ] = useState<Record<string, DeviceSetupRequest>>({});
  const [
    loadingDetailId,
    setLoadingDetailId,
  ] = useState<string | null>(null);

  const toggleRequest = async (request: DeviceSetupRequest) => {
    if (expandedId === request.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(request.id);
    if (detailById[request.id])
      return;

    try {
      setLoadingDetailId(request.id);
      const detail = await queryClient.fetchQuery(getDeviceSetupRequestQueryOptions(request.id));
      setDetailById(current => ({
        ...current, [request.id]: detail.data,
      }));
    }
    finally {
      setLoadingDetailId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            My Device Requests
          </CardTitle>
          <CardDescription>Track the status of every device setup request you've submitted, from review through provisioning and assignment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            1,
            2,
            3,
          ].map(i => (
            <Skeleton
              key={i}
              className="h-20 w-full"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            My Device Requests
          </CardTitle>
          <CardDescription className="mt-1">Track the status of every device setup request you've submitted, from review through provisioning and assignment.</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn(
            "mr-2 h-4 w-4",
            isFetching && "animate-spin",
          )}
          />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isError
          ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <Cpu className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {error?.message || "Unable to load device setup requests"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
                  Retry
                </Button>
              </div>
            )
          : requests.length === 0
            ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Cpu className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No device requests yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submit a device request from the Get Started flow or "Request Device" action
                  </p>
                </div>
              )
            : (
                <div className="space-y-3">
                  {requests.map((request) => {
                    const detail = detailById[request.id] ?? request;
                    const statusInfo = getStatusInfo(detail.status);
                    const isExpanded = expandedId === request.id;
                    const isLoadingDetail = loadingDetailId === request.id;
                    const location = [
                      detail.city,
                      detail.state,
                    ].filter(Boolean).join(", ");

                    return (
                      <div
                        key={request.id}
                        className="overflow-hidden rounded-lg border border-border bg-card"
                      >
                        <button
                          onClick={() => void toggleRequest(request)}
                          className="flex w-full items-center justify-between p-3 transition-colors hover:bg-secondary/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                              <Cpu className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium">
                                {request.manufacturer}
                                {request.model ? ` ${request.model}` : ""}
                                {request.trackerType ? ` · ${request.trackerType}` : ""}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatRelative(request.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs capitalize",
                                statusInfo.color,
                              )}
                            >
                              {statusInfo.icon}
                              <span className="ml-1">{statusInfo.label}</span>
                            </Badge>
                            {isLoadingDetail
                              ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )
                              : isExpanded
                                ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  )
                                : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="space-y-3 border-t border-border bg-secondary/10 p-3">
                            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Organisation Name</p>
                                <p className="font-medium">{detail.organisationName || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Requesting Email</p>
                                <p className="break-all font-medium">{detail.requestingEmail || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Quantity</p>
                                <p className="font-medium">{detail.quantity || 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Manufacturer</p>
                                <p className="font-medium">{detail.manufacturer || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Model</p>
                                <p className="font-medium">{detail.model || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Tracker Type</p>
                                <p className="font-medium">{detail.trackerType || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">SIM Required</p>
                                <p className="font-medium">{detail.simRequired ? "Yes" : "No"}</p>
                              </div>
                              {detail.simRequired && (
                                <>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Carrier</p>
                                    <p className="font-medium">{detail.carrierId || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Plan Type</p>
                                    <p className="font-medium">{detail.planType || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Bundle</p>
                                    <p className="font-medium">{detail.bundleId || "—"}</p>
                                  </div>
                                </>
                              )}
                              <div>
                                <p className="text-xs text-muted-foreground">Vehicle</p>
                                <p className="font-medium">{detail.vehicleId || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Installation Location</p>
                                <p className="font-medium">{location || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Preferred Date</p>
                                <p className="font-medium">{detail.preferredDate || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Preferred Time</p>
                                <p className="font-medium">{detail.preferredTime || "—"}</p>
                              </div>
                            </div>

                            {(detail.useCase || detail.notes) && (
                              <div>
                                <p className="mb-1 text-xs text-muted-foreground">Use Case / Notes</p>
                                <p className="rounded bg-secondary/50 p-2 text-sm whitespace-pre-wrap">
                                  {[
                                    detail.useCase,
                                    detail.notes,
                                  ].filter(Boolean).join("\n\n")}
                                </p>
                              </div>
                            )}

                            <div className="border-t border-border pt-3">
                              <p className="mb-2 text-xs text-muted-foreground">Timeline</p>
                              <div className="space-y-2">
                                {(detail.timeline?.length
                                  ? detail.timeline
                                  : [
                                      {
                                        status: "submitted", at: detail.createdAt, note: "Submitted",
                                      },
                                    ]).map((item, index) => (
                                  <div
                                    key={`${item.status}-${item.at}-${index}`}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <span className="text-muted-foreground capitalize">
                                      {item.status.replace(
                                        /_/g,
                                        " ",
                                      )}
                                    </span>
                                    {item.note && <span className="truncate">{item.note}</span>}
                                    <span className="ml-auto">
                                      {formatWithPattern(
                                        item.at,
                                        "MMM d, yyyy h:mm a",
                                      )}
                                    </span>
                                  </div>
                                ))}
                                {detail.updatedAt && detail.updatedAt !== detail.createdAt && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                    <span className="text-muted-foreground">Last update</span>
                                    <span className="ml-auto">
                                      {formatWithPattern(
                                        detail.updatedAt,
                                        "MMM d, yyyy h:mm a",
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
      </CardContent>
    </Card>
  );
}
