export const statusStyles: Record<string, {
  label: string; className: string;
}> = {
  open: {
    label: "Open", className: "bg-primary/10 text-primary",
  },
  in_progress: {
    label: "In Progress", className: "bg-chart-2/10 text-chart-2",
  },
  waiting_on_tenant: {
    label: "Waiting on Tenant", className: "bg-chart-5/10 text-chart-5",
  },
  escalated: {
    label: "Escalated", className: "bg-destructive/10 text-destructive",
  },
  resolved: {
    label: "Resolved", className: "bg-accent/10 text-accent",
  },
  closed: {
    label: "Closed", className: "bg-muted text-muted-foreground",
  },
};

export const priorityStyles: Record<string, {
  label: string; className: string;
}> = {
  low: {
    label: "Low", className: "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Medium", className: "bg-primary/10 text-primary",
  },
  high: {
    label: "High", className: "bg-chart-5/10 text-chart-5",
  },
  critical: {
    label: "Critical", className: "bg-destructive/10 text-destructive",
  },
};
