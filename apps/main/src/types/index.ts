// User Roles
// Legacy roles kept for DB enum compatibility; frontend permission checks now use org-scoped roles.
export type UserRole = "platform_admin" | "tenant_admin" | "operations_manager" | "supervisor" | "dispatcher" | "viewer_finance" | "driver" | "installer";

// ── Org-scoped role key (canonical) ──
export type OrgRoleKey = "ADMIN" | "OPERATIONS_MANAGER" | "DISPATCHER" | "FINANCE" | "VIEWER";

// Legacy role → org role key mapping (used during transition)
export function legacyRoleToOrgRoleKey(role: UserRole): OrgRoleKey {
  switch (role) {
    case "platform_admin": return "ADMIN";
    case "tenant_admin": return "ADMIN";
    case "operations_manager": return "OPERATIONS_MANAGER";
    case "supervisor": return "DISPATCHER";
    case "dispatcher": return "DISPATCHER";
    case "viewer_finance": return "FINANCE";
    case "driver": return "VIEWER";
    case "installer": return "VIEWER";
    default: return "VIEWER";
  }
}

// Device permission roles (org-scoped: ADMIN, OPERATIONS_MANAGER can manage; DISPATCHER, FINANCE can view)
export type DeviceManageRole = "tenant_admin" | "operations_manager" | "platform_admin";
export type DeviceViewRole = "tenant_admin" | "operations_manager" | "dispatcher" | "platform_admin" | "viewer_finance";

// SIM permission roles
export type SIMRequestRole = "tenant_admin";
export type SIMApproveRole = "platform_admin";
export type SIMViewRole = "tenant_admin" | "operations_manager" | "dispatcher" | "platform_admin" | "viewer_finance" | "supervisor";
export type SIMAssignRole = "tenant_admin";

// Role permission helpers - Devices (kept for backward compat, prefer org-scoped checks)
export function canManageDevices(role: UserRole): boolean {
  return [
    "tenant_admin",
    "operations_manager",
    "platform_admin",
  ].includes(role);
}

export function canViewDevices(role: UserRole): boolean {
  return [
    "tenant_admin",
    "operations_manager",
    "dispatcher",
    "platform_admin",
    "viewer_finance",
  ].includes(role);
}

// Role permission helpers - SIM Management
export function canRequestSimActivation(role: UserRole): boolean {
  return role === "tenant_admin";
}

export function canApproveSimRequests(role: UserRole): boolean {
  return role === "platform_admin";
}

export function canConfigureFonu(role: UserRole): boolean {
  return role === "platform_admin";
}

export function canViewSims(role: UserRole): boolean {
  return [
    "tenant_admin",
    "operations_manager",
    "dispatcher",
    "platform_admin",
    "viewer_finance",
    "supervisor",
  ].includes(role);
}

export function canAssignSimToDevice(role: UserRole): boolean {
  return role === "tenant_admin";
}

export function canViewSimUsageData(role: UserRole): boolean {
  return [
    "platform_admin",
    "viewer_finance",
    "tenant_admin",
  ].includes(role);
}

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  avatar?: string;
  phone?: string;
  createdAt: Date;
};

// Tenant/Organization
export type Tenant = {
  id: string;
  name: string;
  logo?: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "suspended" | "pending";
  vehicleCount: number;
  driverCount: number;
  createdAt: Date;
};

// Vehicle
export type Vehicle = {
  id: string;
  plateNumber?: string;
  vin: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: "truck" | "van" | "trailer";
  status: "active" | "inactive" | "maintenance" | "decommissioned";
  capacity: number;
  capacityUnit?: "kg" | "lb" | "tons" | "m3" | "pallets";
  currentDriver?: string;
  deviceId?: string;
  location?: {
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    lastUpdate: Date;
  };
  fuelLevel?: number;
};

// Driver
export type Driver = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiry: Date;
  status: "active" | "available" | "offline" | "suspended";
  rating: number;
  totalTrips: number;
  currentVehicle?: string;
  communicationPreference: "whatsapp" | "sms" | "email" | "voice";
};

// IoT Device
export type IoTDevice = {
  id: string;
  imei: string;
  manufacturer: string;
  model: string;
  status: "registered" | "configured" | "assigned" | "active" | "faulty" | "decommissioned";
  vehicleId?: string;
  simId?: string;
  firmwareVersion: string;
  lastSeen?: Date;
  signalStrength?: number;
  batteryLevel?: number;
};

// SIM Card
export type SIMCard = {
  id: string;
  iccid: string;
  imsi: string;
  mobileNumber: string;
  networkOperator: string;
  status: "registered" | "active" | "assigned" | "suspended" | "deactivated";
  dataUsage: number;
  dataLimit: number;
  deviceId?: string;
  fonuSimId?: string | null;
  fonuStatus?: string | null;
};

// Job/Dispatch
export type Job = {
  id: string;
  reference: string;
  status: "created" | "assigned" | "accepted" | "in_progress" | "completed" | "cancelled";
  pickup: {
    address: string;
    lat: number;
    lng: number;
  };
  delivery: {
    address: string;
    lat: number;
    lng: number;
  };
  cargo: {
    type: string;
    weight: number;
    description: string;
  };
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleId?: string;
  amount: number;
  deadline: Date;
  createdAt: Date;
};

// Alert
export type Alert = {
  id: string;
  type: "geofence" | "speed" | "maintenance" | "fuel" | "sos" | "offline";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  vehicleId: string;
  driverId?: string;
  timestamp: Date;
  acknowledged: boolean;
};

// Communication Message
export type Message = {
  id: string;
  channel: "whatsapp" | "sms" | "email" | "voice";
  direction: "inbound" | "outbound";
  recipient: string;
  content: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  timestamp: Date;
  driverId?: string;
};

// Analytics
export type FleetMetrics = {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalTrips: number;
  completedTrips: number;
  totalDistance: number;
  fuelConsumed: number;
  avgFuelEfficiency: number;
  onTimeDelivery: number;
};
