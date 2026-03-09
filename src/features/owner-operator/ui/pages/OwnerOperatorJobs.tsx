import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Calendar,
  DollarSign,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useOwnerOperatorJobLimit } from "@/hooks/useOwnerOperatorJobLimit";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useMemo, useState } from "react";
import { format as dateFormat } from "date-fns";

export default function OwnerOperatorJobs() {
  const orgCtx = useOrgContext();
  const { format: formatCurrency } = useCurrency();
  const { eligible, activeJobs, maxActiveJobs, reason } = useOwnerOperatorJobLimit();
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const ownerOrg = useMemo(
    () => orgCtx.getByOrgType("OWNER_OPERATOR")[0],
    [orgCtx]
  );

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["oo-my-jobs", ownerOrg?.orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("executing_org_id", ownerOrg!.orgId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!ownerOrg?.orgId,
  });

  const activeStatuses = ["assigned", "accepted", "in_progress", "arrived_pickup", "arrived_dropoff"];
  const activeJobsList = jobs.filter(j => activeStatuses.includes(j.status));
  const completedJobs = jobs.filter(j => j.status === "completed");
  const otherJobs = jobs.filter(j => !activeStatuses.includes(j.status) && j.status !== "completed");

  const getStatusVariant = (status: string): "default" | "secondary" | "outline-solid" | "destructive" => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": case "arrived_pickup": case "arrived_dropoff": return "secondary";
      case "assigned": case "accepted": return "outline-solid";
      case "cancelled": return "destructive";
      default: return "outline-solid";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": case "arrived_pickup": case "arrived_dropoff": return "text-primary";
      case "completed": return "text-success";
      case "cancelled": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const renderJobCard = (job: any) => (
    <div
      key={job.id}
      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/30 cursor-pointer"
      onClick={() => setSelectedJob(job)}
    >
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{job.reference}</span>
          <Badge variant={getStatusVariant(job.status)}>
            {job.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {job.pickup_address?.split(",")[0] || "Pickup"}
          </span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {job.delivery_address?.split(",")[0] || "Delivery"}
          </span>
        </div>
        {job.deadline && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Due: {dateFormat(new Date(job.deadline), "MMM d, HH:mm")}</span>
          </div>
        )}
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className="font-semibold text-sm">{formatCurrency(job.amount_ngn || job.revenue_ngn || 0)}</p>
        <p className="text-xs text-muted-foreground">{dateFormat(new Date(job.created_at), "MMM d")}</p>
        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
      </div>
    </div>
  );

  return (
    <DashboardLayout title="My Jobs" subtitle="Track and manage your assigned jobs">
      <div className="space-y-4">
        {/* Active Job Limit Banner */}
        {!eligible && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {reason || `You have ${activeJobs} active job(s). Maximum allowed: ${maxActiveJobs}. Complete your current job to accept new offers.`}
            </AlertDescription>
          </Alert>
        )}

        {eligible && activeJobs > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Active jobs: {activeJobs}/{maxActiveJobs}. You can accept {maxActiveJobs - activeJobs} more offer(s).
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Active ({activeJobsList.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed ({completedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="other" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Other ({otherJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {activeJobsList.length === 0 ? (
              <EmptyState icon={Package} title="No active jobs" description="When you accept a job offer, it will appear here." />
            ) : (
              <div className="space-y-3">
                {activeJobsList.map(renderJobCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completedJobs.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No completed jobs" description="Completed jobs will appear here." />
            ) : (
              <div className="space-y-3">
                {completedJobs.map(renderJobCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="other" className="mt-4">
            {otherJobs.length === 0 ? (
              <EmptyState icon={Clock} title="No other jobs" description="Pending and cancelled jobs will appear here." />
            ) : (
              <div className="space-y-3">
                {otherJobs.map(renderJobCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Detail Sheet */}
      <Sheet open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedJob && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {selectedJob.reference}
                </SheetTitle>
                <SheetDescription>
                  <Badge variant={getStatusVariant(selectedJob.status)}>
                    {selectedJob.status.replace(/_/g, " ")}
                  </Badge>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 mt-6">
                {/* Route */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Route</h4>
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pickup</p>
                        <p className="text-sm">{selectedJob.pickup_address || "Not specified"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Delivery</p>
                        <p className="text-sm">{selectedJob.delivery_address || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Financial */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Financial</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="font-semibold">{formatCurrency(selectedJob.amount_ngn || 0)}</p>
                    </div>
                    {selectedJob.revenue_ngn && (
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-semibold">{formatCurrency(selectedJob.revenue_ngn)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Cargo */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Cargo Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedJob.cargo_type && (
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p>{selectedJob.cargo_type}</p>
                      </div>
                    )}
                    {selectedJob.cargo_weight && (
                      <div>
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p>{selectedJob.cargo_weight} tons</p>
                      </div>
                    )}
                    {selectedJob.distance && (
                      <div>
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p>{selectedJob.distance} km</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Timeline */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Timeline</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{dateFormat(new Date(selectedJob.created_at), "MMM d, yyyy HH:mm")}</span>
                    </div>
                    {selectedJob.deadline && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deadline</span>
                        <span>{dateFormat(new Date(selectedJob.deadline), "MMM d, yyyy HH:mm")}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span>{dateFormat(new Date(selectedJob.updated_at), "MMM d, yyyy HH:mm")}</span>
                    </div>
                  </div>
                </div>

                {selectedJob.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Notes</h4>
                      <p className="text-sm">{selectedJob.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
