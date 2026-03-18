import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { siderbarList } from "@/shared/lib/sidebarListItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShortcutTooltip } from "@/components/ui/shortcut-tooltip";
import { formatShortcut, SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import { Keyboard, Search } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { NotificationCenter } from "@/components/platform/NotificationCenter";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { useAuthStore } from "@/stores/authStore";
import { SidebarListItem } from "../types";

function stripQuery(path: string | undefined) {
 return path ? path.split("?")[0] : "";
}

function findBestMatch(items: SidebarListItem[], pathname: string, parent?: SidebarListItem) {
 let best: { item: SidebarListItem; parent?: SidebarListItem } | undefined;

 for (const item of items) {
  const itemPath = stripQuery(item.to);
  const isPathMatch = pathname === itemPath || (itemPath !== "/" && pathname.startsWith(`${itemPath}/`));

  if (isPathMatch) {
   const currentBestPath = best ? stripQuery(best.item.to) : "";
   if (!best || itemPath.length > currentBestPath.length) {
    best = { item, parent };
   }
  }

  if (item.items?.length) {
   const nestedBest = findBestMatch(item.items, pathname, item);
   if (nestedBest) {
    const nestedPath = stripQuery(nestedBest.item.to);
    const currentBestPath = best ? stripQuery(best.item.to) : "";
    if (!best || nestedPath.length > currentBestPath.length) {
     best = nestedBest;
    }
   }
  }
 }

 return best;
}

export default function MainHeader() {
   const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useRealtimeNotifications();
  const {user} = useAuthStore()

 const location = useLocation();
 const matchedRoute = findBestMatch(siderbarList(user.role), location.pathname);
 const pageTitle = matchedRoute?.item.pageTitle ?? matchedRoute?.parent?.pageTitle;
 const pageDescription = matchedRoute?.item.pageDescription ?? matchedRoute?.parent?.pageDescription;

 const searchInputRef = useRef<HTMLInputElement>(null);
 const [searchValue, setSearchValue] = useState("");

 const openShortcutsDialog = () => {
  // Trigger the keyboard shortcut to open the dialog
  const event = new KeyboardEvent("keydown", {
   key: "?",
   shiftKey: true,
   bubbles: true,
  });
  window.dispatchEvent(event);
 };

 return (
  <header className="flex py-2.5 items-center gap-2 justify-between border-b border-border bg-background px-6 backdrop-blur-xs">
   <div className="w-full">
    {pageTitle && <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>}
    {pageDescription && <p className="text-xs text-muted-foreground truncate text-ellipsis">{pageDescription}</p>}
   </div>

   <div className="flex items-center gap-2">
    {/* Search */}
    <ShortcutTooltip content="Search" shortcut={SHORTCUTS.search.display()}>
     <div className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
       ref={searchInputRef}
       placeholder="Search..."
       value={searchValue}
       onChange={(e) => setSearchValue(e.target.value)}
       className="w-56 h-9 bg-secondary/50 border-border/50 pl-9 pr-10 text-sm focus:bg-background focus:border-primary/50"
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
       {SHORTCUTS.search.display()}
      </kbd>
     </div>
    </ShortcutTooltip>

    {/* Keyboard Shortcuts Help */}
    <ShortcutTooltip content="Keyboard shortcuts" shortcut={formatShortcut("?", { shift: true })}>
     <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 hidden md:flex text-muted-foreground hover:text-foreground"
      onClick={openShortcutsDialog}
     >
      <Keyboard className="h-4 w-4" />
     </Button>
    </ShortcutTooltip>

    {/* Theme Toggle */}
    <ThemeToggle />

    {/* Notifications */}
    <NotificationCenter
     notifications={notifications}
     unreadCount={unreadCount}
     onMarkAsRead={markAsRead}
     onMarkAllAsRead={markAllAsRead}
     onClear={clearNotifications}
    />

    {/* User Profile Dropdown */}
    <UserProfileDropdown />
   </div>
  </header>
 )
}
