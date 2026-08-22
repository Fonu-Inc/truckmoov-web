import { useQueryClient } from "@tanstack/react-query";
import {
  Building2, Check, ChevronsUpDown,
} from "lucide-react";
import {
  useLocation, useNavigate,
} from "react-router";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  getAllowedRoutes, getSidebarConfig,
} from "@/lib/sidebarConfig";
import { cn } from "@/lib/utils";
import { useActiveOrgStore } from "@/stores/activeOrgStore";
import { useAuthStore } from "@/stores/authStore";

export function OrgSwitcher() {
  const memberships: any[] = [];
  const {
    activeOrgId, setActiveOrg, resolveActiveOrg,
  } = useActiveOrgStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Only show switcher for multi-org users
  if (memberships.length <= 1)
    return null;

  const activeOrg = resolveActiveOrg(memberships);

  const handleSwitch = (orgId: string) => {
    if (orgId === activeOrgId)
      return;
    setActiveOrg(orgId);

    // Invalidate ALL queries to prevent stale cross-org data
    queryClient.invalidateQueries();

    const newConfig = getSidebarConfig(user);
    if (!newConfig)
      return;

    const allowedRoutes = getAllowedRoutes(newConfig);
    const currentPath = location.pathname;
    const isRouteAllowed = allowedRoutes.some(
      route => currentPath === route || currentPath.startsWith(`${route}/`),
    );

    if (!isRouteAllowed) {
      navigate(newConfig.homeRoute);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-border/50 bg-secondary/50 text-sm font-medium"
        >
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="max-w-[140px] truncate">
            {activeOrg?.orgName ?? "Select Org"}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Switch Organization
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map(m => (
          <DropdownMenuItem
            key={m.orgId}
            onClick={() => handleSwitch(m.orgId)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{m.orgName}</p>
              <p className="text-xs text-muted-foreground">
                {m.orgType.replace(
                  /_/g,
                  " ",
                )}
              </p>
            </div>
            <Check
              className={cn(
                "h-4 w-4 text-primary",
                m.orgId === activeOrg?.orgId ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
