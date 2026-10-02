import { cn } from "@/lib/utils";
import type { MessagingConnection } from "../useMessagingSocket";

const COPY: Record<MessagingConnection, { label: string; tone: string }> = {
  connecting: { label: "Connecting...", tone: "bg-warning" },
  connected: { label: "Connected", tone: "bg-success" },
  reconnecting: { label: "Reconnecting...", tone: "bg-warning" },
  offline: { label: "Offline", tone: "bg-destructive" },
  unauthenticated: { label: "Signed out", tone: "bg-destructive" },
  forbidden: { label: "No access", tone: "bg-destructive" },
};

export function connectionHint(state: MessagingConnection): string | null {
  switch (state) {
    case "connected": return null;
    case "unauthenticated": return "Your session has ended. Sign in again to get live updates.";
    case "forbidden": return "You do not have access to live messaging.";
    case "offline": return "Live updates are off. You can read what has loaded, but you cannot reply.";
    default: return "Live updates are paused while we reconnect. You cannot reply until then.";
  }
}

export function ConnectionStatus({ state }: { state: MessagingConnection }) {
  const { label, tone } = COPY[state];
  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 text-xs text-muted-foreground"
    >
      <span className={cn("h-2 w-2 rounded-full", tone)} />
      {label}
    </span>
  );
}
