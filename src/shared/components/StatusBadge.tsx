import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
 available: "bg-primary/20 text-success border-primary/30",
 offline: "bg-muted text-muted-foreground border-muted",
 suspended: "bg-destructive/20 text-destructive border-destructive/30",
 active: "bg-success/20 text-success border-success/30 hover:bg-success/20",
 inactive: "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/20",
 maintenance: "bg-warning/10 text-warning",
 decommissioned: "bg-destructive/10 text-destructive",
 registered: "bg-muted text-muted-foreground",
 configured: "bg-info/10 text-info",
 faulty: "bg-destructive/10 text-destructive",
 created: "bg-muted text-muted-foreground border-muted",
 assigned: "bg-primary/20 text-primary border-primary/30",
 accepted: "bg-success/20 text-success border-success/30",
 in_progress: "bg-warning/20 text-warning border-warning/30",
 completed: "bg-success/20 text-success border-success/30",
 cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

type StatusBadgeProps = {
 status: string;
}
export default function StatusBadge({ status }: StatusBadgeProps) {
 return (
  <Badge className={cn("capitalize truncate", statusColors[status] ?? "bg-muted text-muted-foreground")}>{status}</Badge>
 )
}
