import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
  loading?: boolean;
};

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "default",
  className,
  loading = false,
}: StatCardProps) {
  const variantStyles = {
    default: "border-border hover:border-primary/40",
    success: "border-success/20 hover:border-success/40",
    warning: "border-warning/20 hover:border-warning/40",
    danger: "border-destructive/20 hover:border-destructive/40",
  };

  const iconBgStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card p-4 transition-all duration-200 shadow-enterprise hover:shadow-enterprise-md",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "rounded-lg p-2.5 shrink-0",
          iconBgStyles[variant],
        )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground break-words">{title}</p>
          {loading
            ? <Skeleton className="h-8 w-24" />
            : <p className="text-xl font-bold tracking-tight text-foreground break-words">{value}</p>}
          {change !== undefined && !loading && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                  change >= 0
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {change >= 0 ? "+" : ""}
                {change}
                %
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
