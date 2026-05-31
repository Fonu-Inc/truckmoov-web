import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Truck,
  Package,
  TrendingUp,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Clock,
  Inbox,
  AlertTriangle,
  ArrowUpCircle,
  ShieldAlert,
  CalendarClock,
  Wallet,
  FileWarning,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useOwnerOperatorVehicleCap } from "@/hooks/useOwnerOperatorVehicleCap";
import { useOwnerOperatorJobLimit } from "@/hooks/useOwnerOperatorJobLimit";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format as dateFormat, differenceInDays, isAfter, isBefore, addDays } from "date-fns";
import { UpgradeRequestDialog } from "@/components/owner-operator/UpgradeRequestDialog";
import { ComplianceDocumentsPanel } from "@/components/owner-operator/ComplianceDocumentsPanel";
import { DeviceSetupRequestTracker } from "@/components/devices/DeviceSetupRequestTracker";
import { DeviceSetupRequestDialog } from "@/components/devices/DeviceSetupRequestDialog";
import { useDeviceSetupRequests } from "@/hooks/useDeviceSetupRequests";
import { ChartDateFilter, type ChartDateRange } from "@/components/ui/chart-date-filter";
import {
  DUMMY_RECENT_JOBS,
  DUMMY_VEHICLES,
  getDummyEarningsSummary,
  getDummyEarningsTrend,
} from "@/lib/ownerOperatorDummyData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/**
 * Owner-Operator Lite Portal
 * WhatsApp-first, single-truck operator dashboard.
 * Shows: active/upcoming job, earnings summary, compliance reminders.
 * Hides: fleet analytics, multi-user management, advanced reporting.
 */
