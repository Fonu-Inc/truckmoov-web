import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useActiveOrgStore } from "@/stores/activeOrgStore";
import {
  getDummyNotificationsForStakeholder,
  resolveStakeholderForNotifications,
} from "@/lib/dummyNotifications";

export interface PlatformNotification {
  id: string;
  type: "tenant_created" | "device_provisioned" | "sim_activated" | "alert" | "payment" | "security" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  severity: "info" | "warning" | "error" | "success";
  metadata?: Record<string, any>;
}

export function useRealtimeNotifications() {
  const userRole = useAuthStore((s) => s.user?.role ?? null);
  const orgCtx = useOrgContext();
  const resolveActiveOrg = useActiveOrgStore((s) => s.resolveActiveOrg);
  const activeOrg = resolveActiveOrg(orgCtx.memberships);

  const stakeholder = useMemo(
    () => resolveStakeholderForNotifications({
      userRole,
      orgType: activeOrg?.orgType,
    }),
    [userRole, activeOrg?.orgType],
  );

  const dummySeed = useMemo(
    () => getDummyNotificationsForStakeholder(stakeholder),
    [stakeholder],
  );

  const [notifications, setNotifications] = useState<PlatformNotification[]>(dummySeed);
  const [unreadCount, setUnreadCount] = useState(dummySeed.filter((n) => !n.read).length);

  // Re-seed when stakeholder changes (e.g. user switches org)
  useEffect(() => {
    setNotifications(dummySeed);
    setUnreadCount(dummySeed.filter((n) => !n.read).length);
  }, [dummySeed]);


  // Subscribe to security audit logs for real-time updates
  useEffect(() => {
    const channelName = `platform-notifications-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "security_audit_logs",
        },
        (payload) => {
          const newLog = payload.new as any;
          const notificationType = getNotificationType(newLog.event_type);
          const notification: PlatformNotification = {
            id: newLog.id,
            type: notificationType,
            title: getNotificationTitle(newLog.event_type),
            message: newLog.description,
            timestamp: new Date(newLog.created_at),
            read: false,
            severity: getSeverity(newLog.severity),
            metadata: newLog.metadata,
          };

          setNotifications((prev) => [notification, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);

          // Show toast for important notifications
          if (notification.type === "sim_activated") {
            const activated = newLog.metadata?.activated || 0;
            toast.success(notification.title, {
              description: `${activated} SIM${activated > 1 ? 's' : ''} activated for ${newLog.tenant_name || 'tenant'}`,
            });
          } else if (notification.severity === "error" || notification.severity === "warning") {
            toast[notification.severity === "error" ? "error" : "warning"](
              notification.title,
              { description: notification.message }
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blocked_ips",
        },
        (payload) => {
          const newBlock = payload.new as any;
          const notification: PlatformNotification = {
            id: newBlock.id,
            type: "security",
            title: "IP Address Blocked",
            message: `IP ${newBlock.ip_address} was blocked: ${newBlock.reason}`,
            timestamp: new Date(newBlock.blocked_at),
            read: false,
            severity: "warning",
            metadata: { ip: newBlock.ip_address, reason: newBlock.reason },
          };

          setNotifications((prev) => [notification, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);
          
          toast.warning("IP Address Blocked", {
            description: `${newBlock.ip_address} was blocked`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const addNotification = useCallback((notification: Omit<PlatformNotification, "id" | "timestamp" | "read">) => {
    const newNotification: PlatformNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
    setUnreadCount((prev) => prev + 1);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification,
  };
}

function getNotificationType(eventType: string): PlatformNotification["type"] {
  switch (eventType) {
    case "ip_blocked":
    case "suspicious_activity":
    case "permission_denied":
      return "security";
    case "sim_activated":
      return "sim_activated";
    case "device_provisioned":
      return "device_provisioned";
    case "tenant_created":
      return "tenant_created";
    case "payment_received":
      return "payment";
    default:
      return "system";
  }
}

function getNotificationTitle(eventType: string): string {
  const titles: Record<string, string> = {
    ip_blocked: "IP Address Blocked",
    login_failed: "Failed Login Attempt",
    login_success: "Successful Login",
    permission_denied: "Permission Denied",
    suspicious_activity: "Suspicious Activity Detected",
    data_export: "Data Export",
    sim_activated: "SIM Activation Complete",
    device_provisioned: "Device Provisioned",
    tenant_created: "New Tenant Created",
  };
  return titles[eventType] || "System Event";
}

function getSeverity(severity: string): "info" | "warning" | "error" | "success" {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "high":
      return "error";
    case "medium":
    case "warning":
      return "warning";
    case "low":
    case "info":
      return "info";
    default:
      return "info";
  }
}



