import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useJobOfferNotifications } from "@/hooks/useJobOfferNotifications";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useActiveOrgStore } from "@/stores/activeOrgStore";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useTenantBrandingContext } from "@/contexts/TenantBrandingContext";
import {
  getSidebarConfig,
  isNavGroup,
  type SidebarNavItem,
  type SidebarNavGroup,
  type SidebarConfig,
} from "@/lib/sidebarConfig";
import { toStakeholderType } from "@/features/auth/lib/roleUtils";
import {
  Truck,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function DashboardSidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { unreadCount, clearUnread } = useRealtimeMessages();
  const { pendingCount: jobOfferCount } = useJobOfferNotifications();
  const { logoUrl } = useTenantBrandingContext();

  const orgCtx = useOrgContext();
  const { resolveActiveOrg } = useActiveOrgStore();
  const activeOrg = resolveActiveOrg(orgCtx.memberships);

  const { enabled: flagEnabled } = useFeatureFlag('enable_multi_stakeholder_model', user?.tenantId);
  const roleStakeholder = toStakeholderType(user?.role);
  const multiStakeholderEnabled = flagEnabled || !!roleStakeholder;

  // ── Centralized sidebar resolution ──
  const sidebarConfig: SidebarConfig = useMemo(
    () => getSidebarConfig(user, activeOrg, multiStakeholderEnabled),
    [user, activeOrg, multiStakeholderEnabled]
  );

  // Apply unread badge counts
  const navItems = useMemo(() => {
    const resolveBadge = (badgeKey?: string, existingBadge?: number) => {
      if (badgeKey === "messages") return unreadCount || undefined;
      if (badgeKey === "jobOffers") return jobOfferCount || undefined;
      return existingBadge;
    };

    return sidebarConfig.entries.map((entry) => {
      if (isNavGroup(entry)) {
        return {
          ...entry,
          badge: resolveBadge(entry.badgeKey),
        };
      }
      return {
        ...entry,
        badge: resolveBadge(entry.badgeKey, entry.badge),
      };
    });
  }, [sidebarConfig, unreadCount, jobOfferCount]);

  // Auto-expand group if current route is in it
  useMemo(() => {
    navItems.forEach((entry) => {
      if (isNavGroup(entry)) {
        const isChildActive = entry.items.some(
          (item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
        );
        if (isChildActive && !expandedGroups.has(entry.label)) {
          setExpandedGroups((prev) => new Set([...prev, entry.label]));
        }
      }
    });
  }, [location.pathname, navItems]);

  // Clear unread when viewing messages
  const isMessagesRoute = location.pathname.includes('/messages') || location.pathname.includes('/inbox');
  if (isMessagesRoute && unreadCount > 0) {
    clearUnread();
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
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
          isNested && isActive && "pl-[38px]"
        )}
      >
        <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary")} />
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

    return collapsed ? (
      <TooltipWrapper key={item.href} content={item.label} side="right">
        {navContent}
      </TooltipWrapper>
    ) : (
      <div key={item.href}>{navContent}</div>
    );
  };

  const renderNavGroup = (group: SidebarNavGroup & { badge?: number }) => {
    const isExpanded = expandedGroups.has(group.label);
    const isChildActive = group.items.some(
      (item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
    );

    if (collapsed) {
      return (
        <TooltipWrapper key={group.label} content={group.label} side="right">
          <NavLink
            to={group.items[0]?.href || '#'}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
              isChildActive
                ? "bg-primary/10 text-primary border-l-2 border-primary ml-0 pl-[10px]"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <group.icon className={cn("h-[18px] w-[18px] shrink-0", isChildActive && "text-primary")} />
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
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <group.icon className={cn("h-[18px] w-[18px] shrink-0", isChildActive && "text-primary")} />
            <span className="flex-1 text-left">{group.label}</span>
            {group.badge && group.badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {group.badge}
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-0.5 pt-1">
          {group.items.map((item) => renderNavItem(item, true))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // ── Org type label for the badge ──
  const orgLabel = sidebarConfig.orgTypeLabel;
  const orgName = activeOrg?.orgName;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-mtn">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">Truckmoov</span>
              <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                {orgLabel}
              </span>
            </div>
          )}
        </div>
        <TooltipWrapper content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </TooltipWrapper>
      </div>

      {/* Org Badge */}
      {!collapsed && orgName && (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/40 px-3 py-2">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">{orgName}</p>
            <p className="text-[10px] text-muted-foreground">{orgLabel}</p>
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

      {/* User Section */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name}</p>
                <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-0.5">
          {collapsed ? (
            <TooltipWrapper content="Help & Support" side="right">
              <NavLink
                to="/help"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <HelpCircle className="h-[18px] w-[18px]" />
              </NavLink>
            </TooltipWrapper>
          ) : (
            <NavLink
              to="/help"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <HelpCircle className="h-[18px] w-[18px]" />
              <span>Help & Support</span>
            </NavLink>
          )}
          {collapsed ? (
            <TooltipWrapper content="Sign Out" side="right">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </TooltipWrapper>
          ) : (
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
