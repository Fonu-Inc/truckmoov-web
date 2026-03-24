import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
 active: "bg-success/20 text-success border-success/30",
 inactive: "bg-destructive/20 text-destructive border-destructive/30",
};

type StatusBadgeProps = {
 status: string;
}
export default function StatusBadge({ status }: StatusBadgeProps) {
 return (
  <Badge className={cn("capitalize truncate", statusColors[status] ?? "")}>{status}</Badge>
 )
}