export default function OwnerOperatorDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const orgCtx = useOrgContext();
  const { format: formatCurrency } = useCurrency();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDeviceRequestDialog, setShowDeviceRequestDialog] = useState(false);
  const [earningsRange, setEarningsRange] = useState<ChartDateRange>("30d");
  const { requests: deviceRequests, loading: deviceRequestsLoading, createRequest, updateRequestStatus, uploadFile } = useDeviceSetupRequests();
  const { eligible: jobEligible, activeJobs, maxActiveJobs, reason: jobLimitReason } = useOwnerOperatorJobLimit();

  const ownerOrg = useMemo(
    () => orgCtx.getByOrgType("OWNER_OPERATOR")[0],
    [orgCtx]
  );

  const { data: vehicleCap } = useOwnerOperatorVehicleCap(ownerOrg?.orgId);

  // Fetch jobs assigned to this owner-operator's org
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["oo-jobs", ownerOrg?.orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("executing_org_id", ownerOrg!.orgId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!ownerOrg?.orgId,
  });

  // Fetch vehicles owned by this org
  const { data: vehicles = [] } = useQuery({
    queryKey: ["oo-vehicles", ownerOrg?.orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, registration_number, make, model, year, status, owning_org_id, tenant_id")
        .eq("owning_org_id", ownerOrg!.orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!ownerOrg?.orgId,
  });

  // Fetch pending job offers
  const { data: pendingOffers = [] } = useQuery({
    queryKey: ["oo-job-offers", ownerOrg?.orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select("id, job_id, target_org_id, offered_rate_ngn, status, created_at")
        .eq("target_org_id", ownerOrg!.orgId)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!ownerOrg?.orgId,
  });

  // Fetch compliance documents for expiry reminders
  const tenantId = vehicles[0]?.tenant_id;
  const { data: complianceDocs = [] } = useQuery({
    queryKey: ["oo-compliance", tenantId, vehicles.map(v => v.id)],
    queryFn: async () => {
      const vehicleIds = vehicles.map(v => v.id);
      if (vehicleIds.length === 0) return [];
      const { data, error } = await supabase
        .from("compliance_documents")
        .select("id, document_name, document_type, expiry_date, status, vehicle_id, vehicle_name")
        .in("vehicle_id", vehicleIds)
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: vehicles.length > 0,
  });

  // Derived data
  const activeJob = jobs.find(j => ["assigned", "accepted", "in_progress", "arrived_pickup", "arrived_dropoff"].includes(j.status));
  const upcomingJob = jobs.find(j => j.status === "pending" || j.status === "offered");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.revenue_ngn || j.amount_ngn || 0), 0);

  // Earnings breakdown: this month vs last month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const realThisMonth = completedJobs
    .filter(j => new Date(j.updated_at) >= thisMonthStart)
    .reduce((sum, j) => sum + (j.revenue_ngn || j.amount_ngn || 0), 0);
  const realLastMonth = completedJobs
    .filter(j => new Date(j.updated_at) >= lastMonthStart && new Date(j.updated_at) < thisMonthStart)
    .reduce((sum, j) => sum + (j.revenue_ngn || j.amount_ngn || 0), 0);
  const realThisMonthTrips = completedJobs.filter(j => new Date(j.updated_at) >= thisMonthStart).length;

  // Dummy fallbacks (rendered when no real data)
  const usingDummy = jobs.length === 0;
  const earningsTrend = useMemo(() => getDummyEarningsTrend(earningsRange), [earningsRange]);
  const earningsSummary = useMemo(() => getDummyEarningsSummary(earningsRange), [earningsRange]);
  const displayVehicles = vehicles.length > 0 ? vehicles : DUMMY_VEHICLES;
  const displayRecentJobs = jobs.length > 0 ? jobs : DUMMY_RECENT_JOBS;
  const displayActiveJob = activeJob ?? (usingDummy ? DUMMY_RECENT_JOBS[0] : null);
  const displayPendingOffers = pendingOffers.length > 0 ? pendingOffers : (usingDummy ? [
    { id: "d-off1", job_id: "dummy-job-1", offered_rate_ngn: 320000 },
    { id: "d-off2", job_id: "dummy-job-2", offered_rate_ngn: 180000 },
  ] : []);
  const thisMonthEarnings = usingDummy ? earningsSummary.total : realThisMonth;
  const lastMonthEarnings = usingDummy ? earningsSummary.lastMonth : realLastMonth;
  const thisMonthTrips = usingDummy ? earningsSummary.trips : realThisMonthTrips;
  const totalLifetime = usingDummy ? earningsSummary.total * 6 : totalEarnings;
  const completedTripsCount = usingDummy ? earningsSummary.trips * 4 : completedJobs.length;

  // Compliance alerts: docs expiring within 30 days or already expired
  const expiringDocs = complianceDocs.filter(doc => {
    const expiry = new Date(doc.expiry_date);
    return isBefore(expiry, addDays(now, 30));
  });
  const expiredDocs = expiringDocs.filter(doc => isBefore(new Date(doc.expiry_date), now));
  const soonDocs = expiringDocs.filter(doc => !isBefore(new Date(doc.expiry_date), now));

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": case "arrived_pickup": case "arrived_dropoff": return "secondary";
      case "assigned": case "accepted": return "outline";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle={ownerOrg?.orgName || "Owner-Operator"}
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="My Trucks" value={displayVehicles.length} icon={Truck} />
          <StatCard
            title="Active Job"
            value={jobsLoading ? "..." : displayActiveJob ? "1" : "None"}
            icon={Package}
            variant={displayActiveJob ? "success" : "default"}
          />
          <StatCard
            title="Pending Offers"
            value={displayPendingOffers.length}
            icon={Inbox}
            variant={displayPendingOffers.length > 0 ? "warning" : "default"}
          />
          <StatCard
            title="This Month"
            value={jobsLoading ? "..." : formatCurrency(thisMonthEarnings)}
            icon={Wallet}
          />
        </div>

        {/* Vehicle Cap Banner */}
        {vehicleCap && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Vehicles: {vehicleCap.currentCount} / {vehicleCap.maxVehicles}
              </span>
              <span className="text-muted-foreground">
                {vehicleCap.remaining} slot{vehicleCap.remaining !== 1 ? "s" : ""} remaining
              </span>
            </div>
            <Progress value={(vehicleCap.currentCount / vehicleCap.maxVehicles) * 100} className="h-2" />
            {vehicleCap.isAtCap && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{vehicleCap.upgradeMessage}</span>
                  <Button variant="outline" size="sm" className="ml-4 shrink-0" onClick={() => setShowUpgradeDialog(true)}>
                    <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />
                    Request Upgrade
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Active Job Limit Banner */}
        {!jobEligible && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {jobLimitReason || `You have ${activeJobs} active job(s). Maximum allowed: ${maxActiveJobs}. Complete your current job to accept new offers.`}
            </AlertDescription>
          </Alert>
        )}

        {jobEligible && activeJobs > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Active jobs: {activeJobs}/{maxActiveJobs}. You can accept {maxActiveJobs - activeJobs} more offer(s).
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance Expiry Reminders */}
        {expiringDocs.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                Compliance Alerts
                <Badge variant="destructive">{expiringDocs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {expiredDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="font-medium text-sm">{doc.document_name}</p>
                    <p className="text-xs text-muted-foreground">{doc.vehicle_name || "Vehicle"} · {doc.document_type}</p>
                  </div>
                  <Badge variant="destructive">
                    <FileWarning className="mr-1 h-3 w-3" />
                    Expired {dateFormat(new Date(doc.expiry_date), "MMM d")}
                  </Badge>
                </div>
              ))}
              {soonDocs.map(doc => {
                const daysLeft = differenceInDays(new Date(doc.expiry_date), now);
                return (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="font-medium text-sm">{doc.document_name}</p>
                      <p className="text-xs text-muted-foreground">{doc.vehicle_name || "Vehicle"} · {doc.document_type}</p>
                    </div>
                    <Badge variant="outline" className="border-warning text-warning">
                      <CalendarClock className="mr-1 h-3 w-3" />
                      {daysLeft}d left
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Pending Job Offers */}
        {pendingOffers.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Inbox className="h-5 w-5 text-primary" />
                New Job Offers
                <Badge variant="secondary">{pendingOffers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingOffers.slice(0, 3).map((offer) => (
                <div key={offer.id} className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-medium text-sm">Job #{offer.job_id?.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {offer.offered_rate_ngn ? formatCurrency(offer.offered_rate_ngn) : "Rate TBD"}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">Pending</Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center">
                💬 You can also accept offers via WhatsApp
              </p>
            </CardContent>
          </Card>
        )}

        {/* Active Job Card */}
        {activeJob && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Active Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{activeJob.reference}</span>
                  <Badge variant={getStatusVariant(activeJob.status)}>
                    {activeJob.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{activeJob.pickup_address?.split(",")[0] || "Pickup"} → {activeJob.delivery_address?.split(",")[0] || "Delivery"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-semibold">{formatCurrency(activeJob.amount_ngn || 0)}</span>
                </div>
                {activeJob.deadline && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deadline</span>
                    <span>{dateFormat(new Date(activeJob.deadline), "MMM d, h:mm a")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Earnings Summary */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Earnings Summary
                </CardTitle>
                <CardDescription>Your earnings trend, period totals, and lifetime payout summary.</CardDescription>
              </div>
              <ChartDateFilter
                value={earningsRange}
                onValueChange={setEarningsRange}
                options={["today", "yesterday", "7d", "30d", "90d"]}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[180px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earningsTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Selected Period</p>
                  <p className="text-lg font-bold">{formatCurrency(thisMonthEarnings)}</p>
                  <p className="text-xs text-muted-foreground">{thisMonthTrips} trip{thisMonthTrips !== 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Previous Period</p>
                  <p className="text-lg font-bold">{formatCurrency(lastMonthEarnings)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Lifetime</span>
                <span className="font-bold text-lg">{formatCurrency(totalLifetime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed Trips</span>
                <span className="font-medium">{completedTripsCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* My Vehicle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-5 w-5 text-primary" />
                My Vehicles
              </CardTitle>
              <CardDescription>Trucks registered under your owner-operator account and their current status.</CardDescription>
            </CardHeader>
            <CardContent>
              {displayVehicles.length === 0 ? (
                <EmptyState icon={Truck} title="No vehicles registered" description="Your trucks will appear here once registered." />
              ) : (
                <div className="space-y-3">
                  {displayVehicles.map((v: any) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30 cursor-pointer"
                      onClick={() => navigate(`/owner-operator/vehicle/${v.id}`)}
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{v.registration_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.make} {v.model} · {v.year || "—"}
                          {v.lastTrip ? ` · ${v.lastTrip}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={v.status === "active" ? "default" : "secondary"}>{v.status}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Device Setup Requests */}
        <DeviceSetupRequestTracker
          requests={deviceRequests}
          loading={deviceRequestsLoading}
          onNewRequest={() => setShowDeviceRequestDialog(true)}
          onCancelRequest={(id) => updateRequestStatus(id, 'cancelled')}
        />

        {/* Compliance Documents Upload */}
        {ownerOrg && (
          <ComplianceDocumentsPanel
            orgId={ownerOrg.orgId}
            tenantId={tenantId}
            vehicleIds={vehicles.map(v => v.id)}
          />
        )}

        {/* Recent Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />
              Recent Jobs
            </CardTitle>
            <CardDescription>Your latest assigned shipments and their delivery progress.</CardDescription>
          </CardHeader>
          <CardContent>
            {displayRecentJobs.length === 0 ? (
              <EmptyState icon={Package} title="No jobs yet" description="Jobs assigned to you will appear here." />
            ) : (
              <div className="space-y-2">
                {displayRecentJobs.slice(0, 8).map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{job.reference}</span>
                        <Badge variant={getStatusVariant(job.status)}>{job.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {job.pickup_address?.split(",")[0] || "Pickup"} → {job.delivery_address?.split(",")[0] || "Delivery"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-medium text-sm">{formatCurrency(job.amount_ngn || 0)}</p>
                      <p className="text-xs text-muted-foreground">{dateFormat(new Date(job.created_at), "MMM d")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp-First CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">WhatsApp Connected</p>
                <p className="text-xs text-muted-foreground">
                  Accept jobs, send updates, and communicate via WhatsApp
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">Active</Badge>
          </CardContent>
        </Card>
      </div>

      {ownerOrg && vehicleCap && (
        <UpgradeRequestDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          orgId={ownerOrg.orgId}
          tenantId=""
          currentVehicleCount={vehicleCap.currentCount}
          onSubmitted={() => setShowUpgradeDialog(false)}
        />
      )}

      <DeviceSetupRequestDialog
        open={showDeviceRequestDialog}
        onOpenChange={setShowDeviceRequestDialog}
        onSubmit={createRequest}
        onUploadFile={uploadFile}
      />
    </DashboardLayout>
  );
}



