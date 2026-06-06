import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import { 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Wifi,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

interface SIMRequest {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  request_type: string;
  requested_plan: string | null;
  requested_data_limit_mb: number | null;
  number_of_sims: number | null;
  use_case: string | null;
  preferred_operator: string | null;
  deployment_timeline: string | null;
  device_mapping_enabled: boolean | null;
  device_mapping_data: unknown;
  notes: string | null;
  priority: string | null;
  status: string;
  requested_by_name: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface SIMRequestsTrackerProps {
  // Reserved for future use; section is read-only and has no actions.
  onNewRequest?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: "Pending Review", 
    color: "bg-warning/10 text-warning border-warning/30",
    icon: <Clock className="h-3 w-3" />
  },
  approved: { 
    label: "Approved", 
    color: "bg-success/10 text-success border-success/30",
    icon: <CheckCircle className="h-3 w-3" />
  },
  rejected: { 
    label: "Rejected", 
    color: "bg-destructive/10 text-destructive border-destructive/30",
    icon: <XCircle className="h-3 w-3" />
  },
  completed: { 
    label: "Completed", 
    color: "bg-success/10 text-success border-success/30",
    icon: <CheckCircle className="h-3 w-3" />
  },
};
const nowIso = () => new Date().toISOString();
const hoursAgoIso = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const DEMO_SIM_REQUESTS = [
  {
    id: "demo-simreq-1",
    tenant_id: "demo",
    tenant_name: "Lagos Express Logistics",
    request_type: "new_activation",
    requested_plan: "iot_basic",
    requested_data_limit_mb: 1024,
    number_of_sims: 5,
    use_case: "Vehicle tracking expansion - 5 new trucks",
    preferred_operator: "MTN Nigeria",
    deployment_timeline: "within_1_week",
    device_mapping_enabled: true,
    device_mapping_data: null,
    notes: "Includes IMEI mapping for auto-link.",
    priority: "high",
    status: "pending",
    requested_by_name: "Adebayo Olamide",
    approved_by_name: null,
    approved_at: null,
    rejected_reason: null,
    created_at: hoursAgoIso(4),
    updated_at: hoursAgoIso(4),
  },
  {
    id: "demo-simreq-2",
    tenant_id: "demo",
    tenant_name: "Lagos Express Logistics",
    request_type: "replacement",
    requested_plan: "iot_pro",
    requested_data_limit_mb: 2048,
    number_of_sims: 1,
    use_case: "Replacement for faulty SIM on LAG-911-FZ",
    preferred_operator: "Airtel Nigeria",
    deployment_timeline: "urgent",
    device_mapping_enabled: false,
    device_mapping_data: null,
    notes: null,
    priority: "urgent",
    status: "approved",
    requested_by_name: "Chinwe Okafor",
    approved_by_name: "Platform Admin",
    approved_at: hoursAgoIso(20),
    rejected_reason: null,
    created_at: hoursAgoIso(28),
    updated_at: hoursAgoIso(20),
  },
  {
    id: "demo-simreq-3",
    tenant_id: "demo",
    tenant_name: "Lagos Express Logistics",
    request_type: "bulk_activation",
    requested_plan: "iot_basic",
    requested_data_limit_mb: 512,
    number_of_sims: 25,
    use_case: "Bulk onboarding for new fleet acquisition",
    preferred_operator: "MTN Nigeria",
    deployment_timeline: "within_1_month",
    device_mapping_enabled: true,
    device_mapping_data: null,
    notes: "Awaiting KYC verification on supplier docs",
    priority: "medium",
    status: "completed",
    requested_by_name: "Tunde Bakare",
    approved_by_name: "Platform Admin",
    approved_at: hoursAgoIso(60),
    rejected_reason: null,
    created_at: hoursAgoIso(72),
    updated_at: hoursAgoIso(48),
  },
  {
    id: "demo-simreq-4",
    tenant_id: "demo",
    tenant_name: "Lagos Express Logistics",
    request_type: "new_activation",
    requested_plan: "iot_pro",
    requested_data_limit_mb: 5120,
    number_of_sims: 2,
    use_case: "Cold-chain monitoring for refrigerated units",
    preferred_operator: "9mobile",
    deployment_timeline: "within_2_weeks",
    device_mapping_enabled: false,
    device_mapping_data: null,
    notes: null,
    priority: "low",
    status: "rejected",
    requested_by_name: "Funmilayo Adeyemi",
    approved_by_name: null,
    approved_at: null,
    rejected_reason: "Pending KYC re-verification",
    created_at: hoursAgoIso(96),
    updated_at: hoursAgoIso(80),
  },
];


export function SIMRequestsTracker({ onNewRequest }: SIMRequestsTrackerProps) {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<SIMRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setRequests(DEMO_SIM_REQUESTS as unknown as SIMRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetchRequests();
  }, []);

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

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
              const deviceMappingData = request.device_mapping_data;
              const deviceMappingCount = Array.isArray(deviceMappingData) 
                ? deviceMappingData.length 
                : 0;

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
                          {request.number_of_sims || 1} SIM{(request.number_of_sims || 1) > 1 ? "s" : ""} Request
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

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border bg-secondary/10 p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Organisation Name</p>
                          <p className="font-medium">{request.tenant_name || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Requesting Email</p>
                          <p className="font-medium break-all">{user?.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Carrier</p>
                          <p className="font-medium uppercase">{request.preferred_operator || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Plan Type</p>
                          <p className="font-medium capitalize">
                            {(request as any).plan_cycle || (request.requested_plan?.toLowerCase().includes("year") ? "Yearly" : "Monthly")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Data Bundle Plan</p>
                          <p className="font-medium">
                            {request.requested_data_limit_mb
                              ? `${(request.requested_data_limit_mb / 1024).toFixed(1)} GB`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="font-medium">{request.number_of_sims ?? 1}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Use Case</p>
                          <p className="font-medium">{request.use_case || "—"}</p>
                        </div>
                      </div>

                      {request.device_mapping_enabled && deviceMappingCount > 0 && (
                        <div className="flex items-center gap-2 rounded-md bg-primary/5 p-2 text-xs">
                          <HardDrive className="h-4 w-4 text-primary" />
                          <span>
                            {deviceMappingCount} devices pre-mapped
                            {request.status === 'approved' || request.status === 'completed'
                              ? ' — SIMs will auto-assign to devices on activation'
                              : ' for auto-assignment after activation'}
                          </span>
                        </div>
                      )}

                      {request.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm bg-secondary/50 rounded p-2">{request.notes}</p>
                        </div>
                      )}

                      {request.status === "rejected" && request.rejected_reason && (
                        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2">
                          <p className="text-xs font-medium text-destructive">Rejection Reason</p>
                          <p className="text-sm mt-1">{request.rejected_reason}</p>
                        </div>
                      )}

                      {/* Timeline */}
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
                          {request.approved_at && (
                            <div className="flex items-center gap-2 text-xs">
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                request.status === "rejected" ? "bg-destructive" : "bg-success"
                              )} />
                              <span className="text-muted-foreground">
                                {request.status === "rejected" ? "Rejected" : "Approved"}
                                {request.approved_by_name && ` by ${request.approved_by_name}`}
                              </span>
                              <span className="ml-auto">
                                {format(new Date(request.approved_at), "MMM d, yyyy h:mm a")}
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



