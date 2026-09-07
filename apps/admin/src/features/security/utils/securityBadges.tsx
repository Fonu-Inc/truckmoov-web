import type { SecurityEvent } from "@/features/security/types";
import {
  Ban,
  FileWarning,
  Key,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Unlock,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";

export function getSeverityBadge(severity: SecurityEvent["severity"] | "info" | "warning") {
  switch (severity) {
    case "low":
    case "info":
      return <Badge className="bg-muted text-muted-foreground">{severity === "info" ? "Info" : "Low"}</Badge>;
    case "medium":
    case "warning":
      return <Badge className="bg-warning/10 text-warning border-warning/30">{severity === "warning" ? "Warning" : "Medium"}</Badge>;
    case "high":
      return <Badge variant="destructive">High</Badge>;
    case "critical":
      return <Badge className="bg-destructive text-destructive-foreground animate-pulse">Critical</Badge>;
  }
}

export function getSecurityEventIcon(type: SecurityEvent["eventType"] | string) {
  switch (type) {
    case "password_change":
      return <Key className="h-4 w-4" />;
    case "mfa_enabled":
      return <ShieldCheck className="h-4 w-4" />;
    case "mfa_disabled":
      return <ShieldX className="h-4 w-4" />;
    case "api_key_created":
      return <Key className="h-4 w-4" />;
    case "api_key_revoked":
      return <Ban className="h-4 w-4" />;
    case "permission_change":
      return <Shield className="h-4 w-4" />;
    case "account_locked":
      return <Lock className="h-4 w-4" />;
    case "account_unlocked":
      return <Unlock className="h-4 w-4" />;
    case "suspicious_login":
      return <ShieldAlert className="h-4 w-4" />;
    case "data_export":
      return <FileWarning className="h-4 w-4" />;
    case "ip_blocked":
      return <Ban className="h-4 w-4" />;
    case "ip_unblocked":
      return <Unlock className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
}
