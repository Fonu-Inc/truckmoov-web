import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Building2,
  Users,
  Package,
  TrendingUp,
  Truck,
  Link2,
  Plus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useOrgContext } from "@/hooks/useOrgContext";
import { CreateOwnerOperatorDialog } from "@/components/aggregator/CreateOwnerOperatorDialog";

/**
 * Aggregator Dashboard (Stub)
 * Manage linked owner-operators and execution view for aggregated fleet.
 */
export default function AggregatorDashboard() {
  const { user } = useAuthStore();
  const [showCreateOO, setShowCreateOO] = useState(false);
  const orgCtx = useOrgContext();

  const aggregatorOrgIds = useMemo(
    () => orgCtx.getByOrgType("AGGREGATOR").map((m) => m.orgId),
    [orgCtx]
  );

  // Fetch linked organizations (owner-operators under this aggregator)
  const { data: linkedOrgs = [], isLoading, refetch: refetchOrgs } = useQuery({
    queryKey: ["aggregator-linked-orgs", aggregatorOrgIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_relationships")
        .select(`
          id, relationship_type, status,
          to_org:organizations!org_relationships_to_org_id_fkey(id, name, organization_type)
        `)
        .in("from_org_id", aggregatorOrgIds)
        .eq("status", "ACTIVE");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && aggregatorOrgIds.length > 0,
  });

  const childOrgIds = useMemo(
    () => linkedOrgs.map((r: any) => r.to_org?.id).filter(Boolean),
    [linkedOrgs]
  );

  // Fetch jobs assigned to aggregator's execution scope (self + children)
  const { data: jobs = [] } = useQuery({
    queryKey: ["aggregator-jobs", aggregatorOrgIds, childOrgIds],
    queryFn: async () => {
      const allOrgIds = [...aggregatorOrgIds, ...childOrgIds];
      let query = supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (allOrgIds.length > 0) {
        query = query.in("executing_org_id", allOrgIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && aggregatorOrgIds.length > 0,
  });

  const activeJobs = jobs.filter((j) => !["completed", "cancelled"].includes(j.status)).length;
  const ownerOperatorCount = linkedOrgs.filter(
    (r: any) => r.to_org?.organization_type === "OWNER_OPERATOR"
  ).length;

  return (
    <DashboardLayout
      title="Aggregator Dashboard"
      subtitle="Manage linked operators & coordinated execution"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Linked Operators"
            value={isLoading ? "..." : ownerOperatorCount}
            icon={Users}
          />
          <StatCard
            title="Total Relationships"
            value={isLoading ? "..." : linkedOrgs.length}
            icon={Link2}
          />
          <StatCard
            title="Active Jobs"
            value={activeJobs}
            icon={Package}
            variant={activeJobs > 0 ? "success" : "default"}
          />
          <StatCard
            title="Completed"
            value={jobs.filter((j) => j.status === "completed").length}
            icon={TrendingUp}
          />
        </div>

        {/* Linked Owner-Operators */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Linked Owner-Operators
            </CardTitle>
            <Button size="sm" onClick={() => setShowCreateOO(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Operator
            </Button>
          </CardHeader>
          <CardContent>
            {linkedOrgs.length === 0 ? (
              <EmptyState
                icon={Link2}
                title="No linked operators"
                description="Owner-operators linked to your aggregator will appear here. Relationships are managed via the platform admin."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {linkedOrgs.map((rel: any) => (
                  <div
                    key={rel.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {rel.to_org?.name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {rel.to_org?.organization_type?.replace("_", " ") || "Operator"}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {rel.relationship_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stub notice */}
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Full aggregator execution management, sub-dispatch, and operator performance views will be expanded in a future phase.
            </p>
          </CardContent>
        </Card>
      </div>

      <CreateOwnerOperatorDialog
        open={showCreateOO}
        onOpenChange={setShowCreateOO}
        onCreated={refetchOrgs}
      />
    </DashboardLayout>
  );
}
