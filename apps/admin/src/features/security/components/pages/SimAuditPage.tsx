import type {
  FilterDraft,
  FilterField,
} from "@/components/shadcn/platform-filter-popover";
import {
  formatDateInTimezone,
  TIMEZONES,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Building2,
  Clock,
  Download,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  buildEmptyDraft,
  PlatformFilterPopover,
} from "@/components/shadcn/platform-filter-popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  getSecurityEventIcon,
  getSeverityBadge,
} from "@/features/security/utils/securityBadges";

type SecurityAuditLog = {
  id: string;
  event_type: string;
  severity: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  tenant_id: string | null;
  tenant_name?: string | null;
  description: string;
  ip_address: string | null;
  metadata?: Record<string, any>;
  created_at: string;
};

const AUDIT_FILTER_FIELDS: FilterField[] = [
  {
    key: "payment",
    label: "Payment",
    type: "select",
    options: [
      {
        value: "card",
        label: "Card",
      },
      {
        value: "wallet",
        label: "Wallet",
      },
      {
        value: "bank",
        label: "Bank Transfer",
      },
    ],

  },
  {
    key: "event",
    label: "Event",
    type: "select",
    options: [
      {
        value: "sim_activated",
        label: "SIM Activated",
      },
      {
        value: "sim_request_approved",
        label: "SIM Request Approved",
      },
      {
        value: "sim_request_rejected",
        label: "SIM Request Rejected",
      },
      {
        value: "kyb_requested",
        label: "KYB Requested",
      },
    ],

  },
  {
    key: "severity",
    label: "Severity",
    type: "select",
    options: [
      {
        value: "critical",
        label: "Critical",
      },
      {
        value: "high",
        label: "High",
      },
      {
        value: "medium",
        label: "Medium",
      },
      {
        value: "low",
        label: "Low",
      },
      {
        value: "info",
        label: "Info",
      },
    ],

  },
  {
    key: "time",
    label: "Time",
    type: "date",
  },
];

