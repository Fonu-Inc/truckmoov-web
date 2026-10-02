import type { ReactNode } from "react";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";

type WidgetBodyProps = {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty?: boolean;
  emptyMessage?: string;
  skeletonClassName?: string;
  children: ReactNode;
};

export function WidgetBody({
  isLoading,
  isError,
  onRetry,
  isEmpty = false,
  emptyMessage = "Nothing to show yet.",
  skeletonClassName = "h-48 w-full",
  children,
}: WidgetBodyProps) {
  if (isLoading) {
    return <Skeleton className={skeletonClassName} />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm text-muted-foreground">
        <span>Could not load this data.</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (isEmpty) {
    return <div className="rounded-lg border p-3 text-sm text-muted-foreground">{emptyMessage}</div>;
  }

  return children;
}
