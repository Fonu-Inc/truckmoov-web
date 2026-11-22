import { useQuery } from "@tanstack/react-query";
import { getSimRequestsQueryOptions } from "@truckmoov/api/auth";
import {
  formatRelative, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Wifi,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { cn } from "@/lib/utils";

type SIMRequestsTrackerProps = {
  // Reserved for future use; section is read-only and has no actions.
  onNewRequest?: () => void;
};

const PAGE_SIZES = [
  10,
  25,
  50,
  100,
];

const statusConfig: Record<string, {
  label: string; color: string; icon: React.ReactNode;
}> = {
  pending_review: {
    label: "Pending Review",
    color: "bg-warning/10 text-warning border-warning/30",
    icon: <Clock className="h-3 w-3" />,
  },
  pending: {
    label: "Pending Review",
    color: "bg-warning/10 text-warning border-warning/30",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "Approved",
    color: "bg-success/10 text-success border-success/30",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    color: "bg-destructive/10 text-destructive border-destructive/30",
    icon: <XCircle className="h-3 w-3" />,
  },
  completed: {
    label: "Completed",
    color: "bg-success/10 text-success border-success/30",
    icon: <CheckCircle className="h-3 w-3" />,
  },
};

export function SIMRequestsTracker(_props: SIMRequestsTrackerProps) {
  const { user } = useAuthStore();
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    pageSize,
    setPageSize,
  ] = useState(PAGE_SIZES[1]);
  const requestsQuery = useQuery(getSimRequestsQueryOptions({
    params: {
      page, limit: pageSize,
    },
  }));
  const requests = requestsQuery.data?.data.items ?? [];
  const total = requestsQuery.data?.data.total ?? 0;
  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize),
  );
  const loading = requestsQuery.isLoading;
  const [
    expandedId,
    setExpandedId,
  ] = useState<string | null>(null);

  const getStatusInfo = (status: string) => statusConfig[status] || statusConfig.pending_review;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            My SIM Requests
          </CardTitle>
          <CardDescription>Track every IoT SIM request you've submitted — from approval and activation through to device assignment.</CardDescription>
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          My SIM Requests
        </CardTitle>
        <CardDescription>Track every IoT SIM request you've submitted — from approval and activation through to device assignment.</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wifi className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No SIM requests yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Submit a SIM request from the Get Started flow or "Request SIM" action
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const statusInfo = getStatusInfo(request.status);
              const isExpanded = expandedId === request.id;

              return (
                <div
                  key={request.id}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : request.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Wifi className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {request.quantity}
                          {" "}
                          SIM
                          {request.quantity > 1 ? "s" : ""}
                          {" "}
                          Request
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelative(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          statusInfo.color,
                        )}
                      >
                        {statusInfo.icon}
                        <span className="ml-1">{statusInfo.label}</span>
                      </Badge>
                      {isExpanded
                        ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          )
                        : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border bg-secondary/10 p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Organisation Name</p>
                          <p className="font-medium">{request.organizationName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Requesting Email</p>
                          <p className="font-medium break-all">{request.requestingEmail || user?.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Carrier</p>
                          <p className="font-medium uppercase">{request.carrier || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Plan Type</p>
                          <p className="font-medium capitalize">{request.planType || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Data Bundle Plan</p>
                          <p className="font-medium">
                            {request.dataBundlePlan
                              ? `${request.dataBundlePlan.dataLimitGb.toFixed(1)} GB`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="font-medium">{request.quantity}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Use Case</p>
                          <p className="font-medium">{request.useCase || "—"}</p>
                        </div>
                      </div>

                      {request.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm bg-secondary/50 rounded p-2">{request.notes}</p>
                        </div>
                      )}

                      {/* Timeline */}
                      {request.timeline?.length > 0 && (
                        <div className="border-t border-border pt-3">
                          <p className="text-xs text-muted-foreground mb-2">Timeline</p>
                          <div className="space-y-2">
                            {request.timeline.map((entry, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs"
                              >
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <span className="text-muted-foreground">
                                  {entry.label}
                                  {entry.by && ` by ${entry.by}`}
                                </span>
                                <span className="ml-auto">
                                  {formatWithPattern(
                                    entry.at,
                                    "MMM d, yyyy h:mm a",
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground">
                {`Page ${page} of ${totalPages} · ${total} request${total === 1 ? "" : "s"}`}
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map(size => (
                      <SelectItem
                        key={size}
                        value={String(size)}
                      >
                        {`${size} per page`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