const DEMO_AUDIT_LOGS: SecurityAuditLog[] = [
  {
    id: "dal-1",
    event_type: "sim_request_approved",
    severity: "info",
    user_id: null,
    user_email: "platform@truckmoov.com",
    user_name: "Platform Admin",
    tenant_id: "demo-t1",
    tenant_name: "Lagos Express Logistics",
    description: "Approved SIM activation request for 25 SIMs",
    ip_address: "102.89.34.12",
    metadata: {
      quantity: 25,
      request_id: "SIM-REQ-2025-0142",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "dal-2",
    event_type: "sim_activated",
    severity: "info",
    user_id: null,
    user_email: "system@truckmoov.com",
    user_name: "System Auto",
    tenant_id: "demo-t1",
    tenant_name: "Lagos Express Logistics",
    description: "Auto-activated 25 SIMs via Fonu API",
    ip_address: null,
    metadata: {
      quantity: 25,
      batch_id: "BATCH-2025-0142",
      provider: "Fonu",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
  },
  {
    id: "dal-3",
    event_type: "sim_request_rejected",
    severity: "warning",
    user_id: null,
    user_email: "platform@truckmoov.com",
    user_name: "Platform Admin",
    tenant_id: "demo-t4",
    tenant_name: "Cape Town Trucking",
    description: "Rejected SIM request — KYC documents incomplete",
    ip_address: "102.89.34.12",
    metadata: {
      quantity: 10,
      reason: "missing_business_reg",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "dal-4",
    event_type: "sim_activated",
    severity: "info",
    user_id: null,
    user_email: "system@truckmoov.com",
    user_name: "System Auto",
    tenant_id: "demo-t2",
    tenant_name: "Accra Swift Cargo",
    description: "Auto-activated 12 SIMs via Fonu API",
    ip_address: null,
    metadata: {
      quantity: 12,
      batch_id: "BATCH-2025-0141",
      provider: "Fonu",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "dal-5",
    event_type: "sim_request_approved",
    severity: "info",
    user_id: null,
    user_email: "platform@truckmoov.com",
    user_name: "Platform Admin",
    tenant_id: "demo-t3",
    tenant_name: "Nairobi Fleet Group",
    description: "Approved SIM activation request for 50 SIMs",
    ip_address: "102.89.34.12",
    metadata: {
      quantity: 50,
      request_id: "SIM-REQ-2025-0140",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "dal-6",
    event_type: "sim_activated",
    severity: "info",
    user_id: null,
    user_email: "system@truckmoov.com",
    user_name: "System Auto",
    tenant_id: "demo-t3",
    tenant_name: "Nairobi Fleet Group",
    description: "Auto-activated 50 SIMs via Fonu API",
    ip_address: null,
    metadata: {
      quantity: 50,
      batch_id: "BATCH-2025-0140",
      provider: "Fonu",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5 + 1000 * 60).toISOString(),
  },
  {
    id: "dal-7",
    event_type: "sim_request_approved",
    severity: "info",
    user_id: null,
    user_email: "platform@truckmoov.com",
    user_name: "Platform Admin",
    tenant_id: "demo-t5",
    tenant_name: "Johannesburg Freight",
    description: "Approved SIM activation request for 8 SIMs",
    ip_address: "102.89.34.12",
    metadata: {
      quantity: 8,
      request_id: "SIM-REQ-2025-0139",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "dal-8",
    event_type: "sim_activated",
    severity: "info",
    user_id: null,
    user_email: "system@truckmoov.com",
    user_name: "System Auto",
    tenant_id: "demo-t5",
    tenant_name: "Johannesburg Freight",
    description: "Auto-activated 8 SIMs via Fonu API",
    ip_address: null,
    metadata: {
      quantity: 8,
      batch_id: "BATCH-2025-0139",
      provider: "Fonu",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18 + 1000 * 60).toISOString(),
  },
  {
    id: "dal-9",
    event_type: "sim_activation_failed",
    severity: "high",
    user_id: null,
    user_email: "system@truckmoov.com",
    user_name: "System Auto",
    tenant_id: "demo-t6",
    tenant_name: "Abuja Haulage Co.",
    description: "Fonu activation failed for 1 SIM — invalid ICCID",
    ip_address: null,
    metadata: {
      quantity: 1,
      error: "INVALID_ICCID",
      iccid: "8923400001234567890",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "dal-10",
    event_type: "sim_request_approved",
    severity: "info",
    user_id: null,
    user_email: "platform@truckmoov.com",
    user_name: "Platform Admin",
    tenant_id: "demo-t6",
    tenant_name: "Abuja Haulage Co.",
    description: "Approved SIM activation request for 15 SIMs",
    ip_address: "102.89.34.12",
    metadata: {
      quantity: 15,
      request_id: "SIM-REQ-2025-0137",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
] as any;

export default function SimAuditPage() {
  const { timezone } = usePreferences();
  const [
    auditSearchQuery,
    setAuditSearchQuery,
  ] = useState("");
  const [
    auditFilters,
    setAuditFilters,
  ] = useState<FilterDraft>(buildEmptyDraft(AUDIT_FILTER_FIELDS));

  const rawAuditLogs: SecurityAuditLog[] = [];
  const isLoadingLogs = false;
  const auditLogs = rawAuditLogs.length > 0 ? rawAuditLogs : DEMO_AUDIT_LOGS;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              SIM Activation Audit Trail
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
          <CardDescription>
            Complete audit trail for SIM requests, approvals, and activations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search audit events..."
                className="pl-10"
                value={auditSearchQuery}
                onChange={e => setAuditSearchQuery(e.target.value)}
              />
            </div>
            <PlatformFilterPopover
              entity="audit logs"
              fields={AUDIT_FILTER_FIELDS}
              value={auditFilters}
              onApply={setAuditFilters}
              onReset={() => setAuditFilters(buildEmptyDraft(AUDIT_FILTER_FIELDS))}
            />
          </div>
          {isLoadingLogs
            ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )
            : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>
                          Time (
                          {TIMEZONES[timezone].offset}
                          )
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs
                        .filter(log =>
                          log.event_type.includes("sim_")
                          || log.event_type === "kyb_requested")
                        .map(log => (
                          <TableRow
                            key={log.id}
                            className={log.severity === "high" ? "bg-warning/5" : ""}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                  log.event_type === "sim_activated"
                                    ? "bg-success/10 text-success"
                                    : log.event_type === "sim_request_approved"
                                      ? "bg-primary/10 text-primary"
                                      : log.event_type === "sim_request_rejected"
                                        ? "bg-destructive/10 text-destructive"
                                        : log.event_type === "sim_activation_triggered"
                                          ? "bg-warning/10 text-warning"
                                          : log.event_type === "kyb_requested"
                                            ? "bg-secondary text-secondary-foreground"
                                            : "bg-muted text-muted-foreground"
                                }`}
                                >
                                  {getSecurityEventIcon(log.event_type)}
                                </div>
                                <div>
                                  <p className="font-medium text-sm capitalize">
                                    {log.event_type.replace(
                                      /_/g,
                                      " ",
                                    )}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getSeverityBadge(log.severity as any)}</TableCell>
                            <TableCell>
                              {log.user_name
                                ? (
                                    <div>
                                      <p className="font-medium text-sm">{log.user_name}</p>
                                      {log.user_email && <p className="text-xs text-muted-foreground">{log.user_email}</p>}
                                    </div>
                                  )
                                : (
                                    <span className="text-muted-foreground">System</span>
                                  )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {log.tenant_name || log.tenant_id?.slice(
                                    0,
                                    8,
                                  ) || "-"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm max-w-[300px] truncate text-muted-foreground">
                                {log.description}
                              </p>
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {log.metadata.quantity && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {String(log.metadata.quantity)}
                                      {" "}
                                      SIM(s)
                                    </Badge>
                                  )}
                                  {log.metadata.operator && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {String(log.metadata.operator)}
                                    </Badge>
                                  )}
                                  {log.metadata.activated !== undefined && (
                                    <Badge className="bg-success/10 text-success text-xs">
                                      {String(log.metadata.activated)}
                                      {" "}
                                      activated
                                    </Badge>
                                  )}
                                  {log.metadata.failed !== undefined && Number(log.metadata.failed) > 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      {String(log.metadata.failed)}
                                      {" "}
                                      failed
                                    </Badge>
                                  )}
                                  {log.metadata.override_applied && (
                                    <Badge className="bg-warning/10 text-warning text-xs">
                                      Override
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {formatDateInTimezone(
                                  log.created_at,
                                  timezone,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      {!auditLogs.some(log =>
                        log.event_type.includes("sim_")
                        || log.event_type === "kyb_requested") && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-12 text-muted-foreground"
                          >
                            <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>No SIM audit events found</p>
                            <p className="text-sm">Events will appear here when SIM requests are processed</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
