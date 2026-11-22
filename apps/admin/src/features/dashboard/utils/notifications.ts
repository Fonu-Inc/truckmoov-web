/**
 * The top-bar bell's view model. The feed is the live system activity log;
 * read/clear state is local to the browser.
 */
export type PlatformNotification = {
  id: string;
  type: "tenant_created" | "device_provisioned" | "sim_activated" | "alert" | "payment" | "security" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: "info" | "warning" | "error" | "success";
  metadata?: Record<string, unknown>;
};

/** The audit page's deep link for a system activity-log entry. */
export function auditEventHref(id: string) {
  return `/audit-compliance?view=security&event=${encodeURIComponent(id)}`;
}
