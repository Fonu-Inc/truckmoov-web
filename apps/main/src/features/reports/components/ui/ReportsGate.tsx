import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/shadcn/button";

type GateQuery = {
  isPending: boolean;
  error: { message: string } | null;
  refetch: () => unknown;
};

export function ReportsGate({
  query, children,
}: {
  query: GateQuery; children: ReactNode;
}) {
  if (query.isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2
          aria-label="Loading reports"
          className="h-8 w-8 animate-spin text-muted-foreground"
        />
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
