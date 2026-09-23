import { Bell } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  useJobsStore,
  useMyNotifications,
} from "@/features/jobs/stores/jobsStore";
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

export default function NotificationsPage() {
  const navigate = useNavigate();
  const myNotifications = useMyNotifications();
  const markRead = useJobsStore(s => s.markNotificationRead);
  const markAllRead = useJobsStore(s => s.markAllNotificationsRead);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          All Notifications
          <Badge
            variant="outline"
            className="text-[10px]"
          >
            Demo data
          </Badge>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
        >
          Mark all as read
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {myNotifications.map(n => (
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
                <p className="text-xs text-muted-foreground">{n.message}</p>
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
                  onClick={() => markRead(n.id)}
                >
                  Mark read
                </Button>
              )}
            </div>
          </div>
        ))}
        {myNotifications.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            You have no notifications.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
