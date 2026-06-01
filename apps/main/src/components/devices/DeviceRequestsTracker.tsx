import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { useDeviceSetupRequests, type DeviceSetupRequestStatus } from "@/hooks/useDeviceSetupRequests";
import { useAuthStore } from "@/stores/authStore";

const statusConfig: Record<DeviceSetupRequestStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending_review: {
    label: "Pending Review",
    color: "bg-warning/10 text-warning border-warning/30",
    icon: <Clock className="h-3 w-3" />,
  },
  assigned: {
    label: "In Progress",
    color: "bg-primary/10 text-primary border-primary/30",
    icon: <Loader2 className="h-3 w-3" />,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-primary/10 text-primary border-primary/30",
    icon: <Loader2 className="h-3 w-3" />,
  },
  awaiting_heartbeat: {
    label: "In Progress",
    color: "bg-primary/10 text-primary border-primary/30",
    icon: <Loader2 className="h-3 w-3" />,
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

const hoursAgoIso = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const DEMO_DEVICE_REQUESTS = [
  {
    id: "demo-devreq-1",
    manufacturer: "Teltonika",
    model: "FMB920",
    tracker_type: "OBD",
    needs_sim: true,
    sim_carrier: "MTN",
    sim_plan_cycle: "monthly",
    sim_bundle_label: "MTN IoT 2GB Monthly",
    installation_state: "Lagos",
    installation_city: "Ikeja",
    preferred_date: null,
    preferred_time: null,
    requester_notes: "Vehicle tracking for fleet expansion",
    status: "active" as const,
    rejection_reason: null,
    assigned_at: hoursAgoIso(40),
    assigned_to_name: "Platform Admin",
    created_at: hoursAgoIso(72),
    updated_at: hoursAgoIso(20),
  },
  {
    id: "demo-devreq-2",
    manufacturer: "Queclink",
    model: "GV310LAU",
    tracker_type: "Hardwired",
    needs_sim: false,
    installation_state: "Lagos",
    installation_city: "Lekki",
    preferred_date: null,
    preferred_time: null,
    requester_notes: "Cold-chain refrigerated truck",
    status: "pending_review" as const,
    rejection_reason: null,
    assigned_at: null,
    assigned_to_name: null,
    created_at: hoursAgoIso(6),
    updated_at: hoursAgoIso(6),
  },
];

export function DeviceRequestsTracker() {
  const { requests: liveRequests, loading } = useDeviceSetupRequests();
  const { user } = useAuthStore();
  const requests = liveRequests.length > 0 ? liveRequests : (DEMO_DEVICE_REQUESTS as any);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
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
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
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
          My Device Requests
        </CardTitle>
        <CardDescription>Track the status of every device setup request you've submitted, from review through provisioning and assignment.</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Cpu className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No device requests yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Submit a device request from the Get Started flow or "Request Device" action
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const statusInfo = statusConfig[request.status] || statusConfig.pending_review;
              const isExpanded = expandedId === request.id;

              return (
                <div
                  key={request.id}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : request.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Cpu className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {request.manufacturer}
                          {request.model ? ` ${request.model}` : ""}
                          {request.tracker_type ? ` · ${request.tracker_type}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs", statusInfo.color)}>
                        {statusInfo.icon}
                        <span className="ml-1">{statusInfo.label}</span>
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border bg-secondary/10 p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Organisation Name</p>
                          <p className="font-medium">{user?.name || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Requesting Email</p>
                          <p className="font-medium break-all">{user?.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Manufacturer</p>
                          <p className="font-medium">{request.manufacturer}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Model</p>
                          <p className="font-medium">{request.model || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tracker Type</p>
                          <p className="font-medium">{request.tracker_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="font-medium">1</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">SIM Required</p>
                          <p className="font-medium">{request.needs_sim ? "Yes" : "No"}</p>
                        </div>
                        {request.needs_sim && (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground">SIM Carrier</p>
                              <p className="font-medium uppercase">{(request as any).sim_carrier || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Plan Type</p>
                              <p className="font-medium capitalize">{(request as any).sim_plan_cycle || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Data Bundle Plan</p>
                              <p className="font-medium">{(request as any).sim_bundle_label || "—"}</p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Installation Location</p>
                          <p className="font-medium">
                            {[request.installation_city, request.installation_state]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Preferred Date</p>
                          <p className="font-medium">{request.preferred_date || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Preferred Time</p>
                          <p className="font-medium">{request.preferred_time || "—"}</p>
                        </div>
                      </div>

                      {request.requester_notes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Use Case / Notes</p>
                          <p className="text-sm bg-secondary/50 rounded p-2">{request.requester_notes}</p>
                        </div>
                      )}

                      {request.status === "rejected" && request.rejection_reason && (
                        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2">
                          <p className="text-xs font-medium text-destructive">Rejection Reason</p>
                          <p className="text-sm mt-1">{request.rejection_reason}</p>
                        </div>
                      )}

                      <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground mb-2">Timeline</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-muted-foreground">Submitted</span>
                            <span className="ml-auto">
                              {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}
                            </span>
                          </div>
                          {request.assigned_at && (
                            <div className="flex items-center gap-2 text-xs">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <span className="text-muted-foreground">
                                Assigned{request.assigned_to_name && ` to ${request.assigned_to_name}`}
                              </span>
                              <span className="ml-auto">
                                {format(new Date(request.assigned_at), "MMM d, yyyy h:mm a")}
                              </span>
                            </div>
                          )}
                          {request.updated_at && request.updated_at !== request.created_at && (
                            <div className="flex items-center gap-2 text-xs">
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  request.status === "rejected"
                                    ? "bg-destructive"
                                    : request.status === "active"
                                    ? "bg-success"
                                    : "bg-muted-foreground"
                                )}
                              />
                              <span className="text-muted-foreground">Last update</span>
                              <span className="ml-auto">
                                {format(new Date(request.updated_at), "MMM d, yyyy h:mm a")}
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
