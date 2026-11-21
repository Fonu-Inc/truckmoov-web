import type {
  AuditOutcome, AuditSeverity,
} from "@/features/audit/utils/unifiedAudit";

export const sevClass: Record<AuditSeverity, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground",
  info: "bg-muted text-muted-foreground",
};

export const outClass: Record<AuditOutcome, string> = {
  success: "bg-success/10 text-success border-success/30",
  failure: "bg-destructive/10 text-destructive border-destructive/30",
  flagged: "bg-warning/10 text-warning border-warning/30",
};
