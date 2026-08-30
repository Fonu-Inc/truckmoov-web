import {
  useApiKeys, useConsoleAuditLog, useConsoleWebhooks,
} from "@truckmoov/api/console";
import {
  Activity, Key, Webhook,
} from "lucide-react";
import {
  NavLink, Outlet,
} from "react-router";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DEVELOPER_PORTAL_TABS } from "@/features/integration/utils/integrationsNav";
import { cn } from "@/lib/utils";

/**
 * Pathless developer-portal layout — renders three overview cards and the
 * inner tab bar, then its <Outlet /> for the selected tab. Sits inside
 * IntegrationsLayout so the outer "Developer Portal" tab stays active for
 * every sub-route.
 */
export function DeveloperPortalLayout() {
  const { data: keysResponse } = useApiKeys();
  const { data: webhooksResponse } = useConsoleWebhooks();
  const { data: auditResponse } = useConsoleAuditLog();

  const apiKeys = keysResponse?.data ?? [];
  const subscriptions = webhooksResponse?.data ?? [];
  const auditLogs = auditResponse?.data ?? [];

  const activeKeysCount = apiKeys.filter(k => k.status === "active").length;
  const enabledWebhooksCount = subscriptions.filter(w => w.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeKeysCount}</div>
            <p className="text-xs text-muted-foreground">Active keys</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledWebhooksCount}</div>
            <p className="text-xs text-muted-foreground">Enabled subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">Integration events</p>
          </CardContent>
        </Card>
      </div>

      <nav
        aria-label="Developer Portal sections"
        className="overflow-x-auto pb-2"
      >
        <div className="inline-flex bg-muted/50 text-muted-foreground gap-1 h-auto rounded-md p-1 flex-nowrap">
          {DEVELOPER_PORTAL_TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => cn(
                "shrink-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
                "hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
