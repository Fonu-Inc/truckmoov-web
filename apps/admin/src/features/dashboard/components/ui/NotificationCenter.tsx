import type { PlatformNotification } from "@/features/dashboard/utils/dummyNotifications";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Bell, CheckCheck, Trash2,
} from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";
import { auditEventHref } from "@/features/dashboard/utils/dummyNotifications";

type NotificationCenterProps = {
  notifications: PlatformNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
};

const SEVERITY_COLORS: Record<PlatformNotification["severity"], string> = {
  error: "bg-destructive/10 text-destructive border-destructive/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  success: "bg-success/10 text-success border-success/30",
  info: "bg-primary/10 text-primary border-primary/30",
};

const TYPE_ICONS: Record<PlatformNotification["type"], string> = {
  security: "🛡️",
  alert: "⚠️",
  payment: "💳",
  tenant_created: "🏢",
  device_provisioned: "📡",
  sim_activated: "📱",
  system: "ℹ️",
};

/**
 * The top-bar bell — fleetflow's `components/platform/NotificationCenter.tsx`.
 * State lives in `useRealtimeNotifications` (DashboardHeader), seeded from
 * fleetflow's platform-admin demo notifications until a real feed exists.
 */
export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
}: NotificationCenterProps) {
  return (
    <Popover>
      <TooltipWrapper content="Notifications">
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-background"
                aria-label={`${unreadCount} unread notifications`}
              />
            )}
          </Button>
        </PopoverTrigger>
      </TooltipWrapper>
      <PopoverContent
        className="w-96 p-0"
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {unreadCount}
                {" "}
                new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <TooltipWrapper content="Mark all as read">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onMarkAllAsRead}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
            <TooltipWrapper content="Clear all notifications">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClear}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0
            ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              )
            : (
                <div className="divide-y">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read ? "bg-muted/30" : ""
                      }`}
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <span className="text-lg">{TYPE_ICONS[notification.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{notification.title}</p>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${SEVERITY_COLORS[notification.severity]}`}>
                              {notification.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatRelative(notification.timestamp)}
                            </span>
                            {notification.type === "security" && (
                              <Link
                                to={auditEventHref(String(notification.metadata?.auditEventId ?? notification.id))}
                                className="ml-auto text-xs font-medium text-primary hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(notification.id);
                                }}
                              >
                                View audit event
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
