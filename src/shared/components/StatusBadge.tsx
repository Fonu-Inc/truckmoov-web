import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
 available: "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20",
 offline: "bg-muted text-muted-foreground border-muted hover:bg-muted hover:text-muted-foreground",
 suspended: "bg-destructive/20 text-destructive border-destructive/30",
 active: "bg-success/20 text-success border-success/30 hover:bg-success/20",
 inactive: "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/20",
 maintenance: "bg-warning/10 text-warning",
 decommissioned: "bg-destructive/10 text-destructive",
 deactivated: "bg-destructive/10 text-destructive",
 registered: "bg-muted text-muted-foreground hover:bg-muted",
 config_pending: "bg-warning/20 text-warning border-warning/30",
 configured: "bg-info/10 text-info",
 verified_online: "bg-success/10 text-success border-success/30",
 assignable: "bg-primary/20 text-primary border-primary/30",
 faulty: "bg-destructive/10 text-destructive",
 created: "bg-muted text-muted-foreground border-muted",
 assigned: "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20",
 accepted: "bg-success/20 text-success border-success/30",
 pending: "bg-warning/20 text-warning border-warning/30",
 approved: "bg-success/20 text-success border-success/30",
 rejected: "bg-destructive/20 text-destructive border-destructive/30",
 in_progress: "bg-warning/20 text-warning border-warning/30",
 fulfilled: "bg-success/20 text-success border-success/30",
 completed: "bg-success/20 text-success border-success/30",
 cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

type StatusBadgeProps = {
 status: string;
}
export default function StatusBadge({ status }: StatusBadgeProps) {
 const label = status.replace(/_/g, " ");
 return (
  <Badge className={cn("capitalize truncate", statusColors[status] ?? "bg-muted text-muted-foreground hover:bg-muted")}>{label}</Badge>
 )
}
