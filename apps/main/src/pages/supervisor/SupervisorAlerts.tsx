import { formatTime } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  SlidersHorizontal as Filter,
  Info,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { cn } from "@/lib/utils";

export default function SupervisorAlerts() {
  const alerts: any[] = [];
  const unacknowledgedAlerts: any[] = [];
  const criticalAlerts: any[] = [];
  const isLoading = false;
  const refetch = async (...args: any[]) => {};
  const acknowledgeAlert = async (...args: any[]) => {};

  const [
    severityFilter,
    setSeverityFilter,
  ] = useState<string>("all");
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    localDismissed,
    setLocalDismissed,
  ] = useState<Set<string>>(new Set());

  const filteredAlerts = alerts
    .filter(alert => !localDismissed.has(alert.id))
    .filter((alert) => {
      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
      const matchesSearch
        = alert.type.toLowerCase().includes(searchQuery.toLowerCase())
          || alert.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesSearch;
    });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "high":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case "medium":
        return <Info className="h-5 w-5 text-primary" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-warning/10 text-warning border-warning/30">High</Badge>;
      case "medium":
        return <Badge className="bg-primary/10 text-primary border-primary/30">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const dismissAlert = (alertId: string) => {
    setLocalDismissed(prev => new Set(prev).add(alertId));
  };

  const acknowledgeAllAlerts = async () => {
    for (const alert of unacknowledgedAlerts) {
      await acknowledgeAlert(alert.id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Alerts Center"
        subtitle="Loading..."
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Alerts Center"
      subtitle="Real-time fleet alerts and notifications"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Alerts</p>
                  <p className="text-2xl font-bold">{alerts.length}</p>
                </div>
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unacknowledged</p>
                  <p className="text-2xl font-bold text-warning">{unacknowledgedAlerts.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical/High</p>
                  <p className="text-2xl font-bold text-destructive">{criticalAlerts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Update</p>
                  <p className="text-lg font-bold">{formatTime(new Date())}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refetch}
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Real-Time Alerts</CardTitle>
              <Button
                variant="outline"
                onClick={acknowledgeAllAlerts}
                disabled={unacknowledgedAlerts.length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Acknowledge All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={severityFilter}
                onValueChange={setSeverityFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
              {filteredAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
                    alert.acknowledged ? "border-border bg-muted/30" : "border-warning/50 bg-warning/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold capitalize">
                          {alert.type.replace(
                            /_/g,
                            " ",
                          )}
                        </p>
                        {getSeverityBadge(alert.severity)}
                        {alert.acknowledged && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredAlerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No alerts found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
