import type { ReactNode } from "react";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";

type GateQuery = {
  isPending: boolean;
  error: { message: string } | null;
  refetch: () => unknown;
};

/**
 * Gates one section on one query: skeleton while pending, error + retry on
 * failure. Wrap only the part that uses the query so the rest of the page
 * renders immediately.
 */
export function ReportsGate({
  query, children, skeleton,
}: {
  query: GateQuery; children: ReactNode; skeleton?: ReactNode;
}) {
  if (query.isPending) {
    return (
      <div aria-label="Loading reports">
        {skeleton ?? <Skeleton className="h-64 w-full" />}
      </div>
    );
  }
  if (query.error) {
    return (
      <div
        role="alert"
        className="py-8 text-center"
      >
        <p>
          Unable to load reports:
          {" "}
          {query.error.message}
        </p>
        <Button
          variant="link"
          onClick={() => void query.refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
