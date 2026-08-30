import {
  AlertTriangle, CheckCircle2, Clock, FileText, Loader2, Receipt, XCircle,
} from "lucide-react";
import type React from "react";

export const statusConfig: Record<string, {
  label: string; color: string; icon: React.ElementType;
}> = {
  received: {
    label: "Received", color: "bg-info/10 text-info border-info/20", icon: Clock,
  },
  processing: {
    label: "Processing", color: "bg-warning/10 text-warning border-warning/20", icon: Loader2,
  },
  extracted: {
    label: "Extracted", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2,
  },
  extraction_failed: {
    label: "Failed", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle,
  },
  needs_review: {
    label: "Needs Review", color: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle,
  },
  approved: {
    label: "Approved", color: "bg-info/10 text-info border-info/20", icon: CheckCircle2,
  },
  invoice_generated: {
    label: "Invoiced", color: "bg-primary/10 text-primary border-primary/20", icon: Receipt,
  },
  invoiced: {
    label: "Invoiced", color: "bg-primary/10 text-primary border-primary/20", icon: Receipt,
  },
  rejected: {
    label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle,
  },
  archived: {
    label: "Archived", color: "bg-muted text-muted-foreground border-muted", icon: FileText,
  },
};

export const invoiceStatusConfig: Record<string, {
  label: string; color: string;
}> = {
  draft: {
    label: "Draft", color: "bg-muted text-muted-foreground border-muted",
  },
  pending_review: {
    label: "Pending Review", color: "bg-warning/10 text-warning border-warning/20",
  },
  approved: {
    label: "Approved", color: "bg-info/10 text-info border-info/20",
  },
  sent: {
    label: "Sent", color: "bg-primary/10 text-primary border-primary/20",
  },
  paid: {
    label: "Paid", color: "bg-success/10 text-success border-success/20",
  },
  partially_paid: {
    label: "Partially Paid", color: "bg-warning/10 text-warning border-warning/20",
  },
  overdue: {
    label: "Overdue", color: "bg-destructive/10 text-destructive border-destructive/20",
  },
  cancelled: {
    label: "Cancelled", color: "bg-muted text-muted-foreground border-muted",
  },
  disputed: {
    label: "Disputed", color: "bg-destructive/10 text-destructive border-destructive/20",
  },
};
