import type {
  FilterDraft,
  FilterField,
} from "@/components/shadcn/platform-filter-popover";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  formatDateInTimezone,
  TIMEZONES,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Building2,
  Clock,
  Download,
  Eye,
  Search,
  ShieldAlert,
  User,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Dialog as Sheet,
  DialogContent as SheetContent,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import {
  buildEmptyDraft,
  PlatformFilterPopover,
} from "@/components/shadcn/platform-filter-popover";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { SecurityEvent } from "@/features/security/types";
import { mockSecurityEvents } from "@/features/security/utils/mocks";
import {
  getSecurityEventIcon,
  getSeverityBadge,
} from "@/features/security/utils/securityBadges";

const SECURITY_EVENT_FILTER_FIELDS: FilterField[] = [
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
    ],

  },
  {
    key: "tenant",
    label: "Tenant",
    type: "select",
    options: [
      {
        value: "tenant-1",
        label: "ABC Logistics",
      },
      {
        value: "tenant-2",
        label: "XYZ Transport",
      },
      {
        value: "tenant-3",
        label: "Quick Movers",
      },
      {
        value: "tenant-4",
        label: "Metro Couriers",
      },
      {
        value: "tenant-5",
        label: "Swift Delivery",
      },
    ],

  },
  {
    key: "time",
    label: "Time",
    type: "date",
  },
];

