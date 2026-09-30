import type { InstallerNotification } from "@truckmoov/api/auth";
import {
  useInstallerNotifications,
  useMarkAllInstallerNotificationsRead,
  useMarkInstallerNotificationRead,
} from "@truckmoov/api/auth";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { useSidebarStore } from "@/features/dashboard/stores/sidebarStore";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/shared/hooks/useIsMobile";
import { UserProfileDropdown } from "./UserProfileDropdown";

type DashboardHeaderProps = {
  /** The page's name, resolved from `sidebarNav.ts` by DashboardLayout. */
  title: string;
};

/**
 * ponytail: the collapse toggle, the page title, the notification bell and the
 * profile menu. Admin's header also carries global search and a
 * keyboard-shortcut dialog; neither has a backing feature here, so they stayed
 * behind rather than arriving as dead chrome.
 */
export function DashboardHeader({ title }: DashboardHeaderProps) {
  const collapsed = useSidebarStore(s => s.collapsed);
  const toggle = useSidebarStore(s => s.toggle);
  const openMobile = useSidebarStore(s => s.openMobile);
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/98 px-4 md:px-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={isMobile ? openMobile : toggle}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={isMobile
            ? "Open menu"
            : collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {/* On mobile the drawer is either closed (this button opens it) or
              covers the header — so the icon is always "open" state. */}
          {isMobile || collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <h1 className="text-base font-semibold text-foreground ml-1 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <UserProfileDropdown />
      </div>
    </header>
  );
}

/** The five newest notifications (GET /auth/installer/notifications?limit=5). */
function NotificationBell() {
  const navigate = useNavigate();
  const [
    open,
    setOpen,
  ] = useState(false);
  const notifications = useInstallerNotifications(5);
  const markRead = useMarkInstallerNotificationRead();
  const markAllRead = useMarkAllInstallerNotificationsRead();
  const page = notifications.data?.data;
  const unread = page?.unreadCount ?? 0;

  function openNotification(n: InstallerNotification) {
    if (!n.read)
      markRead.mutate({ id: n.id });
    if (n.jobId) {
      setOpen(false);
      navigate(`/jobs/${n.jobId}`);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => markAllRead.mutate()}
              loading={markAllRead.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {page?.items.length
            ? page.items.map(n => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={cn(
                    "block w-full border-b px-4 py-3 text-left last:border-b-0 hover:bg-accent",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "truncate text-sm",
                      !n.read && "font-medium",
                    )}
                    >
                      {n.title}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                </button>
              ))
            : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {notifications.isLoading ? "Loading…" : "No notifications yet."}
                </p>
              )}
        </div>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            View all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
