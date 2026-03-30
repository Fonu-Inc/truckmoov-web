import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { operationalDashboardQueryOptions } from "@/features/fleet/api";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Circle } from "lucide-react";
import { Link } from "react-router-dom";

const JOB_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
 created: { label: "Created", className: "bg-muted text-muted-foreground" },
 assigned: { label: "Assigned", className: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
 in_progress: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
 delivered: { label: "Delivered", className: "bg-green-500/10 text-green-600 border-green-500/30" },
 cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const DRIVER_STATUS_CONFIG = [
 { key: "active", label: "Active", dotClass: "text-green-500" },
 { key: "assigned", label: "Assigned", dotClass: "text-yellow-500" },
 { key: "inactive", label: "Inactive", dotClass: "text-muted-foreground" },
] as const;

export default function DispatchBoard() {
 const { user } = useAuthStore();
 const tenantId = user?.tenantId ?? "";

 const { data, isLoading } = useQuery(
  operationalDashboardQueryOptions({ params: { tenantId } })
 );

 const ops = data?.data;
 const byStatus = (ops?.jobs?.byStatus ?? {}) as Record<string, number>;

 const statusEntries = Object.entries(byStatus);

 return (
  <Card className="flex flex-col">
   <CardHeader>
    <div className="flex items-center justify-between">
     <CardTitle className="text-base">Dispatch Board</CardTitle>
     <Button variant="ghost" size="sm" asChild>
      <Link to={APP_ROUTES.jobs} className="flex items-center gap-1 text-xs">
       View All <ArrowRight className="h-3 w-3" />
      </Link>
     </Button>
    </div>
   </CardHeader>
   <CardContent className="flex-1 grid grid-cols-2 gap-6">
    {/* Jobs by Status */}
    <div>
     <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Jobs by Status</p>
     {isLoading ? (
      <div className="space-y-2">
       {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
       ))}
      </div>
     ) : statusEntries.length === 0 ? (
      <p className="text-sm text-muted-foreground">No jobs data</p>
     ) : (
      <div className="space-y-2">
       {statusEntries.map(([status, count]) => {
        const config = JOB_STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
        return (
         <div key={status} className="flex items-center justify-between">
          <Badge variant="outline" className={config.className}>{config.label}</Badge>
          <span className="text-sm font-semibold">{count}</span>
         </div>
        );
       })}
      </div>
     )}
    </div>

    {/* Driver Availability */}
    <div>
     <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Driver Availability</p>
     {isLoading ? (
      <div className="space-y-2">
       {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
       ))}
      </div>
     ) : (
      <div className="space-y-2">
       {DRIVER_STATUS_CONFIG.map(({ key, label, dotClass }) => (
        <div key={key} className="flex items-center justify-between">
         <div className="flex items-center gap-2">
          <Circle className={`h-2 w-2 fill-current ${dotClass}`} />
          <span className="text-sm text-muted-foreground">{label}</span>
         </div>
         <span className="text-sm font-semibold">{ops?.drivers?.[key] ?? 0}</span>
        </div>
       ))}
       <div className="border-t pt-2 mt-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-sm font-bold">{ops?.drivers?.total ?? 0}</span>
       </div>
      </div>
     )}
    </div>
   </CardContent>
  </Card>
 );
}
