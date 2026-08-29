export type SecurityEvent = {
  id: string;
  eventType: "password_change" | "mfa_enabled" | "mfa_disabled" | "api_key_created" | "api_key_revoked" | "permission_change" | "account_locked" | "account_unlocked" | "suspicious_login" | "data_export";
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  userEmail?: string;
  userName?: string;
  tenant: string;
  tenantId: string;
  description: string;
  ipAddress: string;
  timestamp: string;
  metadata?: Record<string, string>;
};

export type FailedAttempt = {
  id: string;
  email: string;
  ipAddress: string;
  location: string;
  reason: "invalid_password" | "user_not_found" | "account_locked" | "mfa_failed" | "suspicious_activity";
  attempts: number;
  timestamp: string;
  blocked: boolean;
};

export type LoginEvent = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  tenant: string;
  tenantId: string;
  eventType: "login" | "logout" | "session_refresh";
  status: "success" | "failed";
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  timestamp: string;
  sessionDuration?: string;
};

export type BlockedIP = {
  id: string;
  ip_address: string;
  reason: string;
  blocked_by: string;
  blocked_at: string;
  expires_at: string | null;
  is_permanent: boolean;
  tenant_id: string | null;
  metadata?: Record<string, any>;
};

export type IPGeolocation = {
  countryCode: string;
  country: string;
  city: string;
  isp: string;
  threat: {
    threatLevel: "low" | "medium" | "high" | "critical";
    isProxy: boolean;
    isDatacenter: boolean;
  };
};
