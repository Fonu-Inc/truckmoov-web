import type { MessagingConnection } from "../useMessagingSocket";
import { cn } from "@/lib/utils";

const COPY: Record<MessagingConnection, {
  label: string; tone: string;
}> = {
  connecting: {
    label: "Connecting...", tone: "bg-warning",
  },
  connected: {
    label: "Connected", tone: "bg-success",
  },
  reconnecting: {
    label: "Reconnecting...", tone: "bg-warning",
  },
  offline: {
    label: "Offline", tone: "bg-destructive",
  },
  unauthenticated: {
    label: "Signed out", tone: "bg-destructive",
  },
  forbidden: {
    label: "No access", tone: "bg-destructive",
  },
};

export function ConnectionStatus({ state }: { state: MessagingConnection }) {
  const {
    label, tone,
  } = COPY[state];
  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 text-xs text-muted-foreground"
    >
      <span className={cn(
        "h-2 w-2 rounded-full",
        tone,
      )}
      />
      {label}
    </span>
  );
}
