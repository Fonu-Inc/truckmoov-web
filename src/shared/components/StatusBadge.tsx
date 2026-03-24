import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
 active: "bg-success/20 text-success border-success/30",
 inactive: "bg-destructive/20 text-destructive border-destructive/30",
 maintenance: "bg-warning/10 text-warning",
 decommissioned: "bg-destructive/10 text-destructive"
};

type StatusBadgeProps = {
 status: string;
}
export default function StatusBadge({ status }: StatusBadgeProps) {
 return (
  <Badge className={cn("capitalize truncate", statusColors[status] ?? "bg-muted text-muted-foreground")}>{status}</Badge>
 )
}
