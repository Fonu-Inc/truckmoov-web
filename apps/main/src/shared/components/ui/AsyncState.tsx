import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";

// ponytail: one primitive for loading / error / empty. Replaces 20+ inline ternaries
// across the fleet/drivers/devices pre-wire. Retry uses `Button variant="link"` per
// docs/design.md § "Every table gets the three states".
type Props<T> = {
  query: UseQueryResult<T>;
  /** Override the default single-row Skeleton. */
  skeleton?: ReactNode;
  /** Override the default "No data yet." line. */
  empty?: ReactNode;
  /** Return true when a successful response should render the empty state (e.g. empty array). */
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
};

export function AsyncState<T>({
  query, skeleton, empty, isEmpty, children,
}: Props<T>) {
  if (query.isLoading)
    return skeleton ?? <Skeleton className="h-16 w-full" />;

  if (query.isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Couldn&apos;t load.</span>
        <Button
          variant="link"
          size="sm"
          onClick={() => query.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (query.data === undefined || query.data === null || isEmpty?.(query.data))
    return empty ?? <p className="text-sm text-muted-foreground">No data yet.</p>;

  return <>{children(query.data)}</>;
}
