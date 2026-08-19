import type {
  SidebarConfig,
  SidebarNavGroup,
  SidebarNavItem,
} from "@/lib/sidebarConfig";
import {
  ChevronDown,
  Headphones,
  LogOut,
  Truck,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  NavLink,
  useLocation,
} from "react-router-dom";
import mtnLogoDark from "@/assets/mtn-logo-dark.svg";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";
import { useTenantBrandingContext } from "@/contexts/TenantBrandingContext";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import {
  getSidebarConfig,
  isNavGroup,

} from "@/lib/sidebarConfig";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSidebarStore } from "@/stores/sidebarStore";

export function DashboardSidebar() {
  const logout = useAuthStore(state => state.logout);
  const location = useLocation();
  const { collapsed } = useSidebarStore();
  const [
    expandedGroups,
    setExpandedGroups,
  ] = useState<Set<string>>(new Set());
  const {
    unreadCount,
    clearUnread,
  } = useRealtimeMessages();
  const jobOfferCount = 0;
  const { logoUrl } = useTenantBrandingContext();

  // ── Centralized sidebar resolution ──
  const sidebarConfig: SidebarConfig = useMemo(
    () => getSidebarConfig(),
    [],
  );

  // Onboarding sidebar group fully removed — no gating computed here.

  // Apply unread badge counts
  const navItems = useMemo(
    () => {
      const resolveBadge = (badgeKey?: string, existingBadge?: number) => {
        if (badgeKey === "messages")
          return unreadCount || undefined;
        if (badgeKey === "jobOffers")
          return jobOfferCount || undefined;
        return existingBadge;
      };

      const baseEntries = sidebarConfig.entries.map((entry) => {
        if (isNavGroup(entry)) {
          return {
            ...entry,
            badge: resolveBadge(entry.badgeKey),
          };
        }
        return {
          ...entry,
          badge: resolveBadge(
            entry.badgeKey,
            entry.badge,
          ),
        };
      });

      // "Get Started" sidebar group intentionally removed.
      return baseEntries;
    },
    [
      sidebarConfig,
      unreadCount,
      jobOfferCount,
    ],
  );

  // Auto-expand group if current route is in it
  useEffect(
    () => {
      navItems.forEach((entry) => {
        if (isNavGroup(entry)) {
          const isChildActive = entry.items.some(
            item => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`),
          );
          if (isChildActive && !expandedGroups.has(entry.label)) {
            setExpandedGroups(prev => new Set([
              ...prev,
              entry.label,
            ]));
          }
        }
      });
    },
    [
      location.pathname,
      navItems,
    ],
  );

  // Clear unread when viewing messages
  const isMessagesRoute = location.pathname.includes("/messages") || location.pathname.includes("/inbox");
  if (isMessagesRoute && unreadCount > 0) {
    clearUnread();
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      }
      else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderNavItem = (item: SidebarNavItem, isNested = false) => {
    const isActive = location.pathname === item.href;
    const navContent = (
      <NavLink
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
          isNested && "pl-10",
          isActive
            ? "bg-primary/10 text-primary border-l-2 border-primary ml-0 pl-[10px]"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isNested && isActive && "pl-[38px]",
        )}
      >
        <item.icon className={cn(
          "h-[18px] w-[18px] shrink-0",
          isActive && "text-primary",
        )}
        />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );

    return collapsed
      ? (
          <TooltipWrapper
            key={item.href}
            content={item.label}
            side="right"
          >
            {navContent}
          </TooltipWrapper>
        )
      : (
          <div key={item.href}>{navContent}</div>
        );
  };

  const renderNavGroup = (group: SidebarNavGroup & { badge?: number }) => {
    const isExpanded = expandedGroups.has(group.label);
    const isChildActive = group.items.some(
      item => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`),
    );

    if (collapsed) {
      return (
        <TooltipWrapper
          key={group.label}
          content={group.label}
          side="right"
        >
          <NavLink
            to={group.items[0]?.href || "#"}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
              isChildActive
                ? "bg-primary/10 text-primary border-l-2 border-primary ml-0 pl-[10px]"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <group.icon className={cn(
              "h-[18px] w-[18px] shrink-0",
              isChildActive && "text-primary",
            )}
            />
          </NavLink>
        </TooltipWrapper>
      );
    }

    return (
      <Collapsible
        key={group.label}
        open={isExpanded}
        onOpenChange={() => toggleGroup(group.label)}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
              isChildActive
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <group.icon className={cn(
              "h-[18px] w-[18px] shrink-0",
              isChildActive && "text-primary",
            )}
            />
            <span className="flex-1 text-left">{group.label}</span>
            {group.badge && group.badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {group.badge}
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-0.5 pt-1">
          {group.items.map(item => renderNavItem(
            item,
            true,
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // ── Org type label for the badge ──
  const orgLabel = sidebarConfig.orgTypeLabel;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo Header */}
      <div className="flex min-h-16 items-center border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary shadow-mtn">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold text-sidebar-foreground truncate leading-tight">
                FleetPro
                {" "}
                <span className="text-primary">Enterprise</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                  Powered by
                </span>
                <img
                  src={mtnLogoDark}
                  alt="MTN"
                  className="h-3.5 w-auto dark:brightness-0 dark:invert"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Org Badge — dynamic logo or dummy enterprise icon */}
      {logoUrl && !collapsed && (
        <div className="mx-3 mt-3 flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5">
          <img
            src={logoUrl}
            alt="Platform"
            className="h-10 w-10 shrink-0 rounded-full object-cover bg-background ring-2 ring-primary/60"
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Platform</p>
            <p className="truncate text-[10px] font-medium text-primary uppercase tracking-wide">{orgLabel}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map((entry) => {
          if (isNavGroup(entry)) {
            return renderNavGroup(entry as SidebarNavGroup & { badge?: number });
          }
          return renderNavItem(entry as SidebarNavItem);
        })}
      </nav>

      {/* Footer Section (user moved to top bar) */}
      <div className="border-t border-sidebar-border p-3">
        <div className="space-y-0.5">
          {collapsed
            ? (
                <TooltipWrapper
                  content="Support & Incident"
                  side="right"
                >
                  <NavLink
                    to="/support"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <Headphones className="h-[18px] w-[18px]" />
                  </NavLink>
                </TooltipWrapper>
              )
            : (
                <NavLink
                  to="/support"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <Headphones className="h-[18px] w-[18px]" />
                  <span>Support & Incident</span>
                </NavLink>
              )}
          {collapsed
            ? (
                <TooltipWrapper
                  content="Sign Out"
                  side="right"
                >
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </TooltipWrapper>
              )
            : (
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  <span>Sign Out</span>
                </button>
              )}
        </div>
      </div>
    </aside>
  );
}
