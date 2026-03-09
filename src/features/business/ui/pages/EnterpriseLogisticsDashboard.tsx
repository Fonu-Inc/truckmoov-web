import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { useOrgContext } from "@/hooks/useOrgContext";
import {
  Package,
  Building2,
  TrendingUp,
  Clock,
  MapPin,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useMemo } from "react";
import { format as dateFormat } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

/**
 * Enterprise Logistics Dashboard
 * Read-only view of all jobs owned by the enterprise, grouped by executing provider.
 */
export default function EnterpriseLogisticsDashboard() {
  const { user } = useAuthStore();
  const { format: formatCurrency } = useCurrency();
  const orgCtx = useOrgContext();

  // Get the enterprise org IDs for filtering
  const enterpriseOrgIds = useMemo(
    () => orgCtx.getByOrgType("ENTERPRISE").map((m) => m.orgId),
    [orgCtx]
  );

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["enterprise-jobs", enterpriseOrgIds],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter to only jobs owned by the enterprise org
      if (enterpriseOrgIds.length > 0) {
        query = query.in("job_owner_org_id", enterpriseOrgIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && enterpriseOrgIds.length > 0,
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["enterprise-orgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, organization_type, tenant_id");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: jobOffers = [] } = useQuery({
    queryKey: ["enterprise-job-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const jobsByProvider = useMemo(() => {
    const grouped: Record<string, { orgName: string; orgId: string; jobs: typeof jobs }> = {};
    jobs.forEach((job) => {
      const execOrgId = job.executing_org_id || "unassigned";
      if (!grouped[execOrgId]) {
        const org = organizations.find((o) => o.id === execOrgId);
        grouped[execOrgId] = {
          orgName: org?.name || (execOrgId === "unassigned" ? "Unassigned" : "Unknown Provider"),
          orgId: execOrgId,
          jobs: [],
        };
      }
      grouped[execOrgId].jobs.push(job);
    });
    return Object.values(grouped);
  }, [jobs, organizations]);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => !["completed", "cancelled"].includes(j.status)).length;
  const pendingOffers = jobOffers.filter((o) => o.status === "PENDING").length;

  const onTimeRate = useMemo(() => {
    const completed = jobs.filter((j) => j.status === "completed");
    if (completed.length === 0) return null;
    const onTime = completed.filter((j) => {
      if (!j.deadline) return true;
      return new Date(j.updated_at) <= new Date(j.deadline);
    }).length;
    return Math.round((onTime / completed.length) * 100);
  }, [jobs]);

  const getStatusColor = (status: string): "default" | "secondary" | "outline-solid" | "destructive" => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "assigned": case "accepted": return "outline-solid";
      case "cancelled": return "destructive";
      default: return "outline-solid";
    }
  };

  return (
    <DashboardLayout
      title="Logistics Dashboard"
      subtitle="Enterprise-wide job monitoring & provider performance"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Jobs" value={jobsLoading ? "..." : totalJobs} icon={Package} />
          <StatCard title="Active Jobs" value={jobsLoading ? "..." : activeJobs} icon={TrendingUp} variant={activeJobs > 0 ? "success" : "default"} />
          <StatCard title="Pending Offers" value={jobsLoading ? "..." : pendingOffers} icon={Clock} variant={pendingOffers > 3 ? "warning" : "default"} />
          <StatCard title="On-Time Delivery" value={jobsLoading ? "..." : onTimeRate !== null ? `${onTimeRate}%` : "N/A"} icon={CheckCircle2} variant={onTimeRate !== null && onTimeRate >= 90 ? "success" : "default"} />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Jobs by Executing Provider
          </h2>

          {jobsByProvider.length === 0 ? (
            <EmptyState icon={Package} title="No jobs yet" description="Jobs created by your enterprise will appear here, grouped by provider." />
          ) : (
            jobsByProvider.map((group) => (
              <Card key={group.orgId}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-base">{group.orgName}</span>
                    </div>
                    <Badge variant="outline">{group.jobs.length} jobs</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4 p-3 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{group.jobs.filter((j) => j.status === "in_progress").length}</p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{group.jobs.filter((j) => j.status === "completed").length}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{group.jobs.filter((j) => j.status === "assigned" || j.status === "accepted").length}</p>
                      <p className="text-xs text-muted-foreground">Assigned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{group.jobs.filter((j) => j.status === "created").length}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.jobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{job.reference}</span>
                            <Badge variant={getStatusColor(job.status)}>{job.status.replace(/_/g, " ")}</Badge>
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
                    {group.jobs.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">+ {group.jobs.length - 5} more jobs</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Provider Fleet Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Provider Fleet Summary
              <Badge variant="secondary" className="ml-2">Read-only</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {organizations.filter((o) => o.organization_type === "FLEET_PROVIDER" || o.organization_type === "AGGREGATOR").length === 0 ? (
              <EmptyState icon={Building2} title="No contracted providers" description="Provider fleet details will appear here once relationships are established." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizations
                  .filter((o) => o.organization_type === "FLEET_PROVIDER" || o.organization_type === "AGGREGATOR")
                  .slice(0, 6)
                  .map((org) => {
                    const orgJobs = jobs.filter((j) => j.executing_org_id === org.id);
                    return (
                      <div key={org.id} className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{org.name}</span>
                          <Badge variant="outline" className="text-[10px]">{org.organization_type?.replace("_", " ")}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="rounded bg-muted/50 p-2">
                            <Package className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-bold">{orgJobs.length}</p>
                            <p className="text-[10px] text-muted-foreground">Jobs</p>
                          </div>
                          <div className="rounded bg-muted/50 p-2">
                            <CheckCircle2 className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-bold">{orgJobs.filter((j) => j.status === "completed").length}</p>
                            <p className="text-[10px] text-muted-foreground">Completed</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
