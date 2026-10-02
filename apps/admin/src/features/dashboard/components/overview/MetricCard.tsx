import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { UNAVAILABLE } from "./overviewFormat";

type MetricCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
  tileClassName: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  badge?: ReactNode;
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  tileClassName,
  isLoading,
  isError,
  onRetry,
  badge,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${tileClassName}`}>
            <Icon className={`h-6 w-6 ${iconClassName}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? <Skeleton className="mt-1 h-8 w-24" /> : <p className="text-2xl font-bold">{isError ? UNAVAILABLE : value}</p>}
            <div className="flex items-center gap-2 mt-1">
              {isError && !isLoading
                ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={onRetry}
                    >
                      Retry
                    </Button>
                  )
                : badge}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
