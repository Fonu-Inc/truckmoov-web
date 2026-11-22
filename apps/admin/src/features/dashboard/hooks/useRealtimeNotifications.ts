import type { ActivityLog } from "@truckmoov/api/auth";
import type { PlatformNotification } from "@/features/dashboard/utils/notifications";
import { useQuery } from "@tanstack/react-query";
import { getSystemActivityLogQueryOptions } from "@truckmoov/api/auth";
import {
  useCallback, useMemo, useState,
} from "react";

const FEED_LIMIT = 20;

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
 * The bell's state, from the live system activity log. Read and cleared state
 * is local; the feed itself is server-owned.
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

  const notifications = useMemo<PlatformNotification[]>(
    () => (activityQuery.data?.data ?? [])
      .filter(activity => !dismissed.has(activity.id))
      .map(activity => toNotification(
        activity,
        read.has(activity.id),
      )),
    [
      activityQuery.data,
      dismissed,
      read,
    ],
  );
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const markAsRead = useCallback(
    (id: string) => setRead(prev => new Set(prev).add(id)),
    [],
  );

  const markAllAsRead = useCallback(
    () => setRead((prev) => {
      const next = new Set(prev);
      for (const notification of notifications) next.add(notification.id);
      return next;
    }),
    [notifications],
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
