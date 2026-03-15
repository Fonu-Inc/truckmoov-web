import { useOrgContext } from '@/hooks/useOrgContext';
import { useActiveOrgStore } from '@/stores/activeOrgStore';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getSidebarConfig, getAllowedRoutes } from '@/lib/sidebarConfig';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { toStakeholderType } from '@/features/auth/lib/roleUtils';

export function OrgSwitcher() {
  const { memberships } = useOrgContext();
  const { activeOrgId, setActiveOrg, resolveActiveOrg } = useActiveOrgStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const { enabled: flagEnabled } = useFeatureFlag('enable_multi_stakeholder_model', user?.tenantId);
  const roleStakeholder = toStakeholderType(user?.role);
  const multiStakeholderEnabled = flagEnabled || !!roleStakeholder;

  // Only show switcher for multi-org users
  if (memberships.length <= 1) return null;

  const activeOrg = resolveActiveOrg(memberships);

  const handleSwitch = (orgId: string) => {
    if (orgId === activeOrgId) return;
    setActiveOrg(orgId);

    // Invalidate ALL queries to prevent stale cross-org data
    queryClient.invalidateQueries();

    // Determine if the current route is allowed in the new org's sidebar
    const newOrg = memberships.find(m => m.orgId === orgId) ?? null;
    const newConfig = getSidebarConfig(user, newOrg, multiStakeholderEnabled);
    const allowedRoutes = getAllowedRoutes(newConfig);

    const currentPath = location.pathname;
    const isRouteAllowed = allowedRoutes.some(
      (route) => currentPath === route || currentPath.startsWith(route + '/')
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
            {activeOrg?.orgName ?? 'Select Org'}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Switch Organization
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.orgId}
            onClick={() => handleSwitch(m.orgId)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{m.orgName}</p>
              <p className="text-xs text-muted-foreground">{m.orgType.replace(/_/g, ' ')}</p>
            </div>
            <Check
              className={cn(
                'h-4 w-4 text-primary',
                m.orgId === activeOrg?.orgId ? 'opacity-100' : 'opacity-0'
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
