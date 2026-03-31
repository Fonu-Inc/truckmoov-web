import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRole } from "@/features/auth/api/types";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import { useAuthStore } from "@/stores/authStore";
import { AlertTriangle, Truck } from "lucide-react";
import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";

type FleetTab = {
  label: string;
  icon: any;
  to: string;
  roleWithAccess: UserRole[];
};

const FLEET_TAB_LIST: FleetTab[] = [
  {
    label: "Vehicles",
    icon: Truck,
    to: APP_ROUTES.fleet,
    roleWithAccess: ["ENTERPRISE_ADMIN", "OWNER_OPERATOR", "FLEET_ADMIN", "OPERATIONS_MANAGER", "FINANCE_VIEWER"],
  },
  {
    label: "Incidents",
    icon: AlertTriangle,
    to: APP_ROUTES.fleetIncidents,
    roleWithAccess: ["FLEET_ADMIN"],
  },
];

function getActiveTabLabel(tabs: FleetTab[], pathname: string) {
  const candidates: Array<{ tab: FleetTab; score: number }> = [];

  for (const tab of tabs) {
    if (pathname === tab.to) candidates.push({ tab, score: tab.to.length });
    else if (tab.to !== "/" && pathname.startsWith(`${tab.to}/`)) candidates.push({ tab, score: tab.to.length });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.tab.label;
}

export default function FleetTabs() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();

  const visibleTabs = useMemo(() => {
    if (!user?.role) return [];
    return FLEET_TAB_LIST.filter((tab) => tab.roleWithAccess.includes(user.role));
  }, [user?.role]);

  const activeTab = useMemo(() => {
    const label = getActiveTabLabel(visibleTabs, pathname);
    return label ?? visibleTabs[0]?.label ?? "";
  }, [pathname, visibleTabs]);

  if (visibleTabs.length === 0) return null;

  return (
    <Tabs value={activeTab} className="space-y-6">
      <TabsList className="bg-muted/50 flex flex-wrap gap-1 h-auto p-1">
        {visibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.label}
            value={tab.label}
            className="flex items-center gap-2 disabled:cursor-not-allowed"
            asChild
          >
            <NavLink to={tab.to} aria-disabled={!tab.to}>
              <tab.icon className="h-4 w-4" />
              <p className="hidden sm:inline capitalize">{tab.label}</p>
            </NavLink>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
