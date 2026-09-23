import {
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSidebarStore } from "@/features/dashboard/stores/sidebarStore";
import { useIsMobile } from "@/shared/hooks/useIsMobile";
import { UserProfileDropdown } from "./UserProfileDropdown";

type DashboardHeaderProps = {
  /** The page's name, resolved from `sidebarNav.ts` by DashboardLayout. */
  title: string;
};

/**
 * ponytail: the collapse toggle, the page title and the profile menu — nothing
 * else. Admin's header also carries global search, a keyboard-shortcut dialog
 * and a notification centre; none of those have a backing feature here, so
 * they stayed behind rather than arriving as dead chrome.
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
        <UserProfileDropdown />
      </div>
    </header>
  );
}
