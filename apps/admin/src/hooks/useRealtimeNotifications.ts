import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  getDummyNotificationsForStakeholder,
  resolveStakeholderForNotifications,
} from "@/lib/dummyNotifications";
import { useActiveOrgStore } from "@/stores/activeOrgStore";
import { useAuthStore } from "@/stores/authStore";

export type PlatformNotification = {
  id: string;
  type: "tenant_created" | "device_provisioned" | "sim_activated" | "alert" | "payment" | "security" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  severity: "info" | "warning" | "error" | "success";
  metadata?: Record<string, any>;
};

export function useRealtimeNotifications() {
  const userRole = useAuthStore(s => s.user?.role ?? null);
  const resolveActiveOrg = useActiveOrgStore(s => s.resolveActiveOrg);
  const activeOrg = resolveActiveOrg([]);

  const stakeholder = useMemo(
    () => resolveStakeholderForNotifications({
      userRole,
      orgType: activeOrg?.orgType,
    }),
    [
      userRole,
      activeOrg?.orgType,
    ],
  );

  const dummySeed = useMemo(
    () => getDummyNotificationsForStakeholder(stakeholder),
    [stakeholder],
  );

  const [
    notifications,
    setNotifications,
  ] = useState<PlatformNotification[]>(dummySeed);
  const [
    unreadCount,
    setUnreadCount,
  ] = useState(dummySeed.filter(n => !n.read).length);

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications(prev =>
        prev.map(n => (n.id === id
          ? {
              ...n,
              read: true,
            }
          : n)));
      setUnreadCount(prev => Math.max(
        0,
        prev - 1,
      ));
    },
    [],
  );

  const markAllAsRead = useCallback(
    () => {
      setNotifications(prev => prev.map(n => ({
        ...n,
        read: true,
      })));
      setUnreadCount(0);
    },
    [],
  );

  const clearNotifications = useCallback(
    () => {
      setNotifications([]);
      setUnreadCount(0);
    },
    [],
  );

  const addNotification = useCallback(
    (notification: Omit<PlatformNotification, "id" | "timestamp" | "read">) => {
      const newNotification: PlatformNotification = {
        ...notification,
        id: `notif-${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications(prev => [
        newNotification,
        ...prev,
      ].slice(
        0,
        50,
      ));
      setUnreadCount(prev => prev + 1);
    },
    [],
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification,
  };
}
