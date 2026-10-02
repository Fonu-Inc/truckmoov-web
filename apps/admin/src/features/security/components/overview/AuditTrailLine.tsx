import { useQuery } from "@tanstack/react-query";
import { getSystemAuditLogVerifyQueryOptions } from "@truckmoov/api/auth";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";

export function AuditTrailLine() {
  const { data, isPending, isError, refetch } = useQuery(getSystemAuditLogVerifyQueryOptions());
  if (isPending)
    return <Skeleton className="h-5 w-48" />;
  if (isError) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        Couldn't check the audit trail.
        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void refetch()}>Try again</Button>
      </p>
    );
  }
  if (data.data.intact) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
        Audit trail verified
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm text-destructive">
      <ShieldAlert className="h-4 w-4" aria-hidden />
      Audit trail could not be verified, contact engineering
    </p>
  );
}
