import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";
import type {
  LoginEvent, SecurityEvent,
} from "@/features/security/types";
import { useQuery } from "@tanstack/react-query";
import { getSystemSecurityOverviewQueryOptions } from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import { formatDateInTimezone } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity,
  Ban,
  Building2,
  Clock,
  Download,
  LogIn,
  ShieldAlert,
  User,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ChartDateFilter } from "@/components/shadcn/chart-date-filter";
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
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  mockLoginEvents,
  mockSecurityEvents,
} from "@/features/security/utils/mocks";
import {
  getSecurityEventIcon,
  getSeverityBadge,
} from "@/features/security/utils/securityBadges";

const loginTrendData = [
  {
    hour: "00:00",
    logins: 12,
    failed: 2,
  },
  {
    hour: "02:00",
    logins: 5,
    failed: 1,
  },
  {
    hour: "04:00",
    logins: 3,
    failed: 0,
  },
  {
    hour: "06:00",
    logins: 18,
    failed: 3,
  },
  {
    hour: "08:00",
    logins: 145,
    failed: 8,
  },
  {
    hour: "10:00",
    logins: 189,
    failed: 12,
  },
  {
    hour: "12:00",
    logins: 167,
    failed: 6,
  },
  {
    hour: "14:00",
    logins: 198,
    failed: 9,
  },
  {
    hour: "16:00",
    logins: 176,
    failed: 7,
  },
  {
    hour: "18:00",
    logins: 89,
    failed: 4,
  },
  {
    hour: "20:00",
    logins: 45,
    failed: 2,
  },
  {
    hour: "22:00",
    logins: 23,
    failed: 1,
  },
];

const eventsByTenant = [
  {
    tenant: "ABC Logistics",
    logins: 342,
    failed: 18,
    events: 12,
  },
  {
    tenant: "XYZ Transport",
    logins: 256,
    failed: 8,
    events: 5,
  },
  {
    tenant: "Quick Movers",
    logins: 189,
    failed: 23,
    events: 8,
  },
  {
    tenant: "Metro Couriers",
    logins: 145,
    failed: 5,
    events: 3,
  },
  {
    tenant: "Swift Delivery",
    logins: 198,
    failed: 11,
    events: 7,
  },
];

export default function SecurityOverviewPage() {
  const [loginEvents] = useState<LoginEvent[]>(mockLoginEvents);
  const [securityEvents] = useState<SecurityEvent[]>(mockSecurityEvents);
  const overviewQuery = useQuery(getSystemSecurityOverviewQueryOptions());
  const overview = overviewQuery.data?.data;
  const overviewLoading = overviewQuery.isLoading;
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
    loginActivityRange,
    setLoginActivityRange,
  ] = useState<ChartDateRange>("7d");
  const [
    tenantActivityRange,
    setTenantActivityRange,
  ] = useState<ChartDateRange>("7d");

  const totalLogins = overview?.successfulLoginsToday ?? 0;
  const totalFailedAttempts = overview?.failedLoginsToday ?? 0;
  const blockedIPsCount = overview?.activeBlocks ?? 0;
  const criticalEvents = (overview?.criticalEventsToday ?? 0) + (overview?.highEventsToday ?? 0);

  const handleViewEvent = (event: SecurityEvent) => {
    setSelectedEvent(event);
    setIsEventSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
        <StatCard
          title="Successful Logins (24h)"
          value={totalLogins}
          icon={LogIn}
          variant="success"
          change={12}
          changeLabel="vs yesterday"
          loading={overviewLoading}
        />
        <StatCard
          title="Failed Attempts (24h)"
          value={totalFailedAttempts}
          icon={UserX}
          variant="warning"
          change={-8}
          changeLabel="vs yesterday"
          loading={overviewLoading}
        />
        <StatCard
          title="Blocked IPs"
          value={blockedIPsCount}
          icon={Ban}
          variant="default"
          loading={overviewLoading}
        />
        <StatCard
          title="Critical Events"
          value={criticalEvents}
          icon={ShieldAlert}
          variant="danger"
          loading={overviewLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Login Activity Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Login Activity
                </CardTitle>
                <CardDescription>Successful logins vs failed attempts</CardDescription>
              </div>
              <ChartDateFilter
                value={loginActivityRange}
                onValueChange={setLoginActivityRange}
                options={[
                  "today",
                  "yesterday",
                  "7d",
                  "30d",
                  "90d",
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <AreaChart data={loginTrendData}>
                <defs>
                  <linearGradient
                    id="colorLogins"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--success))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--success))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="colorFailed"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--destructive))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--destructive))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="hour"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",

                  }}
                />
                <Area
                  type="monotone"
                  dataKey="logins"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLogins)"
                  name="Successful Logins"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFailed)"
                  name="Failed Attempts"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Events by Tenant */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Activity by Tenant
                </CardTitle>
                <CardDescription>Login and event distribution across tenants</CardDescription>
              </div>
              <ChartDateFilter
                value={tenantActivityRange}
                onValueChange={setTenantActivityRange}
                options={[
                  "today",
                  "yesterday",
                  "7d",
                  "30d",
                  "90d",
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart
                data={eventsByTenant}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  dataKey="tenant"
                  type="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",

                  }}
                />
                <Bar
                  dataKey="logins"
                  fill="hsl(var(--primary))"
                  name="Logins"
                  radius={[
                    0,
                    4,
                    4,
                    0,
                  ]}
                />
                <Bar
                  dataKey="failed"
                  fill="hsl(var(--destructive))"
                  name="Failed"
                  radius={[
                    0,
                    4,
                    4,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Recent Security Events
              </CardTitle>
              <CardDescription>Latest authentication, authorisation and suspicious activity events</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <NavLink to="/security/events">View All</NavLink>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityEvents.slice(
              0,
              5,
            ).map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleViewEvent(event)}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
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
                  <div>
                    <p className="font-medium text-sm">{event.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {event.tenant}
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      {formatDateInTimezone(
                        event.timestamp,
                        timezone,
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </div>
                  </div>
                </div>
                {getSeverityBadge(event.severity)}
              </div>
            ))}
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
