import {
  Keyboard, PanelLeftClose, PanelLeftOpen, Search, X,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { useNavigate } from "react-router";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { ShortcutTooltip } from "@/components/shadcn/shortcut-tooltip";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useSidebarStore } from "@/features/dashboard/stores/sidebarStore";
import {
  getEntriesForRole, isNavGroup,
} from "@/features/dashboard/utils/sidebarNav";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  SHORTCUTS, useGlobalShortcuts,
} from "@/hooks/useKeyboardShortcuts";
import { NotificationCenter } from "./NotificationCenter";
import { UserProfileDropdown } from "./UserProfileDropdown";

type DashboardHeaderProps = {
  /** The page's name, resolved from `sidebarNav.ts` by DashboardLayout. */
  title: string;
  onRefresh?: () => void;
};

export function DashboardHeader({
  title, onRefresh,
}: DashboardHeaderProps) {
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
  const role = useAuthStore(s => s.user?.role);
  const navigate = useNavigate();

  // No page owns this box, so it searches the pages the signed-in role can open.
  const pages = useMemo(
    () => (role ? getEntriesForRole(role) : []).flatMap(e => (isNavGroup(e) ? e.items : [e])),
    [role],
  );
  const query = searchValue.trim().toLowerCase();
  const matches = query ? pages.filter(p => p.label.toLowerCase().includes(query)) : [];

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

  const goTo = (href: string) => {
    closeSearch();
    navigate(href);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/98 px-4 md:px-6 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-2">
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
        <h1 className="ml-1 truncate text-base font-semibold text-foreground">{title}</h1>
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
                    placeholder="Search pages..."
                    aria-label="Search pages"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape")
                        closeSearch();
                      else if (e.key === "Enter" && matches[0])
                        goTo(matches[0].href);
                    }}
                    className="w-64 h-8 bg-secondary/50 border-border/50 pl-8 pr-8 text-sm focus:bg-background focus:border-primary/50"
                  />
                  <button
                    onClick={closeSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Close search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {query && (
                    <ul className="absolute right-0 top-full z-50 mt-1 max-h-72 w-64 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
                      {matches.length === 0
                        ? <li className="px-2 py-1.5 text-sm text-muted-foreground">No matching pages</li>
                        : matches.map(p => (
                            <li key={p.href}>
                              <button
                                type="button"
                                onClick={() => goTo(p.href)}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                              >
                                <p.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{p.label}</span>
                              </button>
                            </li>
                          ))}
                    </ul>
                  )}
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

        <NotificationCenter />

        <UserProfileDropdown />
      </div>

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </header>
  );
}
