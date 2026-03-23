import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/features/auth/api/types";
import { cn } from "@/lib/utils";

const roleColors: Record<UserRole, string> = {
 ENTERPRISE_ADMIN: "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20",
 FLEET_ADMIN: "bg-accent/20 text-accent border-accent/30 hover:bg-accent/20",
 OPERATIONS_MANAGER: "bg-warning/20 text-warning border-warning/30 hover:bg-warning/20",
 DISPATCHER: "bg-success/20 text-success border-success/30 hover:bg-success/20",
 FINANCE_VIEWER: "bg-muted text-muted-foreground border-muted hover: bg-muted",
 AGGREGATOR_ADMIN: "",
 OWNER_OPERATOR: "",
 PLATFORM_ADMIN: ""
};

type RoleBadgeProps = {
 role: UserRole;
}

export default function RoleBadge({role}: RoleBadgeProps) {
 return (
  <Badge className={cn("capitalize truncate", roleColors[role])}>{role.replace("_", " ")}</Badge>
 )
}
