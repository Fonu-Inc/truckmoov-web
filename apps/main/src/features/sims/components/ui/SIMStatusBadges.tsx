import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";

/** Renders a KYC verification status badge for a tenant. */
export function KYCBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground"
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        No KYC
      </Badge>
    );
  }

  switch (status) {
    case "verified":
      return (
        <Badge className="bg-success/10 text-success border-success/30">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    case "pending":
    case "under_review":
      return (
        <Badge className="bg-warning/10 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <ShieldAlert className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
  }
}

/** Renders a provisioning request status badge. */
export function RequestStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
    case "pending_review":
    case "approved":
    case "approved_pending_activation":
      return (
        <Badge className="bg-warning/10 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-info/10 text-info border-info/30">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-success/10 text-success border-success/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

/** Renders a priority badge. */
export function PriorityBadge({ priority }: { priority: string | null }) {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">High</Badge>;
    case "urgent":
      return (
        <Badge className="bg-destructive text-destructive-foreground">
          Urgent
        </Badge>
      );
    default:
      return <Badge variant="outline">Normal</Badge>;
  }
}
