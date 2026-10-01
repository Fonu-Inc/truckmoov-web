import type { InstallerNotification } from "@truckmoov/api/auth";
import {
  useInstallerNotifications,
  useMarkAllInstallerNotificationsRead,
  useMarkInstallerNotificationRead,
} from "@truckmoov/api/auth";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Bell,
  Keyboard,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { ShortcutTooltip } from "@/components/shadcn/shortcut-tooltip";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useSidebarStore } from "@/features/dashboard/stores/sidebarStore";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/shared/hooks/useIsMobile";
import { UserProfileDropdown } from "./UserProfileDropdown";

type DashboardHeaderProps = {
  /** The page's name, resolved from `sidebarNav.ts` by DashboardLayout. */
  title: string;
};

/**
 * The collapse toggle, the page title, job search, the shortcut sheet, the
 * notification bell and the profile menu — the appdemo installer header.
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
        <HeaderSearch />
        <ShortcutsButton />
        <NotificationBell />
        <UserProfileDropdown />
      </div>
    </header>
  );
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  return t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
}

/**
 * ponytail: jobs are the only searchable thing in this portal, so Enter hands
 * the query to /jobs (JobsPage seeds its search box from `?search=`).
 */
function HeaderSearch() {
  const navigate = useNavigate();
  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    value,
    setValue,
  ] = useState("");

  useEffect(
    () => {
      const onKey = (e: KeyboardEvent) => {
        if (isTyping(e))
          return;
        if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || e.key === "/") {
          e.preventDefault();
          setOpen(true);
        }
      };
      window.addEventListener(
        "keydown",
        onKey,
      );
      return () => window.removeEventListener(
        "keydown",
        onKey,
      );
    },
    [],
  );

  const close = () => {
    setOpen(false);
    setValue("");
  };

  return (
    <div className="hidden md:flex items-center">
      {open
        ? (
            <div className="relative animate-in fade-in slide-in-from-right-2 duration-150">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search jobs..."
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape")
                    close();
                  if (e.key === "Enter" && value.trim()) {
                    navigate(`/jobs?search=${encodeURIComponent(value.trim())}`);
                    close();
                  }
                }}
                className="w-64 h-8 bg-secondary/50 border-border/50 pl-8 pr-8 text-sm focus:bg-background focus:border-primary/50"
              />
              <button
                onClick={close}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Close search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        : (
            <ShortcutTooltip
              content="Search"
              shortcut="Ctrl+K"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(true)}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </ShortcutTooltip>
          )}
    </div>
  );
}

const SHORTCUTS = [
  [
    "Ctrl+K",
    "Search jobs",
  ],
  [
    "/",
    "Search jobs",
  ],
  [
    "Esc",
    "Close dialog / Cancel",
  ],
  [
    "Shift+?",
    "Show keyboard shortcuts",
  ],
] as const;

function ShortcutsButton() {
  const [
    open,
    setOpen,
  ] = useState(false);

  useEffect(
    () => {
      const onKey = (e: KeyboardEvent) => {
        if (!isTyping(e) && e.shiftKey && e.key === "?") {
          e.preventDefault();
          setOpen(true);
        }
      };
      window.addEventListener(
        "keydown",
        onKey,
      );
      return () => window.removeEventListener(
        "keydown",
        onKey,
      );
    },
    [],
  );

  return (
    <>
      <ShortcutTooltip
        content="Keyboard shortcuts"
        shortcut="Shift + ?"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </ShortcutTooltip>
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Use these shortcuts to navigate faster</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {SHORTCUTS.map(([
              keys,
              label,
            ]) => (
              <div
                key={keys}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-sm">{label}</span>
                <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center gap-1 rounded border border-border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
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
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={unread ? `Installer notifications, ${unread} unread` : "Installer notifications"}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />}
        </Button>
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
          <QueryState
            query={notifications}
            isEmpty={!page?.items.length}
            empty="No notifications yet."
            errorMessage="Unable to load notifications."
            skeleton={(
              <div className="space-y-2 p-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}
          >
            {page?.items.map(n => (
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
                <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
              </button>
            ))}
          </QueryState>
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
