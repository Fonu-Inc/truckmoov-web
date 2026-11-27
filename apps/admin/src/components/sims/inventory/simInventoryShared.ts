import type { SystemSimItem } from "@truckmoov/api/auth";
import type { FilterDraft } from "@/components/shadcn/platform-filter-popover";

export const SIM_STATUSES = [
  "active",
  "assigned",
  "unassigned",
  "suspended",
  "registered",
  "deactivated",
] as const;

export const SIM_CARRIERS = [
  "MTN",
  "Airtel",
  "Glo",
  "9mobile",
] as const;

export const SIM_PLANS = [
  "iot_basic",
  "iot_premium",
  "data_only",
  "data_sms",
  "data_sms_voice",
] as const;

export const PLAN_LABELS: Record<string, string> = {
  data_only: "Data Only",
  data_sms: "Data + SMS",
  data_sms_voice: "Data + SMS + Voice",
  iot_basic: "IoT Basic",
  iot_premium: "IoT Premium",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  assigned: "Assigned",
  registered: "Registered",
  unassigned: "Unassigned",
  suspended: "Suspended",
  deactivated: "Deactivated",
};

export const EMPTY_VALUE = "-";

export type SimRow = {
  id: string;
  iccid: string;
  msisdn: string | null;
  imsi: string | null;
  carrier: string;
  plan: string;
  status: string;
  tenant: string | null;
  tenantId: string | null;
  deviceId: string | null;
  deviceImei: string | null;
  dataUsage: number;
  dataLimit: number;
  smsUsage: number;
  smsLimit: number;
  activationDate: string | null;
  expiryDate: string | null;
  lastActivity: string | null;
  suspensionReason: string | null;
  updatedAt: string;
  signalStrength: number | null;
  networkType: string | null;
  roaming: boolean;
  monthlyCost: number;
};

export type SimLookups = {
  tenantNames: Map<string, string>;
  deviceImeis: Map<string, string>;
};

export function mapSimToRow(sim: SystemSimItem, lookups: SimLookups): SimRow {
  return {
    id: sim.id,
    iccid: sim.iccid,
    msisdn: sim.msisdn,
    imsi: sim.imsi,
    carrier: sim.carrier,
    plan: sim.plan,
    status: sim.status,
    tenant: sim.tenantId ? sim.tenantName ?? lookups.tenantNames.get(sim.tenantId) ?? sim.tenantId : null,
    tenantId: sim.tenantId,
    deviceId: sim.deviceId,
    deviceImei: sim.deviceId ? lookups.deviceImeis.get(sim.deviceId) ?? sim.deviceImei : null,
    dataUsage: sim.dataUsageMb,
    dataLimit: sim.dataLimitMb,
    smsUsage: sim.smsUsage,
    smsLimit: sim.smsLimit,
    activationDate: sim.activationDate,
    expiryDate: sim.expiryDate,
    lastActivity: sim.lastActivity,
    suspensionReason: sim.suspensionReason,
    updatedAt: sim.updatedAt,
    signalStrength: sim.signalStrength,
    networkType: sim.networkType,
    roaming: sim.roaming,
    monthlyCost: sim.monthlyCostNgn,
  };
}

export function getCarrierOptions(byCarrier: Record<string, number> = {}) {
  return [
    ...new Set([
      ...SIM_CARRIERS,
      ...Object.keys(byCarrier),
    ]),
  ];
}

export function getUsagePercentage(usage: number, limit: number) {
  return limit > 0 ? Math.min(
    (usage / limit) * 100,
    100,
  ) : 0;
}

export function canSuspend(sim: SimRow) {
  return Boolean(sim.tenantId) && (sim.status === "active" || sim.status === "assigned");
}

export function canReinstate(sim: SimRow) {
  return sim.status === "suspended";
}

export function formatNgn(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export function canActivate(sim: SimRow) {
  return Boolean(sim.tenantId) && sim.status !== "active";
}

export function canDelete(sim: SimRow) {
  return !sim.tenantId && !sim.deviceId;
}

export const EMPTY_SIM_FILTERS: FilterDraft = {
  carrier: { enabled: false },
  tenant: { enabled: false },
};
