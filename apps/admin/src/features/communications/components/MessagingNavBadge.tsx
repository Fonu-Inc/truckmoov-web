import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { capabilitiesOptions } from "../messagingQueries";
import { useUnreadSummary } from "../useUnreadSummary";

/** The unread count on the Messaging Center nav row. Shows nothing at zero. */
export function MessagingNavBadge({ collapsed }: { collapsed: boolean }) {
  const permissions = useQuery(capabilitiesOptions()).data?.permissions;
  const summary = useUnreadSummary(permissions);
  const count = summary?.conversations ?? 0;
  if (count === 0)
    return null;
  const label = summary?.at_least ? `${count}+` : String(count);
  return (
    <span
      aria-label={`${label} conversations with unread messages`}
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground",
        collapsed && "absolute right-1 top-1",
      )}
    >
      {label}
    </span>
  );
}
