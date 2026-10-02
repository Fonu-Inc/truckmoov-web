import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useMessagingAccess } from "../useMessagingAccess";
import { StateNotice } from "./StateNotice";

type Props = {
  what: string;
  children: (access: { canManage: boolean }) => ReactNode;
};

/** Shows `children` only to staff who hold the messaging read permission. */
export function MessagingAccessGate({ what, children }: Props) {
  const access = useMessagingAccess();

  if (access.isLoading)
    return <Skeleton className="h-64 w-full" aria-label="Loading" />;
  if (access.isError) {
    return (
      <StateNotice
        title="Could not check your access."
        body="Check your connection and try again."
        actionLabel="Retry"
        onAction={() => void access.refetch()}
      />
    );
  }
  if (!access.canRead) {
    return (
      <StateNotice
        icon={<ShieldAlert className="h-10 w-10 text-muted-foreground/50" />}
        title={`You do not have access to ${what}.`}
        body="Ask an administrator to give you messaging access."
      />
    );
  }
  return <>{children({ canManage: access.canManage })}</>;
}
