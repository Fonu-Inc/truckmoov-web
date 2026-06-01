import { Search, X, PanelLeftClose, PanelLeftOpen, Settings as SettingsIcon, Keyboard } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { Button } from "@/components/shadcn/button";
import { NotificationCenter } from "@/components/platform/NotificationCenter";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { OrgSwitcher } from "./OrgSwitcher";
import { ShortcutTooltip } from "@/components/shadcn/shortcut-tooltip";
import { SHORTCUTS, useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, readDemoStakeholder } from "@/stores/authStore";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useActiveOrgStore } from "@/stores/activeOrgStore";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { getSidebarConfig, isNavGroup } from "@/lib/sidebarConfig";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function DashboardHeader({ title, onRefresh }: DashboardHeaderProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useRealtimeNotifications();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { collapsed, toggle } = useSidebarStore();
  const navigate = useNavigate();

  // ── Sync top-bar title with the active sidebar entry's label ──
  const location = useLocation();
  const { user } = useAuthStore();
  const orgCtx = useOrgContext();
  const { resolveActiveOrg } = useActiveOrgStore();
  const activeOrg = resolveActiveOrg(orgCtx.memberships);
  const { enabled: flagEnabled } = useFeatureFlag(
    "enable_multi_stakeholder_model",
    user?.tenantId
  );
  const demoStakeholder = readDemoStakeholder();
  const multiStakeholderEnabled = flagEnabled || !!demoStakeholder;

  const sidebarTitle = useMemo(() => {
    const config = getSidebarConfig(user, activeOrg, multiStakeholderEnabled);
    const path = location.pathname;
    // Find the deepest matching entry (prefer exact, then longest-prefix)
    let best: { label: string; len: number } | null = null;
    const consider = (label: string, href: string) => {
      if (path === href || path.startsWith(href + "/")) {
        if (!best || href.length > best.len) best = { label, len: href.length };
      }
    };
    for (const entry of config.entries) {
      if (isNavGroup(entry)) {
        for (const child of entry.items) consider(child.label, child.href);
      } else {
        consider(entry.label, entry.href);
      }
    }
    return best?.label ?? title;
  }, [user, activeOrg, multiStakeholderEnabled, location.pathname, title]);

  useGlobalShortcuts({
    onSearch: () => {
      setSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    },
    onRefresh: onRefresh,
  });

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchValue("");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/98 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
        <h1 className="text-base font-semibold text-foreground ml-1">{sidebarTitle}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        <OrgSwitcher />

        {/* Dynamic Search */}
        <div className="hidden md:flex items-center">
          {searchOpen ? (
            <div className="relative animate-in fade-in slide-in-from-right-2 duration-150">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
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
          ) : (
            <ShortcutTooltip content="Search" shortcut={SHORTCUTS.search.display()}>
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

        <ShortcutTooltip content="Keyboard shortcuts" shortcut="Shift + ?">
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

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </header>
  );
}



