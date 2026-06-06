import { AlertTriangle, Clock, Shield, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";
type DispatchEligibility = any;

interface MaintenanceDispatchWarningProps {
  eligibility: DispatchEligibility | null;
  isLoading?: boolean;
  className?: string;
}

export function MaintenanceDispatchWarning({
  eligibility,
  isLoading,
  className,
}: MaintenanceDispatchWarningProps) {
  if (isLoading) {
    return (
      <div className={cn("animate-pulse h-12 rounded-lg bg-muted/50", className)} />
    );
  }

  if (!eligibility) return null;

  // No issues
  if (eligibility.overdue_count === 0 && eligibility.due_count === 0) {
    return null;
  }

  // Blocked
  if (!eligibility.eligible && eligibility.block_reason) {
    return (
      <Alert variant="destructive" className={cn("border-destructive/50", className)}>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          Dispatch Blocked
          <Badge variant="destructive" className="text-xs">
            Action Required
          </Badge>
        </AlertTitle>
        <AlertDescription>
          {eligibility.block_reason}
        </AlertDescription>
      </Alert>
    );
  }

  // Warnings only
  if (eligibility.warnings.length > 0) {
    const hasOverdue = eligibility.overdue_count > 0;
    
    return (
      <Alert 
        className={cn(
          hasOverdue ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5",
          className
        )}
      >
        {hasOverdue ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <Clock className="h-4 w-4 text-warning" />
        )}
        <AlertTitle className="flex items-center gap-2">
          Maintenance {hasOverdue ? 'Overdue' : 'Due'}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              hasOverdue ? "border-destructive/50 text-destructive" : "border-warning/50 text-warning"
            )}
          >
            {eligibility.overdue_count + eligibility.due_count} item(s)
          </Badge>
        </AlertTitle>
        <AlertDescription className="space-y-1">
          {eligibility.warnings.map((warning, i) => (
            <p key={i} className="text-sm">{warning}</p>
          ))}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

// Compact badge version for use in tables/lists
interface MaintenanceStatusBadgeProps {
  overdueCount: number;
  dueCount: number;
  className?: string;
}

export function MaintenanceStatusBadge({
  overdueCount,
  dueCount,
  className,
}: MaintenanceStatusBadgeProps) {
  if (overdueCount === 0 && dueCount === 0) {
    return (
      <Badge variant="outline" className={cn("gap-1 text-success border-success/30", className)}>
        <Shield className="h-3 w-3" />
        OK
      </Badge>
    );
  }

  if (overdueCount > 0) {
    return (
      <Badge 
        variant="outline" 
        className={cn("gap-1 text-destructive border-destructive/30 bg-destructive/10", className)}
      >
        <AlertTriangle className="h-3 w-3" />
        {overdueCount} Overdue
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn("gap-1 text-warning border-warning/30 bg-warning/10", className)}
    >
      <Clock className="h-3 w-3" />
      {dueCount} Due
    </Badge>
  );
}



