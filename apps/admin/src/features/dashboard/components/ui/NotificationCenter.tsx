import { Bell } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";

/**
 * The top-bar bell.
 *
 * There is no notification feed yet — the previous version rendered
 * `lib/dummyNotifications.ts` through `useRealtimeNotifications`, so every user
 * saw the same invented alerts with invented timestamps. Showing nothing is the
 * honest state until a real feed exists.
 *
 * ponytail: no props and no state. Mark-all-read, clear-all, the unread dot, the
 * severity/type icon maps and the scroll area all went with the fake data —
 * there is nothing to read, clear or scroll. They come back with the feed.
 */
export function NotificationCenter() {
  return (
    <Popover>
      <TooltipWrapper content="Notifications">
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </TooltipWrapper>
      <PopoverContent
        className="w-80 p-0"
        align="end"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Notifications</span>
        </div>
        <div className="px-6 py-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/50">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">You're all caught up</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Platform alerts about tenants, devices and billing will show up here.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
