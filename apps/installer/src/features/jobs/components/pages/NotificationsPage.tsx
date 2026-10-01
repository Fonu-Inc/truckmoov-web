import {
  useInstallerNotifications,
  useMarkAllInstallerNotificationsRead,
  useMarkInstallerNotificationRead,
} from "@truckmoov/api/auth";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router";
import { QueryState } from "@/components/QueryState";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";

function fmt(iso: string) {
  return new Date(iso).toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

/** GET /auth/installer/notifications — newest first. ponytail: first page only; add paging when installers pile up more than a page. */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useInstallerNotifications();
  const markRead = useMarkInstallerNotificationRead();
  const markAllRead = useMarkAllInstallerNotificationsRead();
  const page = notifications.data?.data;
  const items = page?.items ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          All Notifications
          {!!page?.unreadCount && <Badge>{page.unreadCount}</Badge>}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          loading={markAllRead.isPending}
          disabled={!page?.unreadCount}
        >
          Mark all as read
        </Button>
      </CardHeader>
      <CardContent>
        <QueryState
          query={notifications}
          isEmpty={!items.length}
          empty="You have no notifications."
          hint="Job offers, schedule changes and ticket updates appear here."
          errorMessage="Unable to load your notifications."
          skeleton={(
            <div className="space-y-3">
              {[
                0,
                1,
                2,
              ].map(i => (
                <Skeleton
                  key={i}
                  className="h-20 w-full rounded-2xl"
                />
              ))}
            </div>
          )}
        >
          <div className="space-y-3">
            {items.map(n => (
              <div
                key={n.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4",
                  !n.read && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="flex gap-3">
                  <Bell className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.read && (
                        <Badge
                          variant="secondary"
                          className="rounded-full"
                        >
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{fmt(n.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {n.jobId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/jobs/${n.jobId}`)}
                    >
                      View Job
                    </Button>
                  )}
                  {!n.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markRead.mutate({ id: n.id })}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </QueryState>
      </CardContent>
    </Card>
  );
}
