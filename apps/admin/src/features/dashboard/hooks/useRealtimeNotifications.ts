import type {
  ActivityLog, AdminNotification,
} from "@truckmoov/api/auth";
import type { PlatformNotification } from "@/features/dashboard/utils/notifications";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminNotificationsQueryOptions,
  getSystemActivityLogQueryOptions,
  useMarkAdminNotificationRead,
  useMarkAllAdminNotificationsRead,
} from "@truckmoov/api/auth";
import {
  useCallback, useMemo, useState,
} from "react";

const FEED_LIMIT = 20;
const ALERT_POLL_MS = 60_000;
/** In-app alert ids are prefixed so they can never collide with activity ids. */
const ALERT_PREFIX = "alert:";

const ALERT_SEVERITY: Record<AdminNotification["severity"], PlatformNotification["severity"]> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "info",
};

function alertToNotification(alert: AdminNotification): PlatformNotification {
  return {
    id: `${ALERT_PREFIX}${alert.id}`,
    type: alert.alertType === "security_alerts" ? "security" : "alert",
    title: alert.title,
    message: alert.body || "Platform alert",
    timestamp: alert.createdAt,
    read: alert.readAt !== null,
    severity: ALERT_SEVERITY[alert.severity] ?? "info",
  };
}

function notificationType(activity: ActivityLog): PlatformNotification["type"] {
  const text = `${activity.service} ${activity.entityType} ${activity.action}`.toLowerCase();
  if (/security|login|auth|password|mfa|two-factor/.test(text))
    return "security";
  if (/alert|incident|error|fail|block/.test(text))
    return "alert";
  if (/payment|invoice|billing|subscription/.test(text))
    return "payment";
  if (/sim/.test(text))
    return "sim_activated";
  if (/device|sensor/.test(text))
    return "device_provisioned";
  if (/tenant|organi[sz]ation|onboarding/.test(text))
    return "tenant_created";
  return "system";
}

function notificationSeverity(activity: ActivityLog): PlatformNotification["severity"] {
  const text = `${activity.action} ${activity.summary}`.toLowerCase();
  if (/fail|error|block|lock|suspicious/.test(text))
    return "error";
  if (/alert|warning|suspend|overdue/.test(text))
    return "warning";
  if (/payment|invoice|success|verified|activated|created/.test(text))
    return "success";
  return "info";
}

function toNotification(activity: ActivityLog, read: boolean): PlatformNotification {
  const type = notificationType(activity);
  return {
    id: activity.id,
    type,
    title: activity.summary,
    message: activity.tenantName || activity.actorName || activity.actorEmail || "System",
    timestamp: activity.occurredAt,
    read,
    severity: notificationSeverity(activity),
    metadata: type === "security" ? { auditEventId: activity.id } : undefined,
  };
}

/**
 * The bell's state: platform alerts routed to the in-app channel (read state
 * kept on the server, polled every minute) plus the live system activity log
 * (read and cleared state local).
 */
export function useRealtimeNotifications() {
  const [
    read,
    setRead,
  ] = useState<Set<string>>(() => new Set());
  const [
    dismissed,
    setDismissed,
  ] = useState<Set<string>>(() => new Set());
  const activityQuery = useQuery(
    getSystemActivityLogQueryOptions({ params: { limit: FEED_LIMIT } }),
  );
  const alertsQuery = useQuery({
    ...getAdminNotificationsQueryOptions({ params: { limit: FEED_LIMIT } }),
    refetchInterval: ALERT_POLL_MS,
  });
  const markAlertRead = useMarkAdminNotificationRead();
  const markAllAlertsRead = useMarkAllAdminNotificationsRead();

  const notifications = useMemo<PlatformNotification[]>(
    () => [
      ...(alertsQuery.data?.data.items ?? []).map(alertToNotification),
      ...(activityQuery.data?.data ?? []).map(activity => toNotification(
        activity,
        read.has(activity.id),
      )),
    ]
      .filter(notification => !dismissed.has(notification.id))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [
      alertsQuery.data,
      activityQuery.data,
      dismissed,
      read,
    ],
  );
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const markAsRead = useCallback(
    (id: string) => {
      if (id.startsWith(ALERT_PREFIX))
        markAlertRead.mutate({ id: id.slice(ALERT_PREFIX.length) });
      else
        setRead(prev => new Set(prev).add(id));
    },
    [markAlertRead],
  );

  const markAllAsRead = useCallback(
    () => {
      if (notifications.some(n => n.id.startsWith(ALERT_PREFIX) && !n.read))
        markAllAlertsRead.mutate();
      setRead((prev) => {
        const next = new Set(prev);
        for (const notification of notifications) next.add(notification.id);
        return next;
      });
    },
    [
      notifications,
      markAllAlertsRead,
    ],
  );

  const clearNotifications = useCallback(
    () => setDismissed((prev) => {
      const next = new Set(prev);
      for (const notification of notifications) next.add(notification.id);
      return next;
    }),
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