export default function SecurityEventsPage() {
  const [securityEvents] = useState<SecurityEvent[]>(mockSecurityEvents);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [tenantFilter] = useState("all");
  const [severityFilter] = useState("all");
  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState<SecurityEvent | null>(null);
  const [
    isEventSheetOpen,
    setIsEventSheetOpen,
  ] = useState(false);
  const [
    userProfileView,
    setUserProfileView,
  ] = useState<{
    userId: string;
    userName?: string;
    userEmail?: string;
    tenant?: string;
  } | null>(null);
  const { timezone } = usePreferences();
  const [
    securityEventFilters,
    setSecurityEventFilters,
  ] = useState<FilterDraft>(buildEmptyDraft(SECURITY_EVENT_FILTER_FIELDS));

  const filteredSecurityEvents = securityEvents.filter((event) => {
    const matchesSearch
      = event.description.toLowerCase().includes(searchQuery.toLowerCase())
        || event.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
        || event.tenant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = tenantFilter === "all" || event.tenantId === tenantFilter;
    const matchesSeverity = severityFilter === "all" || event.severity === severityFilter;
    return matchesSearch && matchesTenant && matchesSeverity;
  });

  const handleViewEvent = (event: SecurityEvent) => {
    setSelectedEvent(event);
    setIsEventSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Security Events
              </CardTitle>
              <CardDescription>Full event log of authentication, access control and suspicious activity</CardDescription>
            </div>
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
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <PlatformFilterPopover
              entity="security events"
              fields={SECURITY_EVENT_FILTER_FIELDS}
              value={securityEventFilters}
              onApply={setSecurityEventFilters}
              onReset={() => setSecurityEventFilters(buildEmptyDraft(SECURITY_EVENT_FILTER_FIELDS))}
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>
                    Time (
                    {TIMEZONES[timezone].offset}
                    )
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSecurityEvents.map(event => (
                  <TableRow
                    key={event.id}
                    className={event.severity === "critical" ? "bg-destructive/5" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          event.severity === "critical"
                            ? "bg-destructive/10 text-destructive"
                            : event.severity === "high"
                              ? "bg-destructive/10 text-destructive"
                              : event.severity === "medium"
                                ? "bg-warning/10 text-warning"
                                : "bg-muted text-muted-foreground"
                        }`}
                        >
                          {getSecurityEventIcon(event.eventType)}
                        </div>
                        <p className="font-medium text-sm max-w-[300px] truncate">{event.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                    <TableCell>
                      {event.userEmail
                        ? (
                            <div>
                              <p className="font-medium text-sm">{event.userName}</p>
                              <p className="text-xs text-muted-foreground">{event.userEmail}</p>
                            </div>
                          )
                        : (
                            <span className="text-muted-foreground">System</span>
                          )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {event.tenant}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{event.ipAddress}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDateInTimezone(
                          event.timestamp,
                          timezone,
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewEvent(event)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Security Event Details Sheet */}
      <Sheet
        open={isEventSheetOpen}
        onOpenChange={setIsEventSheetOpen}
      >
        <SheetContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                selectedEvent?.severity === "critical"
                  ? "bg-destructive/10 text-destructive"
                  : selectedEvent?.severity === "high"
                    ? "bg-destructive/10 text-destructive"
                    : selectedEvent?.severity === "medium"
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground"
              }`}
              >
                {selectedEvent && getSecurityEventIcon(selectedEvent.eventType)}
              </div>
              Security Event
            </SheetTitle>
            <SheetDescription className="flex items-center gap-2">
              {selectedEvent && getSeverityBadge(selectedEvent.severity)}
              <span>
                {selectedEvent?.eventType.replace(
                  "_",
                  " ",
                ).toUpperCase()}
              </span>
            </SheetDescription>
          </SheetHeader>

          {selectedEvent && (
            <ScrollArea className="h-[calc(100vh-180px)] mt-6">
              <div className="space-y-6 pr-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Event Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Event Type</span>
                      <span className="capitalize">
                        {selectedEvent.eventType.replace(
                          "_",
                          " ",
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Severity</span>
                      {getSeverityBadge(selectedEvent.severity)}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Timestamp</span>
                      <span>
                        {formatDateInTimezone(
                          selectedEvent.timestamp,
                          timezone,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IP Address</span>
                      <code className="bg-muted px-2 py-1 rounded">{selectedEvent.ipAddress}</code>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">User Information</h4>
                  {selectedEvent.userEmail
                    ? (
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {getInitials(selectedEvent.userName)}
                          </div>
                          <div>
                            <p className="font-medium">{selectedEvent.userName}</p>
                            <p className="text-sm text-muted-foreground">{selectedEvent.userEmail}</p>
                          </div>
                        </div>
                      )
                    : (
                        <p className="text-sm text-muted-foreground">System-generated event</p>
                      )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Tenant</h4>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {getInitials(selectedEvent.tenant)}
                    </div>
                    <p className="font-medium">{selectedEvent.tenant}</p>
                  </div>
                </div>

                {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Additional Details</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedEvent.metadata).map(([
                          key,
                          value,
                        ]) => (
                          <div
                            key={key}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground capitalize">
                              {key.replace(
                                "_",
                                " ",
                              )}
                            </span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Event
                  </Button>
                  {selectedEvent.userId && (
                    <Button
                      variant="outline"
                      onClick={() => setUserProfileView({
                        userId: selectedEvent.userId!,
                        userName: selectedEvent.userName,
                        userEmail: selectedEvent.userEmail,
                        tenant: (selectedEvent as any).tenant,
                      })}
                    >
                      <User className="h-4 w-4 mr-2" />
                      View User
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* User Profile Dialog */}
      <Dialog
        open={!!userProfileView}
        onOpenChange={o => !o && setUserProfileView(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div>{userProfileView?.userName || "User"}</div>
                <div className="text-xs font-normal text-muted-foreground">{userProfileView?.userEmail}</div>
              </div>
            </DialogTitle>
            <DialogDescription>Account profile and recent security activity</DialogDescription>
          </DialogHeader>
          {userProfileView && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">User ID</div>
                  <div className="font-mono text-xs mt-1">{userProfileView.userId}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Tenant</div>
                  <div className="mt-1">{userProfileView.tenant || "—"}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge className="mt-1 bg-success/10 text-success border-success/30">Active</Badge>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">MFA</div>
                  <Badge
                    variant="outline"
                    className="mt-1"
                  >
                    Enabled
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setUserProfileView(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
