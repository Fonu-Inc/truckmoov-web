import type { ReactNode } from "react";
import type { useReportsData } from "../../hooks/useReportsData";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/shadcn/button";

export function ReportsGate({
  data, children,
}: {
  data: ReturnType<typeof useReportsData>; children: ReactNode;
}) {
  if (data.isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2
          aria-label="Loading reports"
          className="h-8 w-8 animate-spin text-muted-foreground"
        />
      </div>
    );
  }
  if (data.error) {
    return (
      <div
        role="alert"
        className="py-8 text-center"
      >
        <p>
          Unable to load reports:
          {data.error.message}
        </p>
        <Button
          variant="link"
          onClick={data.refetch}
        >
          Try again
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
