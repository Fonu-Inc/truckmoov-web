import type { ReactNode } from "react";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";

type QueryLike = {
  isLoading: boolean;
  isError: boolean;
  error?: { message?: string } | null;
  refetch: () => unknown;
};

/**
 * Loading / error / empty for anything that is not a table (tables get the
 * same three states from `DataTable`). Children render only once data is in.
 */
export function QueryState({
  query, isEmpty = false, empty, hint, skeleton, errorMessage = "Something went wrong.", children,
}: {
  query: QueryLike;
  isEmpty?: boolean;
  empty?: ReactNode;
  hint?: ReactNode;
  skeleton?: ReactNode;
  errorMessage?: string;
  children: ReactNode;
}) {
  if (query.isLoading)
    return <>{skeleton ?? <Skeleton className="h-24 w-full rounded-xl" />}</>;

  if (query.isError) {
    return (
      <div className="py-6 text-center text-sm">
        <p className="text-destructive">{query.error?.message || errorMessage}</p>
        <Button
          variant="link"
          className="mt-1"
          onClick={() => query.refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">{empty}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }

  return <>{children}</>;
}
