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
  Ban,
  Building2,
  CheckCircle,
  Clock,
  Download,
  Eye,
  LogIn,
  LogOut,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Search,
  User,
  XCircle,
  Monitor,
  Smartphone,
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
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { LoginEvent } from "@/features/security/types";
import { mockLoginEvents } from "@/features/security/utils/mocks";

const LOGIN_FILTER_FIELDS: FilterField[] = [
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
    key: "event",
    label: "Event",
    type: "select",
    options: [
      {
        value: "login",
        label: "Login",
      },
      {
        value: "logout",
        label: "Logout",
      },
      {
        value: "session_refresh",
        label: "Session Refresh",
      },
    ],

  },
  {
    key: "location",
    label: "Location",
    type: "select",
    options: [
      {
        value: "lagos",
        label: "Lagos",
      },
      {
        value: "abuja",
        label: "Abuja",
      },
      {
        value: "port-harcourt",
        label: "Port Harcourt",
      },
    ],

  },
  {
    key: "device",
    label: "Device",
    type: "select",
    options: [
      {
        value: "Desktop",
        label: "Desktop",
      },
      {
        value: "Mobile",
        label: "Mobile",
      },
      {
        value: "Tablet",
        label: "Tablet",
      },
    ],

  },
  {
    key: "time",
    label: "Time",
    type: "date",
  },
];

function getEventTypeBadge(type: LoginEvent["eventType"]) {
  switch (type) {
    case "login":
      return (
        <Badge className="bg-success/10 text-success border-success/30">
          <LogIn className="h-3 w-3 mr-1" />
          Login
        </Badge>
      );
    case "logout":
      return (
        <Badge className="bg-muted text-muted-foreground">
          <LogOut className="h-3 w-3 mr-1" />
          Logout
        </Badge>
      );
    case "session_refresh":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30">
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Badge>
      );
  }
}

function getStatusBadge(status: "success" | "failed") {
  return status === "success"
    ? (
        <Badge className="bg-success/10 text-success border-success/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Success
        </Badge>
      )
    : (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
}

function getDeviceIcon(device: string) {
  return device === "Mobile"
    ? (
        <Smartphone className="h-4 w-4 text-muted-foreground" />
      )
    : (
        <Monitor className="h-4 w-4 text-muted-foreground" />
      );
}

export default function LoginHistoryPage() {
  const [loginEvents] = useState<LoginEvent[]>(mockLoginEvents);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [tenantFilter] = useState("all");
  const [
    selectedLoginEvent,
    setSelectedLoginEvent,
  ] = useState<LoginEvent | null>(null);
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
    loginStatusFilter,
    setLoginStatusFilter,
  ] = useState("all");
  const [
    loginFilters,
    setLoginFilters,
  ] = useState<FilterDraft>(buildEmptyDraft(LOGIN_FILTER_FIELDS));

  const filteredLoginEvents = loginEvents.filter((event) => {
    const matchesSearch
      = event.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
        || event.userName.toLowerCase().includes(searchQuery.toLowerCase())
        || event.tenant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = tenantFilter === "all" || event.tenantId === tenantFilter;
    return matchesSearch && matchesTenant;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" />
                Login History
              </CardTitle>
              <CardDescription>Successful and failed login attempts across all tenants and users</CardDescription>
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
                placeholder="Search by user, email, or tenant..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={loginStatusFilter}
              onValueChange={setLoginStatusFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <PlatformFilterPopover
              entity="login events"
              fields={LOGIN_FILTER_FIELDS}
              value={loginFilters}
              onApply={setLoginFilters}
              onReset={() => setLoginFilters(buildEmptyDraft(LOGIN_FILTER_FIELDS))}
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>
                    Time (
                    {TIMEZONES[timezone].offset}
                    )
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoginEvents.map(event => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {getInitials(event.userName)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{event.userName}</p>
                          <p className="text-xs text-muted-foreground">{event.userEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {event.tenant}
                      </div>
                    </TableCell>
                    <TableCell>{getEventTypeBadge(event.eventType)}</TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {event.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        {getDeviceIcon(event.device)}
                        <span>{event.browser}</span>
                      </div>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedLoginEvent(event)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setUserProfileView({
                            userId: event.userId,
                            userName: event.userName,
                            userEmail: event.userEmail,
                            tenant: (event as any).tenant,
                          })}
                          >
                            <User className="h-4 w-4 mr-2" />
                            View User Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Ban className="h-4 w-4 mr-2" />
                            Block IP
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Login Event Details Dialog */}
      <Dialog
        open={!!selectedLoginEvent}
        onOpenChange={open => !open && setSelectedLoginEvent(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Login Event Details
            </DialogTitle>
            <DialogDescription>
              Full context for this authentication event.
            </DialogDescription>
          </DialogHeader>
          {selectedLoginEvent && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {getInitials(selectedLoginEvent.userName)}
                </div>
                <div>
                  <p className="font-medium">{selectedLoginEvent.userName}</p>
                  <p className="text-xs text-muted-foreground">{selectedLoginEvent.userEmail}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Event</p>
                  <p className="font-medium capitalize">
                    {selectedLoginEvent.eventType.replace(
                      "_",
                      " ",
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(selectedLoginEvent.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tenant</p>
                  <p className="font-medium">{selectedLoginEvent.tenant}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{selectedLoginEvent.ipAddress}</code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedLoginEvent.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Device</p>
                  <p className="font-medium">{selectedLoginEvent.device}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Browser</p>
                  <p className="font-medium">{selectedLoginEvent.browser}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {formatDateInTimezone(
                      selectedLoginEvent.timestamp,
                      timezone,
                    )}
                  </p>
                </div>
                {selectedLoginEvent.sessionDuration && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Session Duration</p>
                    <p className="font-medium">{selectedLoginEvent.sessionDuration}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground mb-2">Recent Login Events</div>
                <div className="space-y-2">
                  {loginEvents.filter(e => e.userId === userProfileView.userId).slice(
                    0,
                    3,
                  ).map(e => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {formatDateInTimezone(
                          e.timestamp,
                          timezone,
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                      <span>{e.ipAddress}</span>
                      <Badge
                        variant={e.status === "success" ? "outline" : "destructive"}
                        className="text-xs"
                      >
                        {e.status}
                      </Badge>
                    </div>
                  ))}
                  {!loginEvents.some(e => e.userId === userProfileView.userId) && (
                    <p className="text-xs text-muted-foreground">No recent login events.</p>
                  )}
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
