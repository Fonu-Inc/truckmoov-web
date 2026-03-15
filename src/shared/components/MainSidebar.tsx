import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { Building2, ChevronLeft, ChevronRight, HelpCircle, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { getOrgLabel } from "../composables/getOrgLabel";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import MainNavItems from "./MainNavItems";
import { siderbarList } from "../lib/sidebarListItem";
import AppAvatar from "./AppAvatar";
import { NavLink } from "react-router-dom";
import SignOutButton from "./SignOutButton";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationsSettingsQueryOptions, getUserProfileQueryOptions } from "@/features/auth/api";

export default function MainSidebar() {
  // Fetch user Profile
  useQuery(getUserProfileQueryOptions());
  // Fetch Organizations Data
  const { data } = useQuery(getOrganizationsSettingsQueryOptions())

  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore()

  const org = useMemo(() => ({
    label: getOrgLabel(user.role),
    username: user.profile?.fullName ?? "N/A",
    name: data?.data?.branding.organizationName ?? "N/A"
  }), [user, data])



  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-mtn">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">Truckmoov</span>
              <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                {org.label}
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
      {!collapsed && (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/40 px-3 py-2">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">{org.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{org.label}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {siderbarList.map(navlist => (
          <MainNavItems
            key={navlist.label}
            navList={navlist}
            userRole={user.role}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-3">
              <AppAvatar value={org.username} />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{org.username}</p>
                <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                  {org.label}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-0.5">
          <TooltipWrapper content="Help & Support" side="right" displayCondition={collapsed}>
            <NavLink
              to="/help"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <HelpCircle className="h-4.5 w-4.5" />
              {!collapsed && (
                <span>Help & Support</span>
              )}
            </NavLink>
          </TooltipWrapper>
          <TooltipWrapper content="Sign Out" side="right" displayCondition={collapsed}>
            <SignOutButton collapsed={collapsed} />
          </TooltipWrapper>
        </div>
      </div>
    </aside>
  )
}
