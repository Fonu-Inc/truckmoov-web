import {
  Keyboard,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { ShortcutTooltip } from "@/components/shadcn/shortcut-tooltip";
import { useRealtimeNotifications } from "@/features/dashboard/hooks/useRealtimeNotifications";
import { useSidebarStore } from "@/features/dashboard/stores/sidebarStore";
import {
  SHORTCUTS,
  useGlobalShortcuts,
} from "@/hooks/useKeyboardShortcuts";
import { useIsMobile } from "@/shared/hooks/useIsMobile";
import { NotificationCenter } from "./NotificationCenter";
import { UserProfileDropdown } from "./UserProfileDropdown";

type DashboardHeaderProps = { onRefresh?: () => void };

/**
 * The top bar. No page title here — fleetflow moved it into the content area
 * (`shared/components/layout/PageTitle.tsx`), rendered by DashboardLayout.
 */
export function DashboardHeader({ onRefresh }: DashboardHeaderProps = {}) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useRealtimeNotifications();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [
    searchValue,
    setSearchValue,
  ] = useState("");
  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);
  const [
    shortcutsOpen,
    setShortcutsOpen,
  ] = useState(false);
  const collapsed = useSidebarStore(s => s.collapsed);
  const toggle = useSidebarStore(s => s.toggle);
  const openMobile = useSidebarStore(s => s.openMobile);
  const isMobile = useIsMobile();

  useGlobalShortcuts({
    onSearch: () => {
      setSearchOpen(true);
      setTimeout(
        () => searchInputRef.current?.focus(),
        50,
      );
    },
    onRefresh,
  });

  useEffect(
    () => {
      if (searchOpen)
        searchInputRef.current?.focus();
    },
    [searchOpen],
  );

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchValue("");
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/98 px-6 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={isMobile ? openMobile : toggle}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={isMobile
            ? "Open menu"
            : collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {/* On mobile the drawer is either closed (this button opens it) or
              covers the header — so the icon is always "open" state.
              ponytail: reuse the desktop icon per user instruction; no
              separate hamburger. */}
          {isMobile || collapsed
            ? (
                <PanelLeftOpen className="h-4 w-4" />
              )
            : (
                <PanelLeftClose className="h-4 w-4" />
              )}
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Dynamic Search */}
        <div className="hidden md:flex items-center">
          {searchOpen
            ? (
                <div className="relative animate-in fade-in slide-in-from-right-2 duration-150">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search..."
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    onKeyDown={e => e.key === "Escape" && closeSearch()}
                    className="w-64 h-8 bg-secondary/50 border-border/50 pl-8 pr-8 text-sm focus:bg-background focus:border-primary/50"
                  />
                  <button
                    onClick={closeSearch}
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
                  shortcut={SHORTCUTS.search.display()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </ShortcutTooltip>
              )}
        </div>

        <ShortcutTooltip
          content="Keyboard shortcuts"
          shortcut="Shift + ?"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </ShortcutTooltip>

        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClear={clearNotifications}
        />

        <UserProfileDropdown />
      </div>

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </header>
  );
}
