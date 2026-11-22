import { Shield } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import {
  humaniseRoleKey, roleIndicatorClasses,
} from "@/features/settings/utils/roleBadge";
import { cn } from "@/lib/utils";

type RoleBadgeProps = {
  /** Role key (e.g. operations_manager) or an already-resolved label. */
  roleKey: string;
  /** Optional display label; falls back to a humanised role key. */
  label?: string;
  className?: string;
};

/** Fleetflow's `components/settings/RoleBadge` — the role indicator badge. */
export function RoleBadge({
  roleKey, label, className,
}: RoleBadgeProps) {
  if (!roleKey)
    return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium",
        roleIndicatorClasses(roleKey),
        className,
      )}
    >
      <Shield className="h-3 w-3" />
      {label || humaniseRoleKey(roleKey)}
    </Badge>
  );
}
