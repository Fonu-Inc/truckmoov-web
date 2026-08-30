import { useConsoleAuditLog } from "@truckmoov/api/console";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Key, Webhook,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ScrollArea } from "@/components/shadcn/scroll-area";

export default function AuditPage() {
  const {
    data: auditResponse, isLoading, isError, refetch,
  } = useConsoleAuditLog();
  const auditLogs = auditResponse?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Audit Log</CardTitle>
        <CardDescription>
          Track all API key and webhook configuration changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading
          ? (
              <p className="text-muted-foreground">Loading...</p>
            )
          : isError
            ? (
                <p className="text-sm text-muted-foreground">
                  Couldn't load the audit log.
                  {" "}
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                </p>
              )
            : auditLogs.length === 0
              ? (
                  <p className="text-muted-foreground">No audit events recorded</p>
                )
              : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {auditLogs.map(log => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            {log.resourceType === "api_key"
                              ? (
                                  <Key className="h-4 w-4" />
                                )
                              : (
                                  <Webhook className="h-4 w-4" />
                                )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {/* ponytail: the audit entry carries no actor name, only
                                actorId — show the id until the API resolves one. */}
                              <span className="font-medium text-sm">{log.actorId || "—"}</span>
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                {log.action}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {log.resourceType}
                              {" "}
                              •
                              {formatWithPattern(
                                log.occurredAt,
                                "MMM d, yyyy HH:mm:ss",
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
      </CardContent>
    </Card>
  );
}
