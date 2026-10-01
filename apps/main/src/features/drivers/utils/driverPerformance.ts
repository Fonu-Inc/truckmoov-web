export function getPerformanceBand(score: number): {
  label: string; className: string;
} {
  if (score >= 85) {
    return {
      label: "Excellent", className: "bg-success/15 text-success border-success/30",
    };
  }
  if (score >= 70) {
    return {
      label: "Strong", className: "bg-primary/15 text-primary border-primary/30",
    };
  }
  if (score >= 50) {
    return {
      label: "Fair", className: "bg-warning/15 text-warning border-warning/30",
    };
  }
  return {
    label: "Needs review", className: "bg-destructive/15 text-destructive border-destructive/30",
  };
}
