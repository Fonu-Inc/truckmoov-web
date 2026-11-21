import type { PlatformNotification } from "@/features/dashboard/utils/dummyNotifications";
import {
  useCallback, useState,
} from "react";
import { getPlatformAdminNotifications } from "@/features/dashboard/utils/dummyNotifications";

/**
 * The bell's state, as fleetflow's `useRealtimeNotifications` — minus its
 * Supabase `security_audit_logs` / `blocked_ips` subscription, which has no
 * equivalent feed in `@truckmoov/api` yet. Read/clear are local only.
 */
export function useRealtimeNotifications() {
  const [
    notifications,
    setNotifications,
  ] = useState<PlatformNotification[]>(getPlatformAdminNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications(prev => prev.map(n => (n.id === id ? {
        ...n, read: true,
      } : n)));
    },
    [],
  );

  const markAllAsRead = useCallback(
    () => {
      setNotifications(prev => prev.map(n => ({
        ...n, read: true,
      })));
    },
    [],
  );

  const clearNotifications = useCallback(
    () => setNotifications([]),
    [],
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
